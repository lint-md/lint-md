import { unified } from 'unified'
import remarkParse from 'remark-parse'

/**
 * 将 Markdown 解析成 ast
 *
 * TODO: 完善返回值的类型定义
 *
 * @param {string} md Markdown 文本
 * @returns {any} md ast 结构
 * @author YuZhanglong <loveyzl1123@gmail.com>
 */
export const parseMd = (md: string): any => {
  return unified().use(remarkParse).parse(md)
}
