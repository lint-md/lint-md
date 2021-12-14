import { createFixer } from '../src/utils/fixer';

describe('test fixer', () => {
  const fixer = createFixer();

  test('test insertTextAt() method', () => {
    const res = fixer.insertTextAt(10, 'hello world');
    expect(res).toStrictEqual({
      'range': [
        10,
        10
      ],
      'text': 'hello world'
    });
  });

  test('test insertTextAfterRange() method', () => {
    const res = fixer.insertTextAfterRange([1, 100], 'hello world');
    expect(res).toStrictEqual({
      'range': [
        100,
        100
      ],
      'text': 'hello world'
    });
  });

  test('test insertTextBeforeRange() method', () => {
    const res = fixer.insertTextBeforeRange([100, 120], 'hello world');
    expect(res).toStrictEqual({
      'range': [
        100,
        100
      ],
      'text': 'hello world'
    });
  });

  test('test replaceTextRange() method', () => {
    const res = fixer.replaceTextRange([100, 120], 'hello world');
    expect(res).toStrictEqual({
      'range': [
        100,
        120
      ],
      'text': 'hello world'
    });
  });

  test('test removeRange() method', () => {
    const res = fixer.removeRange([100, 120]);
    expect(res).toStrictEqual({
      'range': [
        100,
        120
      ],
      'text': ''
    });
  });
});
