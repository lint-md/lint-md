# 架构重构计划

> 更新日期：2026-06-19
> 前置工作：npm-run-all2 修复、lint/typecheck/prepublishOnly 脚本、CI 全链路校验、TextScanner 抽象均已完成。

---

## 依赖关系

```
A1 (Rule Context Interface)  ← 基础，必须先做
  ├──> A2 (Rule Catalog)
  ├──> A3 (Lint Session)
  └──> A5 (Fix Pipeline)

B (增量重构) ← 无依赖，可随时穿插
  B1 → B2 → B3 → B4 → B5 → B6
```

---

## A1. Rule Context Interface

**Files**: `src/types.ts`, `src/utils/rule-manager.ts`, `src/rules/*.ts`

### 当前问题

1. `options: Record<string, any>` 无类型安全，规则取值靠手写解构，拼写错误静默返回 undefined
2. context 暴露 `ast` 字段，但 17 条规则无一使用
3. `LintMdRuleConfig` 是 3 种格式的 union（`number | [number, options] | [rule, number, options]`），调用方需要记忆
4. 规则无法声明自己的默认 severity/options，所有规则默认 severity=ERROR，options= {}

### 改动方案

1. **`LintMdRule<TOptions>` 泛型化**
   ```typescript
   interface LintMdRule<TOptions = Record<string, unknown>> {
     meta: {
       name: string
       defaultSeverity?: RULE_SEVERITY
       defaultOptions?: TOptions
     }
     create: (context: LintMdRuleContext<TOptions>) => Record<string, (node: MarkdownNode) => void>
   }
   ```

2. **收紧 `LintMdRuleContext`**
   - 移除 `ast` 字段（无规则使用）
   - `markdown` 重命名为 `source`（语义更明确）
   - `options` 泛型化为 `TOptions`
   ```typescript
   interface LintMdRuleContext<TOptions = Record<string, unknown>> {
     report: (option: Omit<ReportOption, 'content' | 'name'>) => void
     options: TOptions
     source: string
   }
   ```

3. **`LintMdRuleConfig` 改为 discriminated union**
   ```typescript
   type LintMdRuleConfig =
     | number
     | { severity: number; options?: Record<string, unknown> }
     | { rule: LintMdRule; severity: number; options?: Record<string, unknown> }
   ```

4. **所有 17 条规则补充 typed options + meta defaults**
   - `no-long-code`: `NoLongCodeOptions = { length: number; exclude?: string[] }`
   - 其他规则如有 options 也逐个定义

### 收益

- 第三方规则接入有明确 contract，IDE 可补全
- `defaultOptions` 防止 `undefined` 导致的静默 bug
- 移除 `ast` 缩小规则的攻击面

### 风险

- Breaking change：第三方可访问 `context.ast` 的规则会受影响
- 需要更新所有 17 条内置规则

---

## A2. Rule Catalog

**Files**: `src/utils/override-default-rules.ts`, `src/rules/index.ts`, `src/core/lint-markdown.ts`

### 当前问题

1. 所有内置规则默认 severity=ERROR，无粒度
2. 用户写错规则名（如 `"no-emty-list"`）静默忽略，不报错
3. 第三方规则用 3 元素 tuple `[rule, severity, options]`，位置参数脆弱
4. `rules/index.ts` 是静态 barrel export，无插件机制
5. `severity` 类型是 `number`，不强制为 `RULE_SEVERITY` 枚举值

### 改动方案

1. **新建 `RuleRegistry` 模块**（`src/utils/rule-registry.ts`）
   ```typescript
   class RuleRegistry {
     register(rule: LintMdRule): void
     resolve(userConfig: LintMdRulesConfig): RegisteredRules
     getByName(name: string): LintMdRule | undefined
   }
   ```

2. **配置解析增加校验**
   - 未知规则名抛出 warning（或 console.warn）
   - severity 值校验（仅允许 0/1/2）

3. **第三方规则改为 named config**
   ```typescript
   // 旧
   { 'my-rule': [myRule, 2, { threshold: 5 }] }
   // 新
   { 'my-rule': { rule: myRule, severity: 2, options: { threshold: 5 } } }
   ```

4. **`overrideDefaultRules` 重构为纯函数**
   - 输入：`(defaultRules, userConfig)` → 输出：`resolvedConfig`
   - 配置合并逻辑集中在 RuleRegistry

### 收益

- 规则自文档化默认值
- 校验防止静默配置错误
- RuleRegistry 为未来插件系统打基础

---

## A3. Lint Session

**Files**: `src/core/run-lint.ts`, `src/utils/emitter.ts`, `src/utils/traverser.ts`

### 当前问题

1. emitter 无 `off` / 错误隔离，一个规则抛异常中断同类型其他规则
2. traverser 无 `skipChildren`，无法短路遍历
3. 错误被 `console.error` 吞掉，调用方无法感知
4. `runLint` 返回 `{ ruleManager }`，调用方需自行拆解数据
5. `onLeave` 已定义但未使用

### 改动方案

1. **emitter 增强**
   ```typescript
   class Emitter {
     on(type: string, handler: Function): void
     off(type: string, handler: Function): void
     emit(type: string, ...args: any[]): void  // 内部 catch，收集 errors
     getErrors(): Error[]
   }
   ```

2. **traverser 支持 skipChildren**
   ```typescript
   onEnter?: (node: MarkdownNode, parent: MarkdownNode) => boolean | void
   // 返回 false 时跳过子节点
   ```

3. **返回 `LintSessionResult`**
   ```typescript
   interface LintSessionResult {
     reportData: ReportOption[]
     fixes: FixConfig[]
     errors: Error[]
   }
   ```

4. **移除或完成 `onLeave`**
   - 建议移除（YAGNI），目前无规则需要

### 收益

- 错误可见，不再静默降级
- `skipChildren` 支持性能优化（如跳过嵌套代码块内的代码块）
- 结构化结果防止数据访问 bug

---

## A5. Fix Pipeline

**Files**: `src/core/handle-fix-mode.ts`, `src/utils/apply-fix.ts`, `src/utils/fixer.ts`

### 当前问题

1. fix 冲突按位置排序，不考虑规则优先级
2. `TextRange = number[]` 无长度约束
3. `notAppliedFixes` 达到最大轮次时静默丢弃
4. `applyFix` 原地修改输入数组（`fixes.sort(...)`）
5. fix 排序中相同 start 时短 range 优先，不一定正确

### 改动方案

1. **fix 排序加入 severity 权重**
   ```typescript
   // 旧：按 (start, end) 排序
   // 新：按 (start, end, -severity) 排序，高优先级规则赢
   ```

2. **`TextRange` 改为 tuple**
   ```typescript
   type TextRange = [number, number]  // 替代 number[]
   ```

3. **未应用 fix 转为 warnings**
   ```typescript
   interface FixPipelineResult {
     appliedFixes: FixConfig[]
     skippedFixes: FixConfig[]
     skippedReason: 'overlap' | 'max_iterations'
     iterations: number
   }
   ```

4. **不可变处理**
   ```typescript
   // 旧：fixes.sort(...)
   // 新：[...fixes].sort(...) 或 fixes.toSorted(...)
   ```

5. **可选：interval tree 替代线性扫描**
   - 当前 O(n²) 的冲突检测改为 O(n log n)
   - 优先级低，可后续优化

### 收益

- 优先级冲突解决更可预测
- 暴露 `skippedFixes` 防止静默数据丢失
- tuple 类型防止结构性 bug

---

## B. 增量重构（小步、低风险、可随时穿插）

> 这些任务可以在 A1-A5 之间穿插做，不阻塞架构主线。

### B1. TextScanner 单元测试

**Files**: `__tests__/unit/utils/text-scanner.spec.ts`（新建）

当前 TextScanner 通过 rule 测试间接验证，缺少直接单元测试。需要覆盖：

- `toMatch(index, length)` 正常匹配
- `toMatch(secondLineIndex, length)` 多行位置
- `findAllMatches(/[０-９]+/g)` 正常匹配
- `findAllMatches(/\b/g)` 零长度正则防御
- `findAllOccurrences('')` 空字符串防御
- `forEachChar()` 基本遍历

### B2. RuleTester / Test Helpers

**Files**: `__tests__/utils/test-helpers.ts`（新建）

现有测试中大量重复模式：

```typescript
const { lintResult } = fixer(md);
const reports = lintResult.ruleManager.getReportData();
expect(reports.length).toStrictEqual(1);
expect(reports[0].loc.start.line).toStrictEqual(2);
```

抽成 helper：

```typescript
expectSingleReport(md, { line: 2, column: 5 })
expectReportCount(md, count)
expectReportLocation(md, index, loc)
```

### B3. Report Helpers

**Files**: `src/utils/report-helpers.ts`（新建）

统一 report + fix 的重复结构：

```typescript
reportReplacement(context, match, message, replacement)
reportRemoval(context, match, message)
reportInsertAt(context, pos, message, text)
```

迁移顺序：先迁移 `no-special-characters` 或 `no-full-width-number` 一条规则。

### B4. char-helper 增强

**Files**: `src/utils/char-helper.ts`（新建或扩展）

迁移一个函数到工具模块：

```typescript
isHorizontalWhitespace(char: string): boolean
```

从 `space-around-number.ts` 中提取，补测试。后续可继续迁移 `isChineseCharacter` 等。

### B5. 分离判断/报告逻辑

将 rule 拆成纯函数 + 报告函数：

```typescript
// 纯函数：输入文本，输出违规列表
function findViolations(value: string): Violation[] {
  const scanner = new TextScanner(...)
  return scanner.findAllMatches(/[０-９]+/g).map(m => ({
    index: m.index, length: m.length,
    message: '不能用全角数字', replacement: toHalfWidth(m)
  }))
}

// 测试只需要：
expect(findFullWidthNumbers('１００')).toEqual([{ index: 0, length: 3, ... }])
```

rule 本身只剩：

```typescript
create: (context) => ({
  text: (node) => {
    findViolations(node.value).forEach(v => reportViolation(context, node, v))
  }
})
```

### B6. createTextRule 框架（暂缓）

等 B3-B5 完成后，模式稳定了再考虑。避免过早抽象。

---

## 执行顺序

```
Phase 0: 增量重构（可随时穿插，无依赖）
  B1 TextScanner 单元测试
  B2 RuleTester helpers
  B3 Report helpers → 迁移 1 条规则
  B4 isHorizontalWhitespace → char-helper
  B5 分离判断/报告逻辑 → 逐规则迁移
  B6 createTextRule（观望）

Phase 1: 架构主线（有依赖）
  A1 Rule Context Interface（基础）
    ├──> A2 Rule Catalog
    ├──> A3 Lint Session
    └──> A5 Fix Pipeline
```

---

## 状态

| # | 任务 | 状态 |
|---|------|------|
| B1 | TextScanner 单元测试 | ⬜ pending |
| B2 | RuleTester / Test Helpers | ⬜ pending |
| B3 | Report Helpers | ⬜ pending |
| B4 | char-helper 增强 | ⬜ pending |
| B5 | 分离判断/报告逻辑 | ⬜ pending |
| B6 | createTextRule 框架 | ⏸ 暂缓 |
| A1 | Rule Context Interface | ⬜ pending |
| A2 | Rule Catalog | ⬜ pending |
| A3 | Lint Session | ⬜ pending |
| A5 | Fix Pipeline | ⬜ pending |
