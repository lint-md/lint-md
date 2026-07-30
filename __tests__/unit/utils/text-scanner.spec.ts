import { parseMdWithSourceMap } from '@lint-md/parser';
import { TextScanner } from '../../../src/utils/text-scanner';
import { createLintSourceCode } from '../../../src/utils/source-code';
import { InvalidRuleRangeError } from '../../../src/utils/source-code-errors';
import type { PositionedTextNode } from '../../../src/types';

const createScanner = (markdown: string): TextScanner => {
  const { ast, sourceMap } = parseMdWithSourceMap(markdown);
  const parent = ast.children[0] as { children: PositionedTextNode[] };
  const node = parent.children[0];
  const sourceCode = createLintSourceCode({ text: markdown, ast, sourceMap });
  return new TextScanner(node, sourceCode);
};

describe('TextScanner', () => {
  describe('constructor and getters', () => {
    it('exposes the normalized value and source node', () => {
      const scanner = createScanner('hello');

      expect(scanner.value).toBe('hello');
      expect(scanner.node.value).toBe('hello');
    });
  });

  describe('matchAt', () => {
    it('resolves a simple text range', () => {
      const match = createScanner('hello world').matchAt(0, 5);

      expect(match).toEqual({
        index: 0,
        length: 5,
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 6, offset: 5 }
        },
        absoluteRange: [0, 5]
      });
    });

    it('resolves an empty range at the value end', () => {
      const match = createScanner('hello').matchAt(5, 0);

      expect(match.loc.start).toEqual({ line: 1, column: 6, offset: 5 });
      expect(match.loc.end).toEqual({ line: 1, column: 6, offset: 5 });
      expect(match.absoluteRange).toEqual([5, 5]);
    });

    it('resolves a range across line endings', () => {
      const match = createScanner('a\nb\nc').matchAt(0, 3);

      expect(match.loc.start).toEqual({ line: 1, column: 1, offset: 0 });
      expect(match.loc.end).toEqual({ line: 2, column: 2, offset: 3 });
      expect(match.absoluteRange).toEqual([0, 3]);
    });

    it('uses the source node start position', () => {
      const match = createScanner('# abc').matchAt(0, 3);

      expect(match.loc.start).toEqual({ line: 1, column: 3, offset: 2 });
      expect(match.loc.end).toEqual({ line: 1, column: 6, offset: 5 });
    });

    it('resolves CRLF positions from SourceCode', () => {
      const match = createScanner('a\r\nb').matchAt(0, 4);

      expect(match.loc.start).toEqual({ line: 1, column: 1, offset: 0 });
      expect(match.loc.end).toEqual({ line: 2, column: 2, offset: 4 });
    });

    it.each([
      [-1, 1],
      [2, -1],
      [1, 10],
      [0.5, 1]
    ])('rejects an invalid range at index %s with length %s', (index, length) => {
      expect(() => createScanner('abc').matchAt(index, length))
        .toThrow(InvalidRuleRangeError);
    });
  });

  describe('findAllMatches', () => {
    it('finds all matches with a global flag', () => {
      const matches = createScanner('hello world hello').findAllMatches(/hello/g);

      expect(matches.map(match => match.index)).toEqual([0, 12]);
    });

    it('adds the global flag when it is absent', () => {
      const matches = createScanner('hello world hello').findAllMatches(/hello/);

      expect(matches).toHaveLength(2);
    });

    it('ignores zero-length matches', () => {
      const matches = createScanner('abc').findAllMatches(/(\b)/g);

      expect(matches).toEqual([]);
    });

    it('returns no matches for an absent value', () => {
      const matches = createScanner('hello').findAllMatches(/xyz/g);

      expect(matches).toEqual([]);
    });

    it('resolves dense matches through SourceCode', () => {
      const matches = createScanner('aaa').findAllMatches(/a/g);

      expect(matches.map(match => match.absoluteRange))
        .toEqual([[0, 1], [1, 2], [2, 3]]);
    });

    it('resolves matches across newlines', () => {
      const matches = createScanner('ab\ncd').findAllMatches(/[\s\S]/g);

      expect(matches[2].loc).toEqual({
        start: { line: 1, column: 3, offset: 2 },
        end: { line: 2, column: 1, offset: 3 }
      });
      expect(matches[3].loc.start).toEqual({ line: 2, column: 1, offset: 3 });
    });
  });

  describe('findAllOccurrences', () => {
    it('finds all occurrences', () => {
      const matches = createScanner('aXaXa').findAllOccurrences('X');

      expect(matches.map(match => match.index)).toEqual([1, 3]);
    });

    it('finds overlapping occurrences', () => {
      const matches = createScanner('aaa').findAllOccurrences('aa');

      expect(matches.map(match => match.absoluteRange))
        .toEqual([[0, 2], [1, 3]]);
    });

    it('returns no matches for an empty search string', () => {
      expect(createScanner('hello').findAllOccurrences('')).toEqual([]);
    });

    it('resolves occurrences across newlines', () => {
      const matches = createScanner('aa\naa').findAllOccurrences('aa');

      expect(matches.map(match => match.absoluteRange))
        .toEqual([[0, 2], [3, 5]]);
      expect(matches[1].loc.start).toEqual({ line: 2, column: 1, offset: 3 });
    });
  });

  describe('forEachChar', () => {
    it('iterates through Unicode code points', () => {
      const chars: string[] = [];

      createScanner('a𝔄b').forEachChar(char => chars.push(char));

      expect(chars).toEqual(['a', '𝔄', 'b']);
    });

    it('resolves positions only when a callback reads them', () => {
      const positions: Array<{ line: number; column: number; offset: number }> = [];

      createScanner('a\nb').forEachChar((_char, _index, position) => {
        positions.push({
          line: position.line,
          column: position.column,
          offset: position.offset
        });
      });

      expect(positions).toEqual([
        { line: 1, column: 1, offset: 0 },
        { line: 1, column: 2, offset: 1 },
        { line: 2, column: 1, offset: 2 }
      ]);
    });
  });
});
