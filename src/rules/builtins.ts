import type { LintMdRule } from '../types';
import spaceAroundAlphabet from './space-around-alphabet';
import noEmptyList from './no-empty-list';
import noEmptyCode from './no-empty-code';
import noEmptyCodeLang from './no-empty-code-lang';
import noEmptyInlineCode from './no-empty-inline-code';
import noEmptyURL from './no-empty-url';
import noFullWidthNumber from './no-full-width-number';
import noLongCode from './no-long-code';
import noMultipleSpaceBlockquote from './no-multiple-space-blockquote';
import noSpaceInInlineCode from './no-space-in-inline-code';
import noSpaceInLink from './no-space-in-link';
import noSpecialCharacters from './no-special-characters';
import spaceAroundNumber from './space-around-number';
import useStandardEllipsis from './use-standard-ellipsis';
import correctTitleTrailingPunctuation from './correct-title-trailing-punctuation';
import noEmptyBlockquote from './no-empty-blockquote';

export const builtInRules: LintMdRule[] = [
  spaceAroundAlphabet,
  noEmptyList,
  noEmptyCode,
  noEmptyCodeLang,
  noEmptyInlineCode,
  noEmptyURL,
  noFullWidthNumber,
  noLongCode,
  noMultipleSpaceBlockquote,
  noSpaceInInlineCode,
  noSpaceInLink,
  noSpecialCharacters,
  spaceAroundNumber,
  useStandardEllipsis,
  correctTitleTrailingPunctuation,
  noEmptyBlockquote
];
