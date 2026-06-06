const { formatForAle } = require('../../packages/ale/src/format');

function makeItem(overrides = {}) {
  return {
    loc: {
      start: { line: 1, column: 3, offset: 0 },
      end: { line: 1, column: 10, offset: 9 }
    },
    name: 'test-rule',
    message: 'test message',
    severity: 2,
    ...overrides
  };
}

describe('formatForAle()', () => {
  describe('output format', () => {
    test('returns empty string for empty lint result', () => {
      expect(formatForAle([], 'test.md')).toBe('');
    });

    test('formats a single item in ALE format', () => {
      const output = formatForAle([makeItem()], 'test.md');
      expect(output).toBe('test.md:1:3: E test-rule: test message\n');
    });

    test('uses the filePath argument for each line', () => {
      const output = formatForAle([makeItem()], 'stdin');
      expect(output).toContain('stdin:1:3:');
    });

    test('formats multiple items with newlines', () => {
      const items = [
        makeItem({ severity: 2 }),
        makeItem({ severity: 1, name: 'other-rule', message: 'other msg' })
      ];
      const lines = formatForAle(items, 'f.md').trim().split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('E test-rule: test message');
      expect(lines[1]).toContain('W other-rule: other msg');
    });

    test('preserves real-world line and column numbers', () => {
      const item = makeItem({
        loc: { start: { line: 42, column: 7 }, end: { line: 42, column: 15 } }
      });
      const output = formatForAle([item], 'doc.md');
      expect(output).toBe('doc.md:42:7: E test-rule: test message\n');
    });
  });

  describe('severity mapping', () => {
    test('severity 2 → E (Error)', () => {
      const output = formatForAle([makeItem({ severity: 2 })], 'f.md');
      expect(output).toContain(': E ');
    });

    test('severity 1 → W (Warning)', () => {
      const output = formatForAle([makeItem({ severity: 1 })], 'f.md');
      expect(output).toContain(': W ');
    });

    test('severity 0 → I (Info)', () => {
      const output = formatForAle([makeItem({ severity: 0 })], 'f.md');
      expect(output).toContain(': I ');
    });

    test('unknown severity → I (Info)', () => {
      const output = formatForAle([makeItem({ severity: undefined })], 'f.md');
      expect(output).toContain(': I ');
    });

    test('mixed severities produce correct type prefixes', () => {
      const items = [
        makeItem({ severity: 2, name: 'e' }),
        makeItem({ severity: 1, name: 'w' }),
        makeItem({ severity: 0, name: 'i' })
      ];
      const output = formatForAle(items, 'f.md');
      expect(output).toContain(': E e:');
      expect(output).toContain(': W w:');
      expect(output).toContain(': I i:');
    });
  });
});
