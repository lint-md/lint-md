export const toPath = path =>
  typeof path === 'string' ?
    path.replace(/(\[\d+\])/g, s => `.${s.slice(1, -1)}`) // [0] -> .0
      .split('.') :
    path;
