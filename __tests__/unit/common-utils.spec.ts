import { parseMd } from '@lint-md/parser';
import {
  isChineseCharacter,
  isEnglishCharacter,
  isNumberCharacter
} from '../../src/utils/char-helper';
import { getTextNodes } from '../../src/utils/get-text-nodes';

describe('test common utils', () => {
  test('test get text node', () => {
    const res = getTextNodes(parseMd('这就是 ~~删除线~~ ![12312313](213213) **啦啦啦**<div>~~123123~~!<a>测试测试</a></div> [123123123!!](12312313)'));
    expect(res).toMatchSnapshot();
  });

  test('test char helper', () => {
    expect(isNumberCharacter('1')).toBe(true);
    expect(isNumberCharacter('a')).toBe(false);

    expect(isChineseCharacter('中')).toBe(true);
    expect(isChineseCharacter('1')).toBe(false);

    expect(isEnglishCharacter('a')).toBe(true);
    expect(isEnglishCharacter('中')).toBe(false);
  });
});
