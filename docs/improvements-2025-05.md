# lint-md 改进记录

## 1. 消除 runLint 中间队列（perf/remove-nodequeue）

**Issue**: [#114](https://github.com/lint-md/lint-md/issues/114) &nbsp; **PR**: [#115](https://github.com/lint-md/lint-md/pull/115)

### 问题

`runLint` 中 AST 遍历时先将所有节点推入一个中间队列 `nodeQueue`（每个节点 push 两次，`isEntering: true` 和 `isEntering: false`），遍历结束后再回放队列发射事件。其中 `isEntering: false` 的条目从未被消费。

```ts
// ❌ 旧代码
const traverser = createTraverser({
  onEnter: (node) => {
    nodeQueue.push({ isEntering: true, node });
    nodeQueue.push({ isEntering: false, node }); // 死代码，从未被消费
  }
});
traverser.traverse(ast, null);
for (const item of nodeQueue) {
  if (item.isEntering && item.type) emitter.emit(item.type, item); // 回放
}
```

### 修复

遍历时直接在 `onEnter` 中发射事件：

```ts
// ✅ 新代码
const traverser = createTraverser({
  onEnter: (node) => {
    if (node.type) {
      try { emitter.emit(node.type, node); }
      catch (e) { console.log(e); }
    }
  }
});
traverser.traverse(ast, null);
```

### 学习点

| 概念 | 说明 |
|------|------|
| **YAGNI** | `isEntering: false` 是为 `:exit` 选择器做的预留（模仿 ESLint 设计），但从未实现。为不存在的需求付出每节点 2 次 push + 一次 full-loop 的代价。 |
| **过早架构预留的代价** | 预留应限于接口/字段级别的扩展点，不应改变核心处理流程并引入运行时开销。正确的做法是先写一个真实的 `:exit` 规则来验证需求，再带着测试用例引入队列模式。 |
| **区分 ESLint 和 Markdown lint** | AST 粒度不同：ESLint 节点树深、需要 exit 收集子节点信息做决策；Markdown 的 lint 规则都只需要单节点判断，不需要 exit 阶段。盲目模仿成熟工具的设计可能导致「为不需要的场景付费」。 |

---

## 2. 修复 no-space-in-link 守卫条件（fix/no-space-in-link-guard）

**Issue**: [#116](https://github.com/lint-md/lint-md/issues/116) &nbsp; **PR**: [#117](https://github.com/lint-md/lint-md/pull/117)

### 问题

```ts
// ❌ 永远为 false 的守卫
if (!node && node.type !== 'text') { return; }
```

`!node` 为真时，`node.type` 被短路不执行；`node` 存在时 `!node` 已经是 `false`。整条条件永远为 `false`，等价于无守卫。

### 修复

```ts
// ✅ 正确写法
if (!node || node.type !== 'text') { return; }
```

### 学习点

| 概念 | 说明 |
|------|------|
| **短路求值陷阱** | `&&` 和 `||` 的语义差异极容易混淆。写 `!A && B` 时要警惕是否本意是 `!A || B`。 |
| **死代码检测** | ESLint 的 `no-constant-condition` 和 `@typescript-eslint/strict-boolean-expressions` 能帮助捕获这类问题。 |
| **守卫函数模式** | `checkAndReportTextNode` 这类工具函数的第一行应该是健壮的守卫：参数为假时直接 return，避免后续逻辑访问 `node.type` 等字段时抛出 TypeError。 |

---

## 3. 修复 RegExp.exec() 提前 break bug（fix/regex-while-true-antipattern）

**Issue**: [#118](https://github.com/lint-md/lint-md/issues/118) &nbsp; **PR**: [#119](https://github.com/lint-md/lint-md/pull/119)

### 问题

```ts
// ❌ 正确的 …… 导致循环提前退出，后面的非法 … 被跳过
const findAllSingleEllipsis = (s: string) => {
  const re = /…+/g;
  while (true) {
    const matched = re.exec(s);
    if (matched && matched[0].length !== 2) {
      r.push({...});
    } else {
      break; // ← 遇到 2 字符省略号就 break！
    }
  }
};
```

对于 `"前言……他说…"`：正确的 `……`（2 字符）命中 `else` 分支直接退出，后面的 `…` 永远不被报告。

### 修复

```ts
// ✅ 仅在匹配耗尽时退出
let matched: RegExpExecArray | null;
while ((matched = re.exec(s)) !== null) {
  if (matched[0].length !== 2) r.push({...});
}
```

三个文件统一模式：

| 文件 | 函数 | 改动 |
|------|------|------|
| `use-standard-ellipsis.ts` | `findAllSingleEllipsis` | 修复 bug + 统一模式 |
| `use-standard-ellipsis.ts` | `findAllDotEllipsis` | 统一模式 |
| `no-full-width-number.ts` | `findAllFullWidthNumbers` | 统一模式 |

### 学习点

| 概念 | 说明 |
|------|------|
| **RegExp.lastIndex** | `/g` 模式下 `exec()` 是有状态的：维护内部游标 `lastIndex`，每次从上次结束位置继续。`lastIndex` 在返回 `null` 时重置为 0。同一正则对象不能用于交替匹配多个字符串。 |
| **while(true) + break** | 这种模式是 bug 的温床——混合了多种退出条件时，容易在错误的分支 break。 |
| **while((m = re.exec(s)) !== null)** | 这是 `exec()` 的标准循环写法，仅当匹配耗尽时退出，不会漏掉中间结果。 |
| **matchAll 替代方案** | `String.prototype.matchAll()`(ES2020) 返回迭代器，不受 `lastIndex` 副作用影响，语义更清晰。 |
| **隐含 bug 的测试盲区** | 原测试用例没有覆盖「正确 `……` + 非法 `…` 混合出现」的场景：`....`→ `……`，`…` → `……`。测试不仅要测单个输入，还要测「前置状态是否影响后续判断」。 |

---

## 4. 移除 lodash 依赖（perf/remove-lodash）

**Issue**: [#120](https://github.com/lint-md/lint-md/issues/120) &nbsp; **PR**: [#121](https://github.com/lint-md/lint-md/pull/121)

### 问题

50KB 的 `lodash` 整包作为 dependencies，实际仅使用了两个工具函数。

### 修复

| 旧依赖 | 原生替代 |
|--------|----------|
| `isFunction(item.fix)` | `typeof item.fix === 'function'` |
| `noop` | `const noop = () => {}` |

### 学习点

| 概念 | 说明 |
|------|------|
| **依赖卫生** | `lodash` 是一个很好的反面教材案例——整包引用 50KB，只用了 2 个 1 行即可实现的功能。 |
| **tree-shaking 认知误区** | 很多人以为 CJS 下 `import { noop } from 'lodash'` 能 tree-shake，但实际上 `lodash` 的 `main` 入口是 `lodash.js`（全量导出），tree-shaking 对 CJS 无效。正确做法是 `import noop from 'lodash/noop'`，但更好的做法是判断：如果只用了 1-2 个工具函数，自己写更合理。 |
| **原生 API 优先** | `typeof x === 'function'` 和 `isFunction` 语义相同，`const noop = () => {}` 和 `import { noop } from 'lodash'` 完全等价。能用标准库解决的，不引入第三方依赖。 |

---

## 5. 正则字面量提升到模块级（perf/extract-regex-constants）

**Issue**: [#122](https://github.com/lint-md/lint-md/issues/122) &nbsp; **PR**: [#123](https://github.com/lint-md/lint-md/pull/123)

### 问题

`char-helper.ts` 中三个判断函数每次调用在函数体内创建新正则：

```ts
// ❌ 每次调用都 new RegExp
export const isChineseCharacter = (value: string) => /^[\u4E00-\u9FA5]$/.test(value);
```

这三个函数被 `markText` 逐字符调用，是 lint 流程的热路径。

### 修复

```ts
// ✅ 创建一次，后续复用
const CHINESE_RE = /^[\u4E00-\u9FA5]$/;
export const isChineseCharacter = (value: string) => CHINESE_RE.test(value);
```

三行正则同样处理。

### 学习点

| 概念 | 说明 |
|------|------|
| **正则字面量 ≠ 常量** | 在函数体内部，每次执行都创建新的 `RegExp` 对象。虽然 V8 对小正则有内部优化，但规范不保证，且语义上不正确。 |
| **模块级常量** | 提取到模块级后，整个模块生命周期内只创建一次，任何调用方共享同一个对象。 |
| **test() vs exec()** | 这组函数只关心是否匹配，不需要位置信息，用 `test()` 是正确的选择。`exec()` 有 `/g` 状态副作用，`match()` 返回数组，`test()` 返回 boolean 最快。 |
| **微小改动 vs 微小优化** | 这个改动实际性能提升不明显（文档通常只有几百 KB），但其价值在于**代码意图清晰**——「此正则是编译期常量」这一事实通过代码结构表达出来，而非隐含在函数体内。 |

---

## 总结

| # | 类别 | 文件数 | 核心教训 |
|---|------|--------|----------|
| 1 | 架构 | 1 | YAGNI — 不为未实现的功能付费 |
| 2 | 逻辑 | 1 | 短路求值的 `&&`/`||` 陷阱 |
| 3 | 正则 | 3 | `exec()` 的 `lastIndex` 状态机 + `while(true)` 反模式 |
| 4 | 依赖 | 3 | 整包引入只用了 2 个一行工具函数 |
| 5 | 性能 | 1 | 模块级常量 vs 函数内字面量 |

每一项都是用真实 PR 驱动的学习，符合「找问题 → 理解原理 → 修复 → 提 PR」的完整循环。
