import {
  SourceMapError
} from '@lint-md/parser';
import type { SourceMapErrorCode } from '@lint-md/parser';

const SOURCE_MAP_ERROR_CODES: ReadonlySet<SourceMapErrorCode> = new Set([
  'ERR_SOURCE_MAP_CONSISTENCY',
  'ERR_SOURCE_MAP_UNAVAILABLE'
]);

/** The rule supplied an invalid source range or offset. */
export class InvalidRuleRangeError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRuleRangeError';
  }
}

/** Return true for parser source-map infrastructure errors. */
export const isSourceMapError = (error: unknown): error is SourceMapError => {
  if (error instanceof SourceMapError) {
    return true;
  }

  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return SOURCE_MAP_ERROR_CODES.has(
    (error as { code: SourceMapErrorCode }).code
  );
};
