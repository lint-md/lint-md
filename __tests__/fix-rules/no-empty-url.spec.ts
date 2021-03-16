import { fix } from '../../src';

describe('no-empty-url', () => {
  test('no fix', () => {
    let md = '访问[atool](https://atool.vip)拿到更多工具！';
    expect(fix(md)).toEqual(md);

    md = '看图片![atool](https://atool.vip)，在这里！';
    expect(fix(md)).toEqual(md);
  });

  test('fix', () => {
    let md = '访问[atool]()拿到更多工具！';
    expect(fix(md)).toEqual('访问[atool](.)拿到更多工具！');

    md = '看图片![atool](  )，在这里！';
    expect(fix(md)).toEqual('看图片![atool](.)，在这里！');
  });
});
