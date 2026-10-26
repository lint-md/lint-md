import { parseMdxWithSourceMap } from '@lint-md/parser/mdx';
import type {
  FixMarkdownOptions,
  FixMarkdownResult,
  LintMarkdownOptions,
  LintMarkdownResult
} from './types.js';
import { executeMarkdown } from './core/lint-markdown.js';

/** Lint MDX without applying fixes. @public */
export function lintMdx(
  mdx: string,
  options: LintMarkdownOptions = { rules: {} }
): LintMarkdownResult {
  return executeMarkdown(mdx, options.rules ?? {}, false, options, parseMdxWithSourceMap);
}

/** Apply configured fixes to MDX Markdown fields. @public */
export function fixMdx(
  mdx: string,
  options: FixMarkdownOptions = {}
): FixMarkdownResult {
  return executeMarkdown(mdx, options.rules ?? {}, true, options, parseMdxWithSourceMap);
}
