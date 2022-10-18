import { MarkdownNode } from '@lint-md/parser';
import { LintMdRule } from '../types';

type MarkdownLinkNode = MarkdownNode & {
  url: string
}

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
