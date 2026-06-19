# lint-md 架构改进建议（2026-06）

## 背景

本次审查基于当前 `src/`、`__tests__/` 和已有 `docs/` 内容完成。

已确认的现状：

- `unit` 测试可通过
- `npm run build` 在当前工作区报 `run-p: Permission denied`
- 仓库中暂无 `CONTEXT.md` 或 `docs/adr/`，本次建议仅基于代码结构本身

本次不重复已有 `docs/improvements-plan.md` 中的通用工程化事项，重点放在更值得投入的深层模块改进。

---

## 1. Rule Catalog 模块

**Files**

- `src/core/lint-markdown.ts`
- `src/utils/override-default-rules.ts`
- `src/rules/index.ts`
- `src/types.ts`

**Problem**

当前规则注册、内置规则发现、默认等级、用户配置覆盖、第三方规则接入分散在多个模块里。

主要问题：

- `lint-markdown.ts` 用 `require('../rules')` 动态加载规则，类型信息在入口处丢失
- `override-default-rules.ts` 同时处理内置规则和第三方规则，职责过多
- `LintMdRuleConfig` 依赖 tuple 约定，调用方必须记住 `[severity, options]` 和 `[rule, severity, options]` 两套 interface

这个 seam 很浅。删除它们后，复杂度不会集中，只会回流到入口和调用方。

**Solution**

引入 `RuleCatalog` 模块，统一负责：

- 内置规则注册
- 第三方规则注册
- 默认 severity 和 options
- 用户配置解析与校验
- 最终运行时规则列表生成

`lintMarkdown` 不再关心规则来源和 tuple 细节，只接收已经解析完成的规则列表。

**Benefits**

- **Locality**: 规则配置格式变化、别名兼容、废弃规则迁移集中在一个 module
- **Leverage**: 入口层只消费稳定 interface，不再承担装配逻辑
- **Tests**: 可以直接针对 “配置输入 -> catalog 输出” 写测试，而不是每次从完整 lint 流程绕进去

---

## 2. Lint Session 模块

**Files**

- `src/core/run-lint.ts`
- `src/utils/rule-manager.ts`
- `src/utils/emitter.ts`
- `src/utils/traverser.ts`

**Problem**

一次 lint 的运行时状态被拆散了：

- `run-lint.ts` 负责驱动
- `traverser.ts` 负责遍历
- `emitter.ts` 负责事件分发
- `rule-manager.ts` 负责 report 和 fix 收集

理解一次 report 是怎么产生的，需要在 4 个模块之间来回跳。

另外，`emitter.ts` 目前更像一个薄 adapter。它没有提供足够 depth，主要只是把 traversal 的回调转发给 selector。异常处理也分散在 `run-lint.ts` 中，通过 `console.log(e)` 处理，缺少稳定的错误策略 seam。

**Solution**

引入 `LintSession` 模块，统一封装：

- AST 解析后的运行时上下文
- selector 订阅
- report sink
- fix 收集
- rule context 构造
- rule 执行错误策略

`emitter` 可以成为内部实现细节，必要时直接删除。

**Benefits**

- **Locality**: lint 控制流集中在一个 module，便于维护和调试
- **Leverage**: 以后支持 `:exit`、rule timing、统计信息、错误收集时有真实 seam 可挂载
- **Tests**: 可以更自然地测试 “给定 markdown 和 rules，session 应产生什么结果”

---

## 3. Fix Pipeline 模块

**Files**

- `src/core/handle-fix-mode.ts`
- `src/utils/apply-fix.ts`
- `src/utils/fixer.ts`
- `src/utils/rule-manager.ts`

**Problem**

当前 fix 流程分散在多个位置：

- 规则通过 `fix` 生成修复意图
- `rule-manager.ts` 抽取 fix
- `handle-fix-mode.ts` 控制重跑次数
- `apply-fix.ts` 决定重叠 fix 的处理方式

真正关键的行为没有被一个深 module 承诺：

- fix 冲突如何处理
- 未应用 fix 如何分类
- 最大重试次数命中后如何暴露状态
- 一次 fix 运行的最终摘要是什么

现在这些都是实现细节，不是清晰 interface。

**Solution**

引入 `FixPipeline` 模块，显式负责：

- fix 计划生成
- fix 排序和冲突策略
- fix 应用
- 多轮重跑
- 最终结果汇总

建议返回结构中明确包含：

- `appliedFixes`
- `skippedFixes`
- `skippedReason`
- `iterations`
- `stoppedBy`

**Benefits**

- **Locality**: 修复相关 bug 集中在一个地方处理
- **Leverage**: 外部调用方获得更稳定、更完整的 fix interface
- **Tests**: 很适合补边界测试，如重叠 range、逆序 range、重复 fix、多轮 fix 收敛

---

## 4. Text Inspection 模块

**Files**

- `src/rules/space-around-alphabet.ts`
- `src/rules/space-around-number.ts`
- `src/rules/no-full-width-number.ts`
- `src/rules/use-standard-ellipsis.ts`
- `src/rules/no-space-in-link.ts`
- `src/utils/mark-text.ts`
- `src/utils/get-text-nodes.ts`

**Problem**

多条规则本质都在做相同工作：

- 找到文本节点
- 扫描字符串
- 识别问题片段
- 计算位置
- 生成 replacement

但这些步骤分散在各条 rule 中重复实现。当前许多规则是 shallow module，interface 几乎等于实现本身。新增一个文本规则时，通常只能复制现有 rule 再局部修改。

**Solution**

抽象一个 `TextInspection` 模块，至少提供两个 seam：

- text-node walker
- 扫描结果到 report/fix 的工厂函数

优先抽出这几类通用能力：

- 字符类别标记与边界扫描
- 文本替换片段生成
- offset 和 range 计算
- 针对 text/link/inlineCode 的统一提取逻辑

**Benefits**

- **Locality**: 文本扫描和修复逻辑集中，不再散落在 rule 中
- **Leverage**: 新增文本类规则时，更多是声明规则，而不是重写扫描器
- **Tests**: 能把大量 rule 单测收敛成少量高价值的 scanner/fixer 测试

---

## 5. Rule Context Interface 模块

**Files**

- `src/types.ts`
- `src/utils/rule-manager.ts`
- `src/core/run-lint.ts`

**Problem**

`LintMdRuleContext` 现在通过 `ReturnType<ReturnType<typeof createRuleManager>['createRuleContext']>` 反推出来，说明 interface 并没有作为第一等 seam 存在。

这会带来几个问题：

- rule 真正依赖什么能力是隐式的
- 类型定义依附于实现，而不是约束实现
- `any` 和 `@ts-expect-error` 容易堆积在 `rule-manager` 这层

这类写法对规则作者和第三方扩展都不友好。

**Solution**

显式定义 `RuleContext` 和 `ReportPayload`：

- `report`
- `options`
- `markdown`
- `ast`
- 其他允许 rule 使用的运行时字段

`createRuleContext` 只作为 adapter 去满足这个 interface，而不反过来让类型系统从实现中猜类型。

**Benefits**

- **Locality**: 类型语义和运行时语义对齐
- **Leverage**: 第三方规则更容易理解和接入
- **Tests**: 可以围绕 context interface 写更稳定的 contract test

---

## 优先级建议

如果只做一项，建议优先从下面两个方向中选一个：

1. `Rule Catalog`
原因：直接改善规则扩展、配置解析和入口耦合问题，收益最稳定。

2. `Lint Session`
原因：直接改善 lint 主链路的 locality，后续所有执行层改动都会更顺。

如果准备做一轮较大的结构升级，推荐顺序：

1. `Rule Context Interface`
2. `Rule Catalog`
3. `Lint Session`
4. `Fix Pipeline`
5. `Text Inspection`

这个顺序的原因是：先把 interface 立住，再收口配置，再收口执行，再处理修复与文本扫描。

---

## 非架构但值得单独记录的问题

- `package.json` 中 `build` 依赖 `run-p`，当前工作区执行时报 `Permission denied`
- `README.md` 中 Node.js API 章节仍是 `TODO`
- `devDependencies` 中存在 `@lint-md/core: 0.2.2` 自引用，容易干扰 benchmark 和本地验证

这些问题不是本次文档的重点，但建议保留在工程化清单里单独推进。
