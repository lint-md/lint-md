export default class Text {
  constructor(text) {
    // 存储文本的二维数组
    this.texts = this.toTextArray(text);
  }

  toTextArray(text) {
    return text.split('\n').map(line => line.split(''));
  }

  /**
   * 删除某一行
   * @param line
   * @return {Text}
   */
  removeLine(line) {
    return this.removeLines(line, 1)
  }

  /**
   * 从某一行开始删除 n 行，默认为 1 行
   * @param line
   * @param deleteCount
   * @return {Text}
   */
  removeLines(line, deleteCount) {
    return this.spliceLines(line - 1, deleteCount)
  }

  /**
   * 插入一行行内文本
   * @param line
   * @param texts
   */
  insertLines(line, ...texts) {
    return this.spliceLines(line, 0, ...texts);
  }

  spliceLines(startLine, deleteCount, ...texts) {
    const textsArray = texts.map(t => t.split(''));
    this.texts.splice(startLine, deleteCount, ...textsArray);
    return this;
  }

  /**
   * 从某一个位置切断行
   * @param line
   * @param column
   * @return {Text}
   */
  cutLine(line, column) {
    const lineText = this.texts[line - 1];
    this.texts[line - 1] = lineText.slice(0, column - 1);
    // 插入一行
    this.insertLines(line, lineText.slice(column - 1).join(''));

    return this;
  }

  /**
   * 把 line + 1 行合并到 line
   * @param line
   */
  mergeLine(line) {
    const targetLine = this.texts[line - 1];
    const sourceLine  = this.texts[line];
    // 合并到 line - 1 行
    targetLine.splice(targetLine.length, 0, ...sourceLine);

    // 删除下一行
    this.removeLine(line + 1);

    return this;
  }

  /**
   * 删除 start-end 位置文本
   * @param start
   * @param end
   */
  removeBlock(start, end) {
    const { line: startLine, column: startColumn } = start;
    const { line: endLine, column: endColumn } = end;

    if (startLine === endLine) {
      // 删除这几个字符
      this.texts[startLine - 1].splice(startColumn - 1, endColumn - startColumn);

      return this;
    }

    let len = endLine - startLine;

    for (let i = 0; i <= len; i ++) {
      const curr = i + startLine;

      if (i === 0) {
        this.texts[curr - 1] = this.texts[curr - 1].slice(0, startColumn - 1);
      } else if (i === len) {
        this.texts[curr - 1] = this.texts[curr - 1].slice(endColumn - 1);
      } else {
        this.removeLine(curr);
        // 删除了一行，偏移调整一下
        -- i;
        -- len;
      }
    }

    // 合并
    this.mergeLine(startLine);

    return this;
  }

  /**
   * 在 line:column 处插入文本
   * @param line
   * @param column
   * @param block
   */
  insertBlock(line, column, block) {
    const texts = block.split('\n');
    const len = texts.length;

    this.cutLine(line, column);

    // 全部插入
    this.insertLines(line, ...texts);
    // 从下面 merge 开始，避免索引变化
    this.mergeLine(line + len);
    this.mergeLine(line);

    return this;
  }

  getLine(line) {
    return this.texts[line - 1].join('');
  }

  /**
   * 最终的结果
   * @return {string}
   */
  result() {
    return this.texts.map(line => line.join('')).join('\n');
  }
}
