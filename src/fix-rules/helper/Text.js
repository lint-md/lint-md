export default class Text {
  constructor(text) {
    // this.text = text;
    this.lines = text.split('\n');
  }


  removeLine(line) {
    this.text = this.lines.splice(line, 1);
    return this;
  }

  result() {
    return this.lines.join('\n');
  }
}
