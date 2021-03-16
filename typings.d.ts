// ast-plugin

declare module 'ast-plugin' {
  interface CfgOptions {
    throwError: unknown;
    config: unknown;
  }

  class Plugin {
    public cfg: CfgOptions;
    public static type: string;

    pre();

    post();
  }

  class Ast {
    constructor(...args);

    traverse(...args);
  }

  export { Plugin, Ast };
}

