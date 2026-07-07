import { TextScanner } from '../../../src/utils/text-scanner';
import type { MarkdownTextNode } from '../../../src/utils/get-text-nodes';

const createTextNode = (
  value: string,
  startLine = 1,
  startColumn = 1,
  startOffset = 0
): MarkdownTextNode => ({
  type: 'text',
  value,
  position: {
    start: { line: startLine, column: startColumn, offset: startOffset },
    end: {
      line: startLine,
      column: startColumn + value.length,
      offset: startOffset + value.length
    }
  }
} as unknown as MarkdownTextNode);

describe('TextScanner', () => {
  describe('constructor and getters', () => {
    it('should expose value', () => {
      const node = createTextNode('hello');
      const scanner = new TextScanner(node);
      expect(scanner.value).toBe('hello');
    });

    it('should expose node', () => {
      const node = createTextNode('hello');
      const scanner = new TextScanner(node);
      expect(scanner.node).toBe(node);
    });
  });

  describe('matchAt', () => {
    it('should match simple text', () => {
      const scanner = new TextScanner(createTextNode('hello world'));
      const match = scanner.matchAt(0, 5);
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

    it('should handle match at end of text', () => {
      const scanner = new TextScanner(createTextNode('hello'));
      const match = scanner.matchAt(5, 0);
      expect(match.index).toBe(5);
      expect(match.length).toBe(0);
      expect(match.absoluteRange).toEqual([5, 5]);
    });

    it('should handle match spanning newlines', () => {
      const scanner = new TextScanner(createTextNode('a\nb\nc'));
      const match = scanner.matchAt(0, 3);
      expect(match.loc.start).toEqual({ line: 1, column: 1, offset: 0 });
      expect(match.loc.end.line).toBe(2);
      expect(match.loc.end.column).toBe(2);
      expect(match.absoluteRange).toEqual([0, 3]);
    });
  });

  describe('findAllMatches', () => {
    it('should find all matches with global flag', () => {
      const scanner = new TextScanner(createTextNode('hello world hello'));
      const matches = scanner.findAllMatches(/hello/g);
      expect(matches).toHaveLength(2);
      expect(matches[0].index).toBe(0);
      expect(matches[1].index).toBe(12);
    });

    it('should auto-add global flag if missing', () => {
      const scanner = new TextScanner(createTextNode('hello world hello'));
      const matches = scanner.findAllMatches(/hello/);
      expect(matches).toHaveLength(2);
    });

    it('should handle zero-length matches without infinite loop', () => {
      const scanner = new TextScanner(createTextNode('abc'));
      const matches = scanner.findAllMatches(/(\b)/g);
      expect(matches).toEqual([]);
    });

    it('should return empty array when no matches', () => {
      const scanner = new TextScanner(createTextNode('hello'));
      const matches = scanner.findAllMatches(/xyz/g);
      expect(matches).toEqual([]);
    });
  });

  describe('findAllOccurrences', () => {
    it('should find all occurrences', () => {
      const scanner = new TextScanner(createTextNode('aXaXa'));
      const matches = scanner.findAllOccurrences('X');
      expect(matches).toHaveLength(2);
      expect(matches[0].index).toBe(1);
      expect(matches[1].index).toBe(3);
    });

    it('should find overlapping occurrences', () => {
      const scanner = new TextScanner(createTextNode('aaa'));
      const matches = scanner.findAllOccurrences('aa');
      expect(matches).toHaveLength(2);
      expect(matches[0].index).toBe(0);
      expect(matches[0].absoluteRange).toEqual([0, 2]);
      expect(matches[1].index).toBe(1);
      expect(matches[1].absoluteRange).toEqual([1, 3]);
    });

    it('should return empty array for empty search string', () => {
      const scanner = new TextScanner(createTextNode('hello'));
      const matches = scanner.findAllOccurrences('');
      expect(matches).toEqual([]);
    });

    it('should return empty array when string not found', () => {
      const scanner = new TextScanner(createTextNode('hello'));
      const matches = scanner.findAllOccurrences('xyz');
      expect(matches).toEqual([]);
    });
  });

  describe('forEachChar', () => {
    it('should iterate over each character', () => {
      const scanner = new TextScanner(createTextNode('abc'));
      const chars: string[] = [];
      scanner.forEachChar((char) => {
        chars.push(char);
      });
      expect(chars).toEqual(['a', 'b', 'c']);
    });

    it('should track line and column for newlines', () => {
      const scanner = new TextScanner(createTextNode('a\nb'));
      const positions: Array<{ line: number; column: number }> = [];
      scanner.forEachChar((_char, _i, pos) => {
        positions.push({ line: pos.line, column: pos.column });
      });
      expect(positions[0]).toEqual({ line: 1, column: 1 });
      expect(positions[1]).toEqual({ line: 1, column: 2 });
      expect(positions[2]).toEqual({ line: 2, column: 1 });
    });

    it('should use start position from node', () => {
      const node = createTextNode('abc', 5, 3, 10);
      const scanner = new TextScanner(node);
      const positions: number[] = [];
      scanner.forEachChar((_char, _i, pos) => {
        positions.push(pos.offset);
      });
      expect(positions).toEqual([10, 11, 12]);
    });
  });
});
