import { version } from '../src';
import pkg from '../package.json';

describe('version', () => {
  test('version', () => {
    console.log(version);
    expect(version).toEqual(pkg.version);
  });
});
