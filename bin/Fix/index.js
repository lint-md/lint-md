const { h, render, Component, Color } = require('ink');
const loadMdFiles = require('../helper/file');
const fix = require('./fix');
const string = require('../helper/string');

/**
 * Fix 组件
 * @type {module.Fix}
 */
module.exports = class Fix extends Component {

  constructor(props) {
    super(props);

    this.state = {
      files: [], // 处理的文件
    };
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    const { files, config, onExit } = this.props;

    const mdFiles = await loadMdFiles(files, config);

    for (const file of mdFiles) {
      const rewrite = await fix(file, config);

      let { files } = this.state;

      // 重新过的，才加进去
      if (rewrite) {
        files = files.concat(file);
      }

      await this.setStateAsync({
        files,
      });
    }

    // 退出
    onExit(0);
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
      h(Color, props, text),
    ]);
  }

  renderFiles() {
    const { files } = this.state;

    return h('span', {}, files.map(f => h('div', {}, h(Color, { green: true }, f))));
  }

  render() {
    // 渲染错误
    return h(
      'div',
      {},
      [ this.renderFiles() ]
    );
  }
};
