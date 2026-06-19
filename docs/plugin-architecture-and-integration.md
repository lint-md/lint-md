# Plugin Architecture & Integration Layer Design

## Overview

当前 `@lint-md/core` 以 `lintMarkdown(markdown, rules, isFixMode)` 作为唯一公开 API。方案的目标是把 core 从"单体函数"升级为"可组合引擎"，同时让每个集成平台（ALE、LSP、Neovim、VSCode）通过极薄的 adapter 包来消费 core。

```
┌──────────────────────────────────────────────────────────┐
│  Integration Layer  (~50 行/adapter，只做 I/O + 格式转换)   │
│                                                          │
│  lint-md-ale    lint-md-lsp    nvim-lint-md    vscode    │
│      │               │              │             │       │
│      └───────┬───────┴──────┬───────┘             │       │
│              │              │                     │       │
│              ▼              ▼                     ▼       │
│         stdin/file     LSP protocol         Extension API │
│              │              │                     │       │
└──────────────┼──────────────┼─────────────────────┼───────┘
               │              │                     │
               ▼              ▼                     ▼
┌──────────────────────────────────────────────────────────┐
│  @lint-md/core  (纯引擎，零 I/O，零平台依赖)                 │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  LintMd     │  │  Plugin API  │  │  Diagnostics   │  │
│  │  Class      │  │  use()       │  │  Standardizer  │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────────┘  │
│         │                │                               │
│  ┌──────▼────────────────▼───────────────────────────┐  │
│  │  LintSession (orchestrates parse → lint → fix)    │  │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │ parseMd  │ │  RuleCatalog │ │  FixPipeline │  │  │
│  │  └──────────┘ └──────────────┘ └──────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│  @lint-md/parser  (AST 解析，独立包，不变)                  │
└──────────────────────────────────────────────────────────┘
```

---

## 1. `LintMd` 类 —— 可复用实例

### 问题

当前 `lintMarkdown()` 每次调用都 `require('../rules')` 解析规则配置：

```ts
// 现状：每次 lint 都重新解析规则
lintMarkdown(md1, rules) // parse rules...
lintMarkdown(md2, rules) // parse rules again...
```

对 LSP/ALE 等高频调用场景，这是不必要的重复开销。

### 方案

```ts
// ✅ 实例化一次，复用多次
const linter = new LintMd({
  rules: {
    'space-around-alphabet': 2,
    'no-long-code': [1, { length: 100 }]
  }
})

// 内部缓存解析后的规则配置、共享状态
linter.lint(md1)  // fast
linter.lint(md2)  // fast

// 热更新（LSP/VS Code 场景需要）
linter.updateRules({ 'space-around-alphabet': 0 })
```

```ts
// core/src/lint-md.ts (新模块)
export class LintMd {
  private catalog: RuleCatalog
  private settings: Record<string, any>

  constructor(config: LintMdConfig) {
    this.catalog = new RuleCatalog(config.rules)
    this.settings = config.settings ?? {}
  }

  lint(markdown: string, options?: LintOptions): LintResult {
    const session = new LintSession(markdown, this.catalog.getActiveRules(), options)
    return session.run()
  }

  lintAndFix(markdown: string): FixResult {
    const session = new LintSession(markdown, this.catalog.getActiveRules(), { fixMode: true })
    return session.runAndFix()
  }

  updateRules(rules: LintMdRulesConfig): void { ... }
  use(plugin: LintMdPlugin, config?: PluginConfig): void { ... }
  getCatalog(): RuleCatalog { ... }
}
```

### 保持兼容

原 `lintMarkdown` 函数保留，内部委托给 `LintMd`：

```ts
// 向后兼容
export const lintMarkdown = (markdown, rules = {}, isFixMode = true) => {
  const linter = new LintMd({ rules })
  return isFixMode ? linter.lintAndFix(markdown) : linter.lint(markdown)
}
```

---

## 2. Plugin 体系

### `LintMdPlugin` 接口

```ts
export interface LintMdPlugin {
  /** 元信息 */
  meta: {
    name: string
    version: string
  }

  /** 该插件提供的规则 */
  rules?: Record<string, LintMdRule>

  /** 预设配置 ("recommended", "strict" 等) */
  configs?: Record<string, LintMdRulesConfig>

  /** 文件处理器（如 .mdx） */
  processors?: Record<string, Processor>

  /** 插件安装时回调 — 获取 core 暴露的工具 API */
  onSetup?(api: CoreAPI): void | Promise<void>
}

export interface Processor {
  /** 前置处理：将非标准格式转为 markdown */
  preProcess?(source: string, filePath: string): string
  /** 后置处理：将 fix 后的结果映射回原格式 */
  postProcess?(fixedSource: string, messages: LintMessage[]): string
}
```

### 使用方式

```ts
const linter = new LintMd({
  rules: {
    'space-around-alphabet': 2
  }
})

// 加载内置规则插件（解耦）
linter.use(builtInPlugin)

// 加载第三方插件
linter.use(communityPackagePlugin, { 
  'community-rule': [1, { strict: true }]
})

// 加载本地插件
linter.use(myCustomPlugin)
```

### 内置规则解耦

当前 `src/rules/index.ts` 被 `require('../rules')` 硬链接。改为一个内建插件：

```ts
// core/src/plugins/builtin.ts
export const builtinPlugin: LintMdPlugin = {
  meta: { name: '@lint-md/builtin', version: '2.0.0' },
  rules: {
    'space-around-alphabet': spaceAroundAlphabet,
    'space-around-number': spaceAroundNumber,
    'no-empty-code': noEmptyCode,
    // ... 16 条内置规则
  },
  configs: {
    recommended: {
      'space-around-alphabet': 2,
      'space-around-number': 2,
      'no-empty-code': 2,
      'no-empty-list': 2,
      // ...
    }
  }
}
```

---

## 3. Rule Context 升级

### 当前 context

```ts
// 现状：太薄，类型从实现反推
{ report, options, markdown, ast }
```

### 目标 context

```ts
export interface RuleContext {
  /** 上报诊断 */
  report(payload: ReportPayload): void

  /** 规则选项 */
  options: Record<string, any>

  /** 原始 markdown 文本 */
  getSource(): string

  /** AST 根节点 */
  getAST(): MarkdownNode

  /** 祖先节点链（父 → 祖父 → ... 直到根） */
  getAncestors(): MarkdownNode[]

  /** 当前文件路径（多文件场景） */
  getFilePath(): string

  /** 跨规则共享数据（读写） */
  readonly shared: Map<string, unknown>

  /** 全局 settings */
  readonly settings: Record<string, any>
}
```

### 关键场景

**跨规则关联检查**：`no-empty-code-lang` 和 `no-empty-code` 可以协同：

```ts
// no-empty-code.ts
create(ctx) {
  return {
    code(node) {
      // 标记节点
      const codeBlocks = ctx.shared.get('codeBlocks') ?? []
      codeBlocks.push(node)
      ctx.shared.set('codeBlocks', codeBlocks)

      // 检查内容是否为空
      if (!node.value.trim()) {
        ctx.report({ ... })
      }
    }
  }
}
```

**祖先节点判断**：某些规则需要知道当前文本是否在特定父节点内：

```ts
// 示例：标题内的链接特殊处理
create(ctx) {
  return {
    link(node) {
      const ancestors = ctx.getAncestors()
      const isInHeading = ancestors.some(a => a.type === 'heading')
      if (isInHeading) {
        // 标题内链接的特殊规则
      }
    }
  }
}
```

---

## 4. 公开诊断标准化

### 问题

当前 `lintResult` 返回自定义格式：

```ts
{
  loc: { start: { line, column, offset }, end: { line, column, offset } },
  message: string,
  name: string,
  content: string,
  severity: number
}
```

各集成需要各自映射到平台格式：

| 平台 | 需要格式 |
|------|----------|
| LSP | `Diagnostic { range, severity, message, source, code }` |
| ALE | `file:line:col: type: [rule] message` |
| ESLint | `LintMessage { line, column, ruleId, message, severity }` |

### 方案

Core 提供标准化的诊断对象和格式转换器：

```ts
// core/src/diagnostics.ts

export interface LintDiagnostic {
  /** 错误范围 (0-indexed offsets) */
  range: [number, number]
  /** 规则名 */
  ruleId: string
  /** 诊断消息 */
  message: string
  /** 严重级别 */
  severity: 'off' | 'warn' | 'error'
  /** 修复建议 */
  fix?: TextEdit
}

/** 转为 LSP Diagnostic 格式 */
export function toLSPDiagnostic(diag: LintDiagnostic, doc: TextDocument): Diagnostic

/** 转为 ALE 输出行 */
export function toALEOutput(diag: LintDiagnostic, filepath: string): string

/** 转为 ESLint LintMessage 格式 */
export function toESLintMessage(diag: LintDiagnostic): LintMessage
```

每个集成只需要一行调用：

```ts
// lint-md-ale
const { diagnostics } = linter.lint(md)
for (const d of diagnostics) {
  console.log(toALEOutput(d, filepath))
}
process.exit(diagnostics.length > 0 ? 1 : 0)
```

---

## 5. 公开中间原语（LSP 增量场景）

LSP 场景不能每次全量 lint。需要开放更细粒度的 API：

```ts
// core 公开原语
export { parseMarkdown } from './parser'
export { createLintSession } from './session'
export { applyTextEdits } from './fixer'

const ast = parseMarkdown(md)
const session = createLintSession(ast, rules)

// 文本变更时只重跑受影响的规则
session.updateRange(startOffset, endOffset)
const deltaDiagnostics = session.getDeltaDiagnostics()
```

对于不需要增量 lint 的场景，仍旧是一次调用。原语的存在是给高级集成更大的自由度。

---

## 6. 错误边界

### 原则

Core 的公开 API 永不 throw。所有错误走返回值：

```ts
export type LintResult =
  | { ok: true; diagnostics: LintDiagnostic[] }
  | { ok: false; errors: CoreError[] }

export interface CoreError {
  code: 'PARSE_ERROR' | 'RULE_ERROR' | 'FIX_ERROR' | 'INVALID_CONFIG'
  message: string
  /** 上下文信息（文件名、规则名等） */
  meta?: Record<string, string>
}
```

`run-lint.ts:26` 当前的 `console.log(e)` 替换为：

```ts
try {
  emitter.emit(node.type, node)
} catch (e) {
  session.captureError({
    code: 'RULE_ERROR',
    message: e instanceof Error ? e.message : String(e),
    meta: { rule: rule.meta.name, nodeType: node.type }
  })
}
```

---

## 7. 集成层模板

### lint-md-ale

```ts
#!/usr/bin/env node
import { readFileSync } from 'fs'
import { LintMd, builtinPlugin } from '@lint-md/core'

const linter = new LintMd().use(builtinPlugin)

for (const file of process.argv.slice(2)) {
  const md = readFileSync(file, 'utf-8')
  const result = linter.lint(md)

  for (const d of result.diagnostics) {
    const line = d.loc.start.line
    const col = d.loc.start.column
    const type = d.severity === 'error' ? 'E' : 'W'
    console.log(`${file}:${line}:${col}: ${type}: [${d.ruleId}] ${d.message}`)
  }
}

process.exit(result.diagnostics.some(d => d.severity === 'error') ? 1 : 0)
```

### lint-md-lsp

```ts
// 连接管理器
connection.onDidChangeTextDocument(({ document }) => {
  const result = linter.lint(document.getText())

  const diagnostics = result.diagnostics.map(d =>
    toLSPDiagnostic(d, document)
  )

  connection.sendDiagnostics({
    uri: document.uri,
    diagnostics
  })
})

// 配置变更
connection.onDidChangeConfiguration(change => {
  const settings = change.settings.lintMd
  linter.updateRules(settings.rules)
})
```

---

## 8. 迁移路径

| 阶段 | 内容 | 兼容性 |
|------|------|--------|
| **Phase 1** | 引入 `RuleCatalog`，内部替代 `overrideDefaultRules` | `lintMarkdown` API 不变 |
| **Phase 2** | 引入 `LintMd` 类，`lintMarkdown` 委托到类 | 完全向后兼容 |
| **Phase 3** | 定义 `LintMdPlugin` 接口，内置规则抽离为 `builtinPlugin` | `lintMarkdown` 继续工作 |
| **Phase 4** | 公开 `RuleContext` 新接口，旧 context 标记 deprecated | 旧规则继续工作 |
| **Phase 5** | 公开诊断标准化 + 中间原语 | 新增 API，不影响旧 API |
| **Phase 6** | 各集成包发版，消费新 core API | 各自独立发布 |

### 优先级

结合 `architecture-review-2026-06.md` 的建议，推荐顺序：

1. `Rule Context Interface` — 先立住 interface
2. `Rule Catalog` + `LintMd` 类 — 收口配置和实例管理
3. `LintMdPlugin` 接口 — 插件体系
4. `LintDiagnostic` 标准化 — 降低集成层工作
5. 中间原语 `parseMarkdown` / `lintAST` / `applyFixes` — LSP 增量场景
6. 错误边界 — 全面加固
