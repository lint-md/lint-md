import { unified } from 'unified';
import remarkParse from 'remark-parse';
import frontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import { MarkdownNode } from './types';

/**
 * 将 Markdown 解析成 ast
 *
 * @param {string} md Markdown 文本
 * @returns {MarkdownNode} md ast 结构
 * @author YuZhanglong <loveyzl1123@gmail.com>
 */
export const parseMd = (md: string): MarkdownNode => {
  return unified().use(remarkParse).use(frontmatter).use(remarkGfm).parse(md);
};
