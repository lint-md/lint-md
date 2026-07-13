/** 返回高精度时间戳（毫秒）。抽离以便测试或不同运行时替换实现。 */
export const now = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
