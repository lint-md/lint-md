// ast-plugin

declare module 'ast-plugin' {
  interface CfgOptions {
    throwError: any;
    config: any;
  }

  class Plugin {
    public cfg: CfgOptions;

    pre();

    post();
  }

  class Ast {
    constructor(...args);

    traverse(...args);
  }

  export { Plugin, Ast };
}

