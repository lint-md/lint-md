import * as path from 'path';
import * as fs from 'fs';
import * as Benchmark from 'benchmark';
import type { LintMdRuleWithOptions } from '../../src/types';
import { lintMarkdownInternal } from '../../src/core/lint-markdown';

interface BenchMarkBetweenOptions {
  // 回调函数 1
  cb1: () => void
  // 回调函数 2
  cb2: () => void
  // 期望的倍率，默认为 1
  magnification?: number
  // 执行断言
  check?: boolean
}

/**
 * benchMark 两个回调函数, 并为倍率进行断言
 *
 * @param opt 相关选项，请参考定义
 * @see BenchMarkBetweenOptions
 */
export const benchMarkBetween = async (opt: BenchMarkBetweenOptions) => {
  const { check, magnification = 1, cb1, cb2 } = opt;

  return new Promise((resolve) => {
    // test env, do not use browser to prevent bugs
    Benchmark.support.browser = false;
    const suite = new Benchmark.Suite();

    suite
      .add(cb1.name || 'first', () => {
        cb1();
      })
      .add(cb2.name || 'second', () => {
        cb2();
      })
      // add listeners
      .on('cycle', (event) => {
        console.log(String(event.target));
      })
      .on('complete', function complete() {
        const first = this[0];
        const second = this[1];
        if (check) {
          expect(first.hz / magnification || 5).toBeGreaterThan(second.hz);
        }
        resolve({
          first,
          second
        });
      });
    suite.run();
  });
};

export const createFixer = (ruleConfigs: LintMdRuleWithOptions[]) => {
  return (md: string) => {
    return lintMarkdownInternal(md, ruleConfigs, true);
  };
};

export const getExample = (name: string) => {
  const file = path.resolve(__dirname, '../examples', `${name}.md`);
  return fs.readFileSync(file).toString();
};
