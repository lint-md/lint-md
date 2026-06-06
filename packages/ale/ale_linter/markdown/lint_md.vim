" lint-md ALE linter definition
" Install: copy this file to your ALE linters directory:
"   cp ale_linter/markdown/lint_md.vim ~/.vim/pack/*/start/ale/ale_linters/markdown/
"
" Output format (produced by formatForAle in src/format.js):
"   <file>:<line>:<col>: <E|W|I> <rule>: <message>
"
" The callback below parses this format and returns ALE-compatible diagnostics.
" When the format changes, update both format.js and this regex together.

function! s:HandleLintMd(buffer, lines) abort
  let l:output = []

  for l:raw in a:lines
    " <file>:<line>:<col>: <type> <code>: <message>
    let l:match = matchlist(l:raw, '\v^\S+:(\d+):(\d+): ([EWI]) ([^:]+): (.+)$')

    if !empty(l:match)
      call add(l:output, {
      \   'lnum': str2nr(l:match[1]),
      \   'col': str2nr(l:match[2]),
      \   'type': l:match[3],
      \   'text': l:match[4] . ': ' . l:match[5],
      \})
    endif
  endfor

  return l:output
endfunction

call ale#linter#Define('markdown', {
\   'name': 'lint-md',
\   'executable': 'lint-md-ale',
\   'command': '%e --stdin',
\   'callback': 's:HandleLintMd',
\})
