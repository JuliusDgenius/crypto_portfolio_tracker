const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = (options, webpack) => {
  const rootDir = process.cwd();
  
  return {
    ...options,
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
      main: path.join(rootDir, 'apps/api/src/main.ts')
    },
    
    output: {
      // Ensure the output path matches NestJS's expectations
      path: path.join(rootDir, 'dist/apps/api'),
      filename: 'main.js',
      clean: true,
      libraryTarget: 'commonjs2'
    },
    
    optimization: {
      runtimeChunk: false,
      minimize: false
    },
    
    target: 'node',
    externals: [nodeExternals({
      // This is important for proper handling of dependencies
      allowlist: ['webpack/hot/poll?100']
    })],
    
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.join(rootDir, 'apps/api/tsconfig.json'),
          },
          exclude: /node_modules/
        },
      ],
    },
    
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@libs/core': path.join(rootDir, 'libs/core/src'),
        '@libs/common': path.join(rootDir, 'libs/common/src'),
        '@libs/auth': path.join(rootDir, 'libs/auth/src'),
        '@libs/database': path.join(rootDir, 'libs/database/src'),
        '@libs/config': path.join(rootDir, 'libs/config/src'),
        '@libs/crypto': path.join(rootDir, 'libs/crypto/src'),
        '@libs/portfolio': path.join(rootDir, 'libs/portfolio/src'),
        '@libs/watchlist': path.join(rootDir, 'libs/watchlist/src'),
      },
    },
    
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/]
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.join(rootDir, 'libs/common/src/email/templates'),
            to: path.join(rootDir, 'dist/apps/api/templates'),
            noErrorOnMissing: true,
          }
        ]
      })
    ],
    
    stats: {
      warnings: false
    }
  };
};