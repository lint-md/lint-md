export interface LooseObject {
  [key: string]: unknown;
}

export interface Type<T = unknown> extends Function {
  new(...args: unknown[]): T;
}