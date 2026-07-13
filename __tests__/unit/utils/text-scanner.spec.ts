import { TextScanner, getScannerDiagnostics, resetScannerDiagnostics } from '../../../src/utils/text-scanner';
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

    it('should handle non-1/1/0 start position with multi-line text', () => {
      const scanner = new TextScanner(createTextNode('ab\ncd\nef', 3, 5, 100));
      // ab\ncd\nef (8 chars)
      const match = scanner.matchAt(0, 8);
      expect(match.loc.start).toEqual({ line: 3, column: 5, offset: 100 });
      // After 'f' at line 5 col 2 → end is line 5 col 3
      expect(match.loc.end).toEqual({ line: 5, column: 3, offset: 108 });
    });

    it('should hit middle of second/third line', () => {
      const scanner = new TextScanner(createTextNode('line1\nline2\nline3'));
      // 'line1\nline2\nline3'
      //  01234 567890 1234567
      const match = scanner.matchAt(8, 1); // 'i' in line2
      expect(match.loc.start).toEqual({ line: 2, column: 3, offset: 8 });
      expect(match.loc.end).toEqual({ line: 2, column: 4, offset: 9 });
    });

    it('should handle matchAt spanning 3+ lines', () => {
      const scanner = new TextScanner(createTextNode('a\nb\nc\nd'));
      const match = scanner.matchAt(0, 6); // 'a\nb\nc' (6 chars)
      expect(match.loc.start).toEqual({ line: 1, column: 1, offset: 0 });
      // After 'c' at line 3 col 1 → end is line 3 col 2? No — 6 chars means position at index 6 = 'd' at (4,1)
      // Actually: indices 0-5 are 'a','\n','b','\n','c','\n'. index 6 is 'd' at (4,1)
      expect(match.loc.end).toEqual({ line: 4, column: 1, offset: 6 });
    });

    it('should handle matchAt at value.length with length=0', () => {
      const scanner = new TextScanner(createTextNode('hello'));
      const match = scanner.matchAt(5, 0);
      expect(match.loc.start).toEqual({ line: 1, column: 6, offset: 5 });
      expect(match.loc.end).toEqual({ line: 1, column: 6, offset: 5 });
    });

    it('should handle empty text matchAt(0, 0)', () => {
      const scanner = new TextScanner(createTextNode(''));
      const match = scanner.matchAt(0, 0);
      expect(match.loc.start).toEqual({ line: 1, column: 1, offset: 0 });
      expect(match.loc.end).toEqual({ line: 1, column: 1, offset: 0 });
    });

    it('should handle CRLF text: \\r counted in column, \\n triggers newline', () => {
      const scanner = new TextScanner(createTextNode('a\r\nb'));
      // 'a' = index 0, '\r' = index 1, '\n' = index 2, 'b' = index 3
      const match = scanner.matchAt(0, 4);
      expect(match.loc.start).toEqual({ line: 1, column: 1, offset: 0 });
      // '\r' at index 1 → column 2; '\n' at index 2 → line 2, column 1; 'b' at index 3 → column 2
      expect(match.loc.end).toEqual({ line: 2, column: 2, offset: 4 });
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

    it('should have accurate loc for high-density matches', () => {
      const scanner = new TextScanner(createTextNode('aaa'));
      const matches = scanner.findAllMatches(/a/g);
      expect(matches).toHaveLength(3);
      expect(matches[0]).toMatchObject({ index: 0, length: 1, loc: { start: { line: 1, column: 1 }, end: { line: 1, column: 2 } } });
      expect(matches[1]).toMatchObject({ index: 1, length: 1, loc: { start: { line: 1, column: 2 }, end: { line: 1, column: 3 } } });
      expect(matches[2]).toMatchObject({ index: 2, length: 1, loc: { start: { line: 1, column: 3 }, end: { line: 1, column: 4 } } });
    });

    it('should have accurate loc across newlines', () => {
      const scanner = new TextScanner(createTextNode('ab\ncd'));
      // Use /[\s\S]/ to match each char including newline
      const matches = scanner.findAllMatches(/[\s\S]/g);
      expect(matches).toHaveLength(5);
      expect(matches[2]).toMatchObject({ index: 2, loc: { start: { line: 1, column: 3 }, end: { line: 2, column: 1 } } }); // '\n'
      expect(matches[3]).toMatchObject({ index: 3, loc: { start: { line: 2, column: 1 }, end: { line: 2, column: 2 } } }); // 'c'
      expect(matches[4]).toMatchObject({ index: 4, loc: { start: { line: 2, column: 2 }, end: { line: 2, column: 3 } } }); // 'd'
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

    it('should have accurate positions for overlapping occurrences across newlines', () => {
      const scanner = new TextScanner(createTextNode('aa\naa'));
      const matches = scanner.findAllOccurrences('aa');
      expect(matches).toHaveLength(2);
      expect(matches[0]).toMatchObject({ index: 0, absoluteRange: [0, 2], loc: { start: { line: 1, column: 1 }, end: { line: 1, column: 3 } } });
      expect(matches[1]).toMatchObject({ index: 3, absoluteRange: [3, 5], loc: { start: { line: 2, column: 1 }, end: { line: 2, column: 3 } } });
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

  describe('index-build diagnostics (issue #176)', () => {
    beforeEach(() => {
      resetScannerDiagnostics();
    });

    it('should not build index for forEachChar (no position lookup needed)', () => {
      const scanner = new TextScanner(createTextNode('a\nb\nc'));
      scanner.forEachChar(() => {});
      expect(getScannerDiagnostics().textScannerIndexBuilds).toBe(0);
      expect(getScannerDiagnostics().textScannerIndexBuildWallTimeMs).toBe(0);
    });

    it('should count one build per scanner that resolves positions', () => {
      const scanner = new TextScanner(createTextNode('a\nb\nc'));
      // findAllMatches forces position resolution -> builds index once
      scanner.findAllMatches(/a/g);
      const diag = getScannerDiagnostics();
      expect(diag.textScannerIndexBuilds).toBe(1);
      expect(diag.textScannerIndexBuildWallTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should build index once per scanner instance even with multiple matches', () => {
      const scanner = new TextScanner(createTextNode('a\nb\nc\nd'));
      scanner.findAllMatches(/[\s\S]/g); // every char incl. newlines
      expect(getScannerDiagnostics().textScannerIndexBuilds).toBe(1);
    });

    it('should accumulate across distinct scanner instances', () => {
      const s1 = new TextScanner(createTextNode('x\ny'));
      const s2 = new TextScanner(createTextNode('p\nq'));
      s1.findAllMatches(/x/g);
      s2.findAllMatches(/p/g);
      expect(getScannerDiagnostics().textScannerIndexBuilds).toBe(2);
    });

    it('should accumulate across two distinct text nodes sharing the same value', () => {
      // Same value, different node identity: index is NOT shared (no cache yet).
      const s1 = new TextScanner(createTextNode('a\nb'));
      const s2 = new TextScanner(createTextNode('a\nb'));
      s1.findAllMatches(/a/g);
      s2.findAllMatches(/a/g);
      expect(getScannerDiagnostics().textScannerIndexBuilds).toBe(2);
    });

    it('reset should clear all counters', () => {
      const scanner = new TextScanner(createTextNode('a\nb'));
      scanner.findAllMatches(/a/g);
      expect(getScannerDiagnostics().textScannerIndexBuilds).toBe(1);
      resetScannerDiagnostics();
      expect(getScannerDiagnostics()).toEqual({
        textScannerIndexBuilds: 0,
        textScannerIndexBuildWallTimeMs: 0
      });
    });
  });
});
