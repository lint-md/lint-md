import { createEmitter } from '../src/utils/emitter';

describe('test emitter', () => {
  test('test sub/pub should running successfully', () => {
    const emitter = createEmitter();
    const fn = jest.fn();
    const fn2 = jest.fn();
    emitter.on('hello', () => {
      fn();
    });

    emitter.on('hello', () => {
      fn2();
    });

    emitter.emit('hello');
    expect(fn).toBeCalled();
    expect(fn2).toBeCalled();
    expect(emitter.getEventNames()).toStrictEqual(['hello']);
  });
});
