import type { MarkdownNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { TextScanner } from '../utils/text-scanner';

const FULL_WIDTH_NUMBER_REPLACEMENT_MAP: Record<string, string> = {
  '１': '1',
  '２': '2',
  '３': '3',
  '４': '4',
  '５': '5',
  '６': '6',
  '７': '7',
  '８': '8',
  '９': '9',
  '０': '0'
};

const noFullWidthNumber: LintMdRule = {
  meta: {
    name: 'no-full-width-number'
  },
  create: (context) => {
    return {
      text: (node: MarkdownNode & { value: string }) => {
        const scanner = new TextScanner(node);
        const matches = scanner.findAllMatches(/[０-９]+/g);

        matches.forEach((m) => {
          const replacement = scanner.value.slice(m.index, m.index + m.length)
            .split('')
            .map(c => FULL_WIDTH_NUMBER_REPLACEMENT_MAP[c])
            .join('');

          context.report({
            loc: m.loc,
            message: '不能用全角数字，请使用半角数字',
            fix: fixer => fixer.replaceTextRange(m.absoluteRange, replacement)
          });
        });
      }
    };
  }
};

export default noFullWidthNumber;
