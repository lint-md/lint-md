# lint-md 改进计划

> 更新日期：2026-06-19  
> 目标：把已有架构想法、当前仓库真实状态、以及下一步执行顺序收敛成一份可持续维护的计划。

---

## 当前已验证状态

- `npm test` 可通过
- `npm run build` 失败：`run-p: Permission denied`
- CI 当前只跑测试，没有校验 `build` / `typecheck` / `lint`
- `README.md` 已补上 Node.js API 基本用法，不再是 TODO
- `src/core/lint-markdown.ts` 已经使用静态 `import * as internalRuleConfig from '../rules'`
- `tsconfig.json` 目前只有 `strictNullChecks: true`，还不是完整 `strict` 模式

---

## 执行路线

推荐顺序：

1. 先修工程闭环，确保能稳定构建、校验、发布
2. 再收口规则配置层（`Rule Context Interface` + `Rule Catalog`）
3. 然后收口执行与修复主链路（`Lint Session` + `Fix Pipeline`）
4. 最后处理文本扫描抽象和长期文档治理

---

## Part A：架构重构

### A1. Rule Context Interface

**Files**: `src/types.ts`, `src/utils/rule-manager.ts`, `src/core/run-lint.ts`

**问题**:

- `LintMdRuleContext` 虽然已经显式定义，但 interface 仍然偏薄，只暴露 `report`、`options`、`ast`、`markdown`
- `options` 仍是 `Record<string, any>`
- `createRuleContext` 仍然是规则运行时能力的真实拥有者，interface 没有成为 first-class seam

**计划**:

- [ ] 定义更稳定的 `RuleContext` / `ReportPayload` interface
- [ ] 明确 rule 可依赖的运行时能力和错误模型
- [ ] 将 `createRuleContext` 降级为 adapter，而不是事实标准
- [ ] 收紧 `any`，为第三方规则留出更清晰的 contract

**收益**:

- 类型语义与运行时语义对齐
- 第三方规则更容易理解和接入
- 可围绕 context 写稳定的 contract test

---

### A2. Rule Catalog

**Files**: `src/core/lint-markdown.ts`, `src/utils/override-default-rules.ts`, `src/rules/index.ts`, `src/types.ts`

**问题**:

- 规则注册、默认级别、用户配置覆盖、第三方规则接入仍分散在多个模块
- `override-default-rules.ts` 同时处理内置规则和第三方规则，职责过多
- `LintMdRuleConfig` 依赖 tuple 约定 `[severity, options]` / `[rule, severity, options]`，调用方需要记忆两套格式

**计划**:

- [ ] 新增 `RuleCatalog` 模块，统一负责：
  - 内置规则注册
  - 第三方规则注册
  - 默认 severity / options
  - 配置解析与校验
  - 最终运行时规则列表生成
- [ ] `lintMarkdown` 不再关心规则来源和 tuple 细节

**收益**:

- 配置格式变化、兼容层、废弃规则迁移集中在一处
- 入口层只消费稳定 interface
- 可直接测试“配置输入 -> catalog 输出”

---

### A3. Lint Session

**Files**: `src/core/run-lint.ts`, `src/utils/rule-manager.ts`, `src/utils/emitter.ts`, `src/utils/traverser.ts`

**问题**:

- 一次 lint 的运行时状态仍拆散在 4 个模块中
- `emitter` 依旧是薄 adapter，提供的 depth 很有限
- rule 执行异常现在通过 `console.error` 记录，但没有统一错误策略 interface

**计划**:

- [ ] 引入 `LintSession` 模块，统一封装：
  - AST 解析后的运行时上下文
  - selector 订阅
  - report sink
  - fix 收集
  - rule context 构造
  - rule 执行错误策略
- [ ] `emitter` 降级为内部实现细节，必要时删除

**收益**:

- lint 控制流集中
- 后续支持 timing、统计、错误收集时有真实 seam 可挂载
- “给定 markdown 和 rules，session 应产生什么结果” 更容易测试

---

### A4. Text Inspection

**Files**: `src/rules/space-around-alphabet.ts`, `src/rules/space-around-number.ts`, `src/rules/no-full-width-number.ts`, `src/rules/use-standard-ellipsis.ts`, `src/rules/no-space-in-link.ts`, `src/utils/mark-text.ts`, `src/utils/get-text-nodes.ts`

**问题**:

- 多条文本类规则仍重复实现相似流程：找文本节点 -> 扫描 -> 计算位置 -> 生成 replacement
- 新增文本规则时，通常只能复制现有规则再局部修改

**计划**:

- [ ] 抽象 `TextInspection` 模块
- [ ] 优先抽出：
  - 字符类别标记与边界扫描
  - 文本替换片段生成
  - offset / range 计算
  - text / link / inlineCode 的统一提取逻辑

**收益**:

- 文本扫描和修复逻辑集中
- 新增文本类规则更偏声明式
- 单测可从 rule 级重复用例收敛到 scanner / fixer 级高价值用例

---

### A5. Fix Pipeline

**Files**: `src/core/handle-fix-mode.ts`, `src/utils/apply-fix.ts`, `src/utils/fixer.ts`, `src/utils/rule-manager.ts`

**问题**:

- fix 计划生成、排序、冲突处理、多轮重跑仍散落在多个位置
- `handle-fix-mode.ts` 在达到最大循环次数时没有明确暴露停止原因
- 当前返回结构对调用方不够友好，缺少 fix 摘要

**计划**:

- [ ] 引入 `FixPipeline` 模块，显式负责：
  - fix 计划生成
  - fix 排序和冲突策略
  - fix 应用
  - 多轮重跑
  - 结果汇总
- [ ] 返回结构明确包含：
  - `appliedFixes`
  - `skippedFixes`
  - `skippedReason`
  - `iterations`
  - `stoppedBy`

**收益**:

- 修复相关 bug 集中处理
- 外部集成获得更稳定的 fix interface
- 适合补边界测试：重叠 range、逆序 range、重复 fix、多轮收敛

---

## Part B：工程化改进

### B1. TypeScript 配置升级

**当前状态**:

- [x] 已启用 `strictNullChecks`
- [ ] 尚未启用 `strict`
- [ ] 尚未确认 `forceConsistentCasingInFileNames`
- [ ] 仍停留在 TypeScript `4.8.4`

**计划**:

- [ ] 开启 `strict`
- [ ] 显式配置 `forceConsistentCasingInFileNames`
- [ ] 升级 TypeScript 到 5.x

**备注**:

旧计划中“`strict: true` 已完成”的结论与当前 `tsconfig.json` 不一致，已修正。

---

### B2. 类型安全增强

**当前状态**:

- [x] `lint-markdown.ts` 已改为静态 `import`
- [x] 当前代码中未发现 `@ts-expect-error`
- [ ] `any` 仍存在于 `types.ts` 和 `emitter.ts` 等位置
- [ ] 规则配置和 context 仍缺少更强类型约束

**计划**:

- [ ] 继续收紧 `options` 与 listener 的类型
- [ ] 配合 A1 / A2 消除 `Record<string, any>` 的扩散

---

### B3. 工程化补齐

**问题**:

- `build` 当前不可用
- `package.json` 中没有 `lint`、`format`、`typecheck`、`prepublishOnly`
- CI 只跑测试，没有覆盖真实发布风险

**计划**:

- [ ] 修复 `npm run build`
- [ ] 添加脚本：`lint`、`format`、`typecheck`、`prepublishOnly`
- [ ] CI 增加 `build` / `typecheck` / `lint`
- [ ] CI 增加 Node.js 版本矩阵（建议 18 / 20 / 22）

**优先级**: P0

---

### B4. 错误处理改进

**问题**:

- `run-lint.ts` 当前会记录 rule 执行错误，但错误仍未进入稳定返回结构
- `handle-fix-mode.ts` 超过最大尝试次数后没有暴露状态

**计划**:

- [ ] 在 session 层统一定义错误策略
- [ ] 将 fix 停止原因纳入返回结果
- [ ] 为 rule 执行失败补测试，确认不会静默损坏结果

---

### B5. 测试增强

**当前状态**:

- [x] `npm test` 可通过
- [ ] 未配置 `coverageThreshold`
- [ ] 缺少针对 build / package contract 的校验
- [ ] 缺少配置解析、fix 摘要、边界冲突等集成测试

**计划**:

- [ ] 配置覆盖率阈值（建议 80%+）
- [ ] 增加集成测试：
  - 多规则交互
  - 配置解析 / catalog 输入输出
  - fix pipeline 摘要
- [ ] 增加边界测试：
  - 空字符串
  - 超大文件
  - 重叠 fix range
  - 多轮 fix 收敛

---

### B6. 文档补全

**当前状态**:

- [x] README 已包含 Node.js API 最小使用示例
- [ ] 缺少 `CHANGELOG.md`
- [ ] 缺少 `CONTRIBUTING.md`
- [ ] `docs/` 中多份改进文档存在状态漂移，尚未形成单一事实源

**计划**:

- [ ] 新增 `CHANGELOG.md`
- [ ] 新增 `CONTRIBUTING.md`
- [ ] 将改进状态收敛到单一 roadmap 文档
- [ ] 若准备持续做架构演进，补 `docs/adr/`

---

### B7. Package 配置完善

**问题**:

- 当前缺少 `types` / `exports`，发布契约不够明确
- `publishConfig` 只有 `registry`
- 未声明 `engines`、`sideEffects`

**计划**:

- [ ] 添加 `types`
- [ ] 添加 `exports`
- [ ] 添加 `engines`
- [ ] `publishConfig` 补 `access: public`
- [ ] 添加 `sideEffects: false`

---

### B8. 清理自引用依赖

**问题**:

- `devDependencies` 中仍包含 `@lint-md/core: 0.2.2`
- benchmark 测试直接依赖旧包做对比，容易干扰本地验证和依赖理解

**计划**:

- [ ] 移除 `devDependencies` 中的 `@lint-md/core: 0.2.2`
- [ ] 重写 benchmark 基线策略，避免主包自引用

---

## 建议优先级

### 第一阶段：先修现实故障

1. B3 工程化补齐
2. B7 Package 配置完善
3. B5 测试增强

### 第二阶段：收口核心 interface

1. A1 Rule Context Interface
2. A2 Rule Catalog

### 第三阶段：收口执行主链路

1. A3 Lint Session
2. A5 Fix Pipeline

### 第四阶段：降低规则重复实现

1. A4 Text Inspection

---

## 执行状态

| # | 项目 | 类别 | 状态 |
|---|------|------|------|
| A1 | Rule Context Interface | 架构 | ⬜ pending |
| A2 | Rule Catalog | 架构 | ⬜ pending |
| A3 | Lint Session | 架构 | ⬜ pending |
| A4 | Text Inspection | 架构 | ⬜ pending |
| A5 | Fix Pipeline | 架构 | ⬜ pending |
| B1 | TypeScript 配置升级 | 工程化 | 🟨 partial |
| B2 | 类型安全增强 | 工程化 | 🟨 partial |
| B3 | 工程化补齐 | 工程化 | ⬜ pending |
| B4 | 错误处理改进 | 工程化 | ⬜ pending |
| B5 | 测试增强 | 工程化 | ⬜ pending |
| B6 | 文档补全 | 工程化 | 🟨 partial |
| B7 | Package 配置完善 | 工程化 | ⬜ pending |
| B8 | 清理自引用依赖 | 工程化 | ⬜ pending |
