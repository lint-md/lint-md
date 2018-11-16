const { h, Component } = require('ink');
const Lint = require('./Lint');

module.exports = class Entry extends Component {

  render() {
    const { action } = this.props;

    const Comp = action === 'lint' ? Lint : 'div';

    return h(
      Comp,
      this.props,
    );
  }
};
