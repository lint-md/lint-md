declare module 'ast-plugin' {
  interface CfgOptions {
    throwError: () => void
  }

  export class Plugin {
    declare cfg: CfgOptions;
  }
}