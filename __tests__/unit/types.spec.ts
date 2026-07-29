import type { TextRange } from '../../src/types';

describe('TextRange', () => {
  test('requires exactly two offsets', () => {
    expect([0, 1] satisfies TextRange).toEqual([0, 1]);

    // TextRange requires exactly two offsets.
    // @ts-expect-error A one-offset range is invalid.
    expect([0] satisfies TextRange).toEqual([0]);

    // @ts-expect-error A three-offset range is invalid.
    expect([0, 1, 2] satisfies TextRange).toEqual([0, 1, 2]);
  });
});
