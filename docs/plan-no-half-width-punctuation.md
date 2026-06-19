# Plan: 新增 `no-half-width-punctuation` 规则

> 对应 Issue: [#41 - 半角标点如何检测](https://github.com/lint-md/lint-md/issues/41)

## 背景

中文文本应使用全角（全角）标点符号，但用户在写文档时经常混入半角（半角）标点。例如：

```
这是一个很好的东西,我很喜欢.
```

其中 `,` 应为 `，`，`.` 应为 `。`。

## 实现方案

### 1. 新建 `src/rules/no-half-width-punctuation.ts`

#### 1.1 半角 → 全角映射表

| 半角 | 全角 |
|------|------|
| `,`  | `，` |
| `.`  | `。` |
| `;`  | `；` |
| `:`  | `：` |
| `!`  | `！` |
| `?`  | `？` |
| `(`  | `（` |
| `)`  | `）` |

#### 1.2 检测逻辑

遍历 `text` 节点中的每个字符，当发现半角标点且其**前一个**或**后一个**字符是中文时，认为该标点处于中文语境，需要替换为全角版本。

伪代码：

```
for each character in node.value:
  if char is half-width punctuation AND has adjacent Chinese character:
    report() with fix → replaceRange(char → full-width equivalent)
```

#### 1.3 避免误报的策略

- `"v1.0"` → 不标记：`.` 两边是数字，不是中文
- `"hello world."` → 不标记：`.` 左边是英文
- 代码块/行内代码 → 不处理：parser 将其分离为 `code`/`inlineCode` 节点，不会被 `text` 选择器匹配

#### 1.4 代码模板

```typescript
import type { LintMdRule } from '../types';
import { isChineseCharacter } from '../utils/char-helper';

const HALF_TO_FULL: Record<string, string> = {
  ',': '，', '.': '。', ';': '；', ':': '：',
  '!': '！', '?': '？', '(': '（', ')': '）',
};

const hasAdjacentChinese = (value: string, i: number) => {
  const prev = value[i - 1];
  const next = value[i + 1];
  return (prev && isChineseCharacter(prev)) || (next && isChineseCharacter(next));
};

const noHalfWidthPunctuation: LintMdRule = {
  meta: { name: 'no-half-width-punctuation' },
  create: (context) => ({
    text: (node) => {
      const { value } = node;
      const { line, column, offset: startOffset } = node.position.start;
      for (let i = 0; i < value.length; i++) {
        const char = value[i];
        if (HALF_TO_FULL[char] && hasAdjacentChinese(value, i)) {
          const full = HALF_TO_FULL[char];
          context.report({
            loc: {
              start: { line, column: column + i },
              end:   { line, column: column + i + 1 },
            },
            message: `不应在中文中使用半角标点"${char}"，请使用全角"${full}"`,
            fix: (fixer) =>
              fixer.replaceTextRange([startOffset + i, startOffset + i + 1], full),
          });
        }
      }
    },
  }),
};

export default noHalfWidthPunctuation;
```

### 2. 注册规则 `src/rules/index.ts`

在文件末尾添加：

```typescript
export { default as noHalfWidthPunctuation } from './no-half-width-punctuation';
```

### 3. 添加测试 `__tests__/unit/rules/no-half-width-punctuation.spec.ts`

| 测试用例 | 输入 | 期望报告数 | 修复结果 |
|----------|------|-----------|----------|
| 半角逗号和句号 | `这是一个很好的东西,我很喜欢.` | 2 | `这是一个很好的东西，我很喜欢。` |
| 英文不误报 | `hello world, ok.` | 0 | 不变 |
| 数字不误报 | `version 1.0` | 0 | 不变 |
| 混合场景 | `price是9.99元,很不错!` | 2 | `price是9.99元，很不错！` |
| 括号 | `测试(test)` | 2 | `测试（test）` |

### 4. 文件变更清单

| 操作 | 文件 |
|------|------|
| 新建 | `src/rules/no-half-width-punctuation.ts` |
| 修改 | `src/rules/index.ts` |
| 新建 | `__tests__/unit/rules/no-half-width-punctuation.spec.ts` |
