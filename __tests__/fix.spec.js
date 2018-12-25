import { fix } from '../src';

describe('fix', () => {
  test('fix', () => {
    expect(fix('')).toEqual('');
  });

  test('fix no-empty-code', () => {
    const text = '``` ```';
    expect(fix(text)).toEqual('');
  });
});
