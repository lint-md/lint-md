import { getDescription } from '../src';

describe('description', () => {
  test('getDescription', () => {
    expect(getDescription('')).toEqual(undefined);
    expect(getDescription('no-fullwidth-number')).toEqual({
      message: 'Full-width number exist.'
    });
    expect(getDescription('no-fullwidth-number', 'en_US')).toEqual({
      message: 'Full-width number exist.'
    });
  });
});
