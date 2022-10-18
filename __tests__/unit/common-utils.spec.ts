import { parseMd } from '@lint-md/parser';
import { getTextNodes } from '../../src/utils/get-text-nodes';

describe('test common utils', () => {
  test('test get text node', () => {
    const res = getTextNodes(parseMd('这就是 ~~删除线~~ ![12312313](213213) **啦啦啦**<div>~~123123~~!<a>测试测试</a></div> [123123123!!](12312313)'));
    expect(res).toMatchSnapshot();
  });
});
