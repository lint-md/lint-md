const fs = require('fs');
const path = require('path');
const glob = require('glob');

const isFile = path => {
  return fs.statSync(path).isFile();
};

const isDirectory = path => {
  return fs.statSync(path).isDirectory();
};

/**
 * 读取所有文件
 * @param src
 * @param config
 * @returns {Promise<any>}
 */
module.exports = (src, config) => {
  const { excludeFiles } = config;

  return new Promise((resolve, reject) => {
    const srcArr = Array.isArray(src) ? src : [src];

    setTimeout(() => {
      const files = [];

      for (let i = 0; i < srcArr.length; i ++) {
        let f = [];
        const p = path.resolve(srcArr[i]);
        if (isDirectory(p)) {
          f = glob.sync(`${p}/**/*.{md,markdown}`, { ignore: excludeFiles });
        }
        else if (isFile(p)) {
          f = glob.sync(`${p}`, { ignore: excludeFiles });
        }

        files.push(...f);
      }
      resolve(files);
    }, 0);
  });
};
