import type {
  MarkdownSourceMap,
  MarkdownTextNode as ParserMarkdownTextNode
} from '@lint-md/parser';
import type { LintSourceCode, PositionedMarkdownNode, PositionedMarkdownRoot, PositionedTextNode } from '../types';

interface SourceCodeOptions {
  text: string
  ast: PositionedMarkdownRoot
  sourceMap: MarkdownSourceMap
}

export const createLintSourceCode = ({
  text,
  ast,
  sourceMap
}: SourceCodeOptions): LintSourceCode => ({
  text,
  ast,

  getRaw(node: PositionedMarkdownNode): string {
    return sourceMap.getRaw(node as any);
  },

  getTextRange(
    node: PositionedTextNode,
    valueStart: number,
    valueEnd: number
  ): [number, number] {
    const range = sourceMap.getSourceRange(
      node as unknown as ParserMarkdownTextNode,
      valueStart,
      valueEnd
    );
    return [range.start.offset, range.end.offset];
  }
});
