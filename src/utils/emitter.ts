/**
 * 初始化一个发布订阅监听器
 *
 * @date 2021-12-05 15:50:56
 */
export const createEmitter = () => {
  const listeners: Record<string, any> = {};

  const on = (eventName, listener) => {
    if (listeners[eventName]) {
      listeners[eventName].push(listener);
    }
    else {
      listeners[eventName] = [listener];
    }
  };

  const emit = (eventName, ...args: any[]) => {
    if (listeners[eventName]) {
      listeners[eventName].forEach(listener => listener(...args));
    }
  };

  const getEventNames = () => {
    return Object.keys(listeners);
  };

  return {
    on,
    emit,
    getEventNames
  };
};
