# Changelog

## [2.1.6](https://github.com/lint-md/lint-md/compare/v2.1.5...v2.1.6) - 2026-07-19

### Bug Fixes

- **text-scanner**: use parser source maps for inline-code value ranges, correctly handling padding normalization and multi-backtick delimiters (#198)
- **deps**: bump `@lint-md/parser` to `~0.2.0` (#198)

## [2.1.5](https://github.com/lint-md/lint-md/compare/v2.1.4...v2.1.5) - 2026-07-13

### Features

- **override-default-rules**: alias third-party rules by `rule.meta.name`; throw on invalid config; detect option conflicts (#181)
- **handle-fix-mode**: track convergence state, rounds, and fix-loop cycle detection (#182)
- **rule-manager**: observable `fallbackHits` statistics and parser-offset contract tests (#183)
- **run-lint**: structured root-level rule execution errors with collect/strict policy and `RuleExecutionFailure` public export (#185, #179)
- **text-scanner**: observable index-build diagnostics and reproducible #176 profile script (#184)

### Performance

- **text-scanner**: pre-compute line-break indices, `positionAt` from O(n) to O(log n) binary search (#174)

## [2.1.4](https://github.com/lint-md/lint-md/compare/v2.1.3...v2.1.4) - 2026-07-10

### Bug Fixes

- **no-long-code**: compute real offset to stop content degrading to whole doc (#170)
- **lint-markdown**: add function overloads for fixedResult return type, correct README description (#172)
- **handle-fix-mode**: align autofix semantics with ESLint, support cascading fixes (#173)
- **handle-fix-mode**: preserve last-round notAppliedFixes instead of resetting to empty, expose via public API (#175)

### Performance

- **text-scanner**: lazy pre-compute line break indices, positionAt from O(n) to O(log n) via binary search (#174)

## [2.1.3](https://github.com/lint-md/lint-md/compare/v2.1.2...v2.1.3) - 2026-07-06

### Performance

- **space-around-alphabet**: scan original string directly, eliminate markText split/map/join temporary allocation, RSS -79.7% on 1 MiB long-paragraph (#160, #165)

### Chore

- add memory benchmark infrastructure and analysis scripts (#163, #164)

## [2.1.2](https://github.com/lint-md/lint-md/compare/v2.1.1...v2.1.2) - 2026-07-03

### Chore

- bump @lint-md/parser to ~0.1.2 (#159)

## [2.1.1](https://github.com/lint-md/lint-md/compare/v2.0.0...v2.1.1) - 2026-06-30

### Features

- **diagnostics**: add LintDiagnostic standard format and toALEOutput converter (#137)
- add no-half-width-punctuation rule to detect half-width punctuation (#129)

### Bug Fixes

- **build**: replace npm-run-all with npm-run-all2 (#147)
- **build**: replace yarn with npm and add push trigger (#134)
- **run-lint**: replace console.log with console.error to surface rule execution failures (#141)
- **B2**: 消除 @ts-expect-error、as any、隐式 any，提升类型安全 (#139)
- detect percent suffix of number in space-around-number (#129)
- no-space-in-inline-code backtick handling & correct-title-trailing (#127)
- replace while(true) with clean exec() loop, fix premature break (#126)
- wrong boolean operator in no-space-in-link guard (#117)

### Performance

- remove lodash dependency (50KB → 0) (#121)
- hoist regex literals to module-level constants in char-helper (#122)
- eliminate intermediate nodeQueue in runLint (#115)

### Refactoring

- introduce TextScanner to deduplicate text rule boilerplate (#151)
- lint-markdown: replace require() with static import for type safety (#136)

### Documentation

- add missing no-half-width-punctuation rule to table (#135)
- restructure README for scannable product overview (#130)
- Revise README for clarity and consistency

### Chore

- add lint, typecheck, prepublishOnly scripts and fix lint errors (#149)
- update checkout action to v6 (#125)

## [2.0.0](https://github.com/lint-md/lint-md/releases/tag/v2.0.0) - 2024-01-01

### Breaking Changes

- Complete rewrite with TypeScript support
- New rule configuration system
- ESM + CJS dual module output
