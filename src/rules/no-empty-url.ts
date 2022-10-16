import { MarkdownNode } from '@lint-md/parser';
import { LintMdRule } from '../types';

type MarkdownLinkNode = MarkdownNode & {
  url: string
}

/**
 * inline code 代码块内容不能为空
 * no-empty-inline-code
 *
 * @date 2021-12-05 19:35:14
 */
const noEmptyURL: LintMdRule = {
  create: (context) => {
    return {
      link: (node: MarkdownLinkNode) => {
        if (node.url.trim() === '') {
          context.report({
            loc: node.position,
            message: '[lint-md] 链接和图片地址不能为空'
          });
        }
      },
      image: (node: MarkdownLinkNode) => {
        if (node.url.trim() === '') {
          context.report({
            loc: node.position,
            message: '[lint-md] 链接和图片地址不能为空'
          });
        }
      }
    };
  }
};

export default noEmptyURL;
