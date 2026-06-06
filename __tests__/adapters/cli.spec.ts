const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const binPath = path.resolve(__dirname, '../../packages/ale/bin/lint-md-ale.js');

function lint(opt) {
  const args = opt.file ? [opt.file] : ['--stdin'];
  try {
    const stdout = execSync(`node "${binPath}" ${args.join(' ')}`, {
      encoding: 'utf8',
      stdio: 'pipe',
      input: opt.stdin
    });
    return { stdout: stdout || null, exitCode: 0 };
  }
  catch (err) {
    return { stdout: err.stdout || null, exitCode: err.status };
  }
}

describe('lint-md-ale CLI', () => {
  const markdownWithError = '中文English 123';
  const cleanMarkdown = '# Hello World\n\nThis is clean.\n';

  describe('handler contract', () => {
    const handlerPath = path.resolve(__dirname, '../../packages/ale/ale_linter/markdown/lint_md.vim');

    test('VimL handler command uses --stdin for real-time buffer linting', () => {
      const content = fs.readFileSync(handlerPath, 'utf8');
      const commandLine = content.split('\n').find(line => line.includes('\'command\':'));
      expect(commandLine).toContain('--stdin');
    });
  });

  describe('stdin input', () => {
    test('outputs ALE-formatted errors via stdin', () => {
      const { stdout } = lint({ stdin: markdownWithError });
      expect(stdout).toContain('stdin:1:1:');
      expect(stdout).toContain('space-around-alphabet');
    });

    test('exit code 1 when issues found via stdin', () => {
      const { exitCode } = lint({ stdin: markdownWithError });
      expect(exitCode).toBe(1);
    });

    test('exit code 0 when no issues found via stdin', () => {
      const { exitCode, stdout } = lint({ stdin: cleanMarkdown });
      expect(exitCode).toBe(0);
      expect(stdout).toBeNull();
    });

    test('produces no output for clean markdown via stdin', () => {
      const { stdout } = lint({ stdin: cleanMarkdown });
      expect(stdout).toBeNull();
    });
  });

  describe('file input', () => {
    const tmpFile = '/tmp/lint-md-ale-test.md';

    afterEach(() => {
      try {
        fs.unlinkSync(tmpFile);
      }
      catch (e) {
        /* ignore */
      }
    });

    test('outputs ALE-formatted errors for file', () => {
      fs.writeFileSync(tmpFile, markdownWithError, 'utf8');
      const { stdout } = lint({ file: tmpFile });
      expect(stdout).toContain(`${tmpFile}:1:1:`);
      expect(stdout).toContain('space-around-alphabet');
    });

    test('exit code 1 when issues found in file', () => {
      fs.writeFileSync(tmpFile, markdownWithError, 'utf8');
      const { exitCode } = lint({ file: tmpFile });
      expect(exitCode).toBe(1);
    });

    test('exit code 0 when file is clean', () => {
      fs.writeFileSync(tmpFile, cleanMarkdown, 'utf8');
      const { exitCode, stdout } = lint({ file: tmpFile });
      expect(exitCode).toBe(0);
      expect(stdout).toBeNull();
    });
  });

  describe('exit code semantics', () => {
    // ALE primarily parses stdout for diagnostics; exit code only matters
    // when the linter crashes (non-zero + no output → ALE shows error).
    // We follow standard lint tool convention: exit 1 on any finding.

    test('exit code 1 when error-level issues found (severity 2)', () => {
      const { exitCode } = lint({ stdin: markdownWithError });
      expect(exitCode).toBe(1);
    });

    test('exit code 0 when markdown is clean', () => {
      const { exitCode } = lint({ stdin: cleanMarkdown });
      expect(exitCode).toBe(0);
    });
  });
});
