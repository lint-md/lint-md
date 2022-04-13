import * as path from 'path';
import * as TerserPlugin from 'terser-webpack-plugin';

const config = () => {
  const isDev = true;

  return {
    entry: './src/index.ts',
    output: {
      // 打包成 commonjs 模块，放入 lib 目录下
      path: path.resolve(process.cwd(), 'lib'),
      filename: 'lint-md-parser.js',
      library: {
        type: 'commonjs',
      },
    },
    target: 'node',
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'source-map' : false,
    optimization: {
      minimize: !isDev,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }) as any,
      ],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  };
};

export default config;
