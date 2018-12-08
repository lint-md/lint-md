import { version } from '../src';
import pkg from '../package.json';

describe('version', () => {
  test('version', () => {
    expect(version).toEqual(pkg.version);
  });
});
