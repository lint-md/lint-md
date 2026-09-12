import type { LintSourceCode } from '../types.js';
import type { MarkdownTextNode } from './get-text-nodes.js';
import {
  isChineseCharacter,
  isEnglishCharacter,
  isNumberCharacter
} from './char-helper.js';

const HALF_WIDTH_PUNCTUATION = new Set([',', '.', ';', ':', '!', '?', '(', ')']);

export interface PunctuationCharacter {
  char: string
  index: number
}

export interface TextBoundary {
  start: number
  totalLength: number
  firstCharacterLength: number
}

export interface TextNodeAnalysis {
  alphabetBoundaries: TextBoundary[]
  numberBoundaries: TextBoundary[]
  punctuationCharacters: PunctuationCharacter[]
  parenthesisPairs: [number, number][]
}

interface CachedTextNodeAnalysis {
  sourceValue: string
  result: TextNodeAnalysis
}

const scanTextValue = (value: string): TextNodeAnalysis => {
  const alphabetBoundaries: TextBoundary[] = [];
  const numberBoundaries: TextBoundary[] = [];
  const punctuationCharacters: PunctuationCharacter[] = [];
  const parenthesisPairs: [number, number][] = [];
  const parenthesisStack: number[] = [];
  let previousChar: string | undefined;
  let previousIndex = 0;
  let previousIsChinese = false;
  let previousIsEnglish = false;
  let previousIsNumber = false;

  for (let index = 0; index < value.length;) {
    const char = String.fromCodePoint(value.codePointAt(index)!);
    const isChinese = isChineseCharacter(char);
    const isEnglish = isEnglishCharacter(char);
    const isNumber = isNumberCharacter(char);

    if (previousChar !== undefined) {
      const length = previousChar.length + char.length;
      const isAlphabetBoundary = (previousIsChinese && isEnglish)
        || (previousIsEnglish && isChinese);
      if (isAlphabetBoundary) {
        alphabetBoundaries.push({
          start: previousIndex,
          totalLength: length,
          firstCharacterLength: previousChar.length
        });
      }

      const isNumberBoundary = (previousIsChinese && isNumber)
        || (previousIsNumber && isChinese);
      const isPercentBoundary = previousChar === '%'
        && previousIndex > 0
        && isChinese
        && value.charCodeAt(previousIndex - 1) >= 48
        && value.charCodeAt(previousIndex - 1) <= 57;
      if (isNumberBoundary || isPercentBoundary) {
        numberBoundaries.push({
          start: previousIndex,
          totalLength: length,
          firstCharacterLength: previousChar.length
        });
      }
    }

    if (HALF_WIDTH_PUNCTUATION.has(char)) {
      punctuationCharacters.push({ char, index });
    }

    if (char === '(') {
      parenthesisStack.push(index);
    }
    else if (char === ')') {
      const openIndex = parenthesisStack.pop();
      if (openIndex !== undefined) {
        parenthesisPairs.push([openIndex, index]);
      }
    }

    previousChar = char;
    previousIndex = index;
    previousIsChinese = isChinese;
    previousIsEnglish = isEnglish;
    previousIsNumber = isNumber;
    index += char.length;
  }

  return {
    alphabetBoundaries,
    numberBoundaries,
    punctuationCharacters,
    parenthesisPairs
  };
};

export interface TextNodeAnalysisSession {
  readonly consumerCount: number
  get: (node: MarkdownTextNode) => TextNodeAnalysis
}

class TextNodeAnalysisSessionImpl implements TextNodeAnalysisSession {
  private readonly scanCache = new WeakMap<MarkdownTextNode, CachedTextNodeAnalysis>();
  private _consumerCount = 0;

  get consumerCount(): number {
    return this._consumerCount;
  }

  register(): void {
    this._consumerCount++;
  }

  get(node: MarkdownTextNode): TextNodeAnalysis {
    const cached = this.scanCache.get(node);
    if (cached?.sourceValue === node.value) {
      return cached.result;
    }

    const result = scanTextValue(node.value);
    this.scanCache.set(node, { sourceValue: node.value, result });
    return result;
  }
}

const sessions = new WeakMap<LintSourceCode, TextNodeAnalysisSessionImpl>();

export const registerTextNodeAnalysisConsumer = (sourceCode: LintSourceCode): TextNodeAnalysisSession => {
  let session = sessions.get(sourceCode);
  if (!session) {
    session = new TextNodeAnalysisSessionImpl();
    sessions.set(sourceCode, session);
  }
  session.register();
  return session;
};
