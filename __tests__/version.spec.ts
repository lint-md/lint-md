import { version } from '../src';
import * as pkg from '../package.json';

describe('version', () => {
  test('version', () => {
    expect(version).toEqual(pkg.version);
  });
});
