/**
 * 判断是否为一个合法的 ast 节点
 *
 * @date 2021-12-12 22:01:31
 */
export const isNode = (x: any) => {
  return x !== null && typeof x === 'object' && typeof x.type === 'string';
};
