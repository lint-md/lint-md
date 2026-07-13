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

/** 把任意抛值规范化为消息：Error 取 message，其余用 String() 归一化 */
export const normalizeErrorMessage = (thrown: unknown): string =>
  thrown instanceof Error ? thrown.message : String(thrown);

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
    getErrors: () => errors
  };
};
