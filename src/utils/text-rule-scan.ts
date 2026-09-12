import type { LintSourceCode } from '../types.js';
import type { MarkdownTextNode } from './get-text-nodes.js';
import {
  isChineseCharacter,
  isEnglishCharacter,
  isNumberCharacter
} from './char-helper.js';

const HALF_WIDTH_PUNCTUATION = new Set([',', '.', ';', ':', '!', '?', '(', ')']);

export interface TextPunctuation {
  char: string
  index: number
}

export interface TextBoundary {
  index: number
  length: number
  firstLength: number
}

export interface TextRuleScan {
  alphabetBoundaries: TextBoundary[]
  numberBoundaries: TextBoundary[]
  punctuationCharacters: TextPunctuation[]
  parenthesisPairs: [number, number][]
}

interface CachedTextRuleScan {
  value: string
  scan: TextRuleScan
}

const scanTextNode = (node: MarkdownTextNode): TextRuleScan => {
  const alphabetBoundaries: TextBoundary[] = [];
  const numberBoundaries: TextBoundary[] = [];
  const punctuationCharacters: TextPunctuation[] = [];
  const parenthesisPairs: [number, number][] = [];
  const parenthesisStack: number[] = [];
  let previousChar: string | undefined;
  let previousIndex = 0;
  let previousIsChinese = false;
  let previousIsEnglish = false;
  let previousIsNumber = false;

  for (let index = 0; index < node.value.length;) {
    const char = String.fromCodePoint(node.value.codePointAt(index)!);
    const isChinese = isChineseCharacter(char);
    const isEnglish = isEnglishCharacter(char);
    const isNumber = isNumberCharacter(char);

    if (previousChar !== undefined) {
      const length = previousChar.length + char.length;
      const isAlphabetBoundary = (previousIsChinese && isEnglish)
        || (previousIsEnglish && isChinese);
      if (isAlphabetBoundary) {
        alphabetBoundaries.push({
          index: previousIndex,
          length,
          firstLength: previousChar.length
        });
      }

      const isNumberBoundary = (previousIsChinese && isNumber)
        || (previousIsNumber && isChinese);
      const isPercentBoundary = previousChar === '%'
        && previousIndex > 0
        && isChinese
        && node.value.charCodeAt(previousIndex - 1) >= 48
        && node.value.charCodeAt(previousIndex - 1) <= 57;
      if (isNumberBoundary || isPercentBoundary) {
        numberBoundaries.push({
          index: previousIndex,
          length,
          firstLength: previousChar.length
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

export interface TextRuleScanSession {
  readonly consumerCount: number
  get: (node: MarkdownTextNode) => TextRuleScan
}

class TextRuleScanSessionImpl implements TextRuleScanSession {
  private readonly scanCache = new WeakMap<MarkdownTextNode, CachedTextRuleScan>();
  private _consumerCount = 0;

  get consumerCount(): number {
    return this._consumerCount;
  }

  register(): void {
    this._consumerCount++;
  }

  get(node: MarkdownTextNode): TextRuleScan {
    const cached = this.scanCache.get(node);
    if (cached?.value === node.value) {
      return cached.scan;
    }

    const scan = scanTextNode(node);
    this.scanCache.set(node, { value: node.value, scan });
    return scan;
  }
}

const sessions = new WeakMap<LintSourceCode, TextRuleScanSessionImpl>();

export const registerTextRuleScanConsumer = (sourceCode: LintSourceCode): TextRuleScanSession => {
  let session = sessions.get(sourceCode);
  if (!session) {
    session = new TextRuleScanSessionImpl();
    sessions.set(sourceCode, session);
  }
  session.register();
  return session;
};
