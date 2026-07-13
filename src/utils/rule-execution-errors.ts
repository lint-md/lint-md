import type { RuleErrorPolicy, RuleExecutionError, RuleExecutionPhase } from '../types';

/**
 * 严格模式专用异常：首次规则执行失败时立即抛出。
 * 携带规范化后的单条 RuleExecutionError，而非把任意原始 throw 值直接暴露给调用方。
 */
export class RuleExecutionFailure extends Error {
  readonly error: RuleExecutionError;

  constructor(error: RuleExecutionError) {
    super(error.message);
    this.name = 'RuleExecutionFailure';
    this.error = error;
  }
}

/**
 * 把任意抛值规范化为消息。
 *
 * `String()` 本身也可能失败，例如 `Object.create(null)` 没有可转换的原型链，
 * 或恶意 Proxy 的转换 hook 再次抛错。错误收集路径必须始终可用，不能让“记录
 * 非 Error 抛值”反而中断 collect 模式。
 */
export const normalizeErrorMessage = (thrown: unknown): string => {
  try {
    if (thrown instanceof Error) {
      return String(thrown.message);
    }
    return String(thrown);
  }
  catch {
    return '[unprintable thrown value]';
  }
};

/**
 * 规则执行错误收集器：在兼容模式下累积，严格模式下首次即抛 RuleExecutionFailure。
 * 由 create/fix/selector 各阶段调用，统一记录 round 与 phase，避免把
 * parser / 遍历器等基础设施故障伪装成“规则失败”。
 */
export const createRuleErrorCollector = (
  policy: RuleErrorPolicy,
  round: number
) => {
  const errors: RuleExecutionError[] = [];

  const collect = (
    ruleName: string,
    phase: RuleExecutionPhase,
    thrown: unknown,
    nodeType?: string
  ): void => {
    const error: RuleExecutionError = {
      ruleName,
      nodeType,
      message: normalizeErrorMessage(thrown),
      round,
      phase
    };
    if (policy === 'strict') {
      throw new RuleExecutionFailure(error);
    }
    errors.push(error);
  };

  return {
    collect,
    // 返回快照，避免调用方持有的结果在稍后执行 fix() 时被隐式改变。
    getErrors: () => errors.map(error => ({ ...error }))
  };
};
