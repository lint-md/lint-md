import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { getNodeOffsetPosition } from '../utils/common';

const noEmptyCode: LintMdRule = {
  meta: {
    name: 'no-empty-code'
  },
  create: (context) => {
    return {
      code: (node: MarkdownCodeNode) => {
        const loc = getNodeOffsetPosition(node);
        if (!loc)
          return;

        // 把所有的不可见字符全部换掉，如果剩下没有任何字符说明是空代码块
        const replacement = node.value.replace(/\s/g, '');
        if (!replacement) {
          context.report({
            loc,
            message: '代码块内容不能为空，请删除空的代码块，或者填充代码内容',
            fix: (fixer) => {
              return fixer.removeRange([
                loc.start.offset,
                loc.end.offset
              ]);
            }
          });
        }
      }
    };
  }
};

export default noEmptyCode;
