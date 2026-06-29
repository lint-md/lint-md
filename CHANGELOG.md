# Changelog

## [2.1.0](https://github.com/lint-md/lint-md/compare/v2.0.0...v2.1.0) - 2024-06-29

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
