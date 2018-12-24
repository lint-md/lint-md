const { h, render, Component, Color } = require('ink');
const loadMdFiles = require('../helper/file');
const lint = require('./lint');
const string = require('../helper/string');
const { getDescription } = require('../../lib');

/**
 * Lint 组件
 * @type {module.Lint}
 */
module.exports = class Lint extends Component {

  constructor(props) {
    super(props);

    this.state = {
      // 错误，格式为：{ path, file, errors: { start: { line, column }, end: { line, column } level, text, type } }
      errorFiles: [],
      // 当前检查文件数量
      fileCount: 0,
    };
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    const { files, config, onExit } = this.props;

    const mdFiles = await loadMdFiles(files, config);

    for (const file of mdFiles) {
      const errorFile = await lint(file, config);

      let { errorFiles, fileCount } = this.state;
      fileCount += 1;

      if (errorFile && errorFile.length > 0) {
        errorFiles = errorFiles.concat(errorFile);
      }

      await this.setStateAsync({
        errorFiles,
        fileCount,
      });
    }

    const { error, warning } = this.errorCount();
    // 是否出错
    onExit(error === 0 ? 0 : 1);
  }

  setStateAsync(state) {
    return new Promise((resolve, reject) => {
      this.setState(state, () => {
        resolve();
      });
    });
  };

  renderError(error) {
    const { start, end, level, text, type } = error;
    const props = level === 'error' ? { red: true } : { yellow: true };

    const pos = `${start.line}:${start.column}-${end.line}:${end.column}`;

    return h('div', {}, [
      '  ',
      h('span', {}, h(Color, { grey: true }, string.rightPad(pos, 16))),
      '  ',
      h('span', {}, h(Color, { grey: true }, string.rightPad(`${type}`, 24))),
      '  ',
      h(Color, props, `${getDescription(type).message} ${text}`),
    ]);
  }

  renderFile(errorFile) {
    const { path, file, errors } = errorFile;
    return h('div', {}, [
      h('div', {}, `${path}/${file}`), // 文件
      ...errors.map(error => this.renderError(error)), // 错误
    ]);
  }

  renderErrorFiles() {
    const { errorFiles } = this.state;

    return h('span', {}, errorFiles.map(errorFile => this.renderFile(errorFile)));
  }

  errorCount() {
    const { errorFiles } = this.state;

    const warningCnt = errorFiles.reduce((r, current) => {
      return r + current.errors.filter(error => error.level === 'warning').length;
    }, 0);

    const errorCnt = errorFiles.reduce((r, current) => {
      return r + current.errors.filter(error => error.level === 'error').length;
    }, 0);

    return {
      error: errorCnt,
      warning: warningCnt,
    };
  };

  renderOverview() {
    const { fileCount } = this.state;
    const { error, warning } = this.errorCount();

    return h('span', {}, [
      h('span', {}, h(Color, { green: true }, `Lint total ${fileCount} files`)),
      h('span', {}, h(Color, { grey: true }, ',')),
      ' ',
      h('span', {}, h(Color, { yellow: true }, `${warning} warnings`)),
      ' ',
      h('span', {}, h(Color, { red: true }, `${error} errors`)),
    ]);
  }

  render() {
    // 渲染错误
    return h(
      'div',
      {},
      [ this.renderErrorFiles(), this.renderOverview() ]
    );
  }
};
