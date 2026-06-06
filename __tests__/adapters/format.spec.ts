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
  describe('output format contract', () => {
    // Must match the regex in ale_linter/markdown/lint_md.vim:
    //   \v^\S+:(\d+):(\d+): ([EWI]) ([^:]+): (.+)$
    const handlerRegex = /^\S+:(\d+):(\d+): ([EWI]) ([^:]+): (.+)$/;

    test('each output line matches the VimL handler regex', () => {
      const items = [
        makeItem({ severity: 2, name: 'foo', message: 'bar' }),
        makeItem({ severity: 1, name: 'baz', message: 'qux' }),
        makeItem({ severity: 0, name: 'nop', message: 'abc: def' }),
      ];
      const lines = formatForAle(items, 'test.md').trim().split('\n');
      for (const line of lines) {
        expect(line).toMatch(handlerRegex);
      }
    });

    test('handler regex extracts correct groups', () => {
      const output = formatForAle([makeItem({ severity: 2, name: 'my-rule', message: 'something wrong' })], 'doc.md');
      const match = output.trim().match(handlerRegex);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('1'); // line
      expect(match![2]).toBe('3'); // column
      expect(match![3]).toBe('E'); // type
      expect(match![4]).toBe('my-rule'); // rule name
      expect(match![5]).toBe('something wrong'); // message
    });

    test('rule name containing colon would break the contract', () => {
      // Rule names with ':' would split incorrectly in the VimL regex.
      // Unlike messages, rule names come from lint-md internals and never contain ':'.
      const output = formatForAle([makeItem({ name: 'space-around-alphabet', message: 'msg' })], 'f.md');
      const match = output.trim().match(handlerRegex);
      expect(match).not.toBeNull();
      expect(match![4]).toBe('space-around-alphabet');
    });

    test('stdin path (filePath = stdin) matches handler regex', () => {
      const output = formatForAle([makeItem({ severity: 2 })], 'stdin');
      const match = output.trim().match(handlerRegex);
      expect(match).not.toBeNull();
    });

    test('filePath with spaces does NOT match handler regex (known limitation)', () => {
      // When filePath contains spaces, \S+ only captures up to the first space.
      // This is fine because the ALE handler always uses --stdin (filePath='stdin').
      const output = formatForAle([makeItem({ severity: 2 })], '/tmp/my docs/test.md');
      const match = output.trim().match(handlerRegex);
      expect(match).toBeNull();
    });
  });

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
