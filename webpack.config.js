module.exports = (options, webpack) => {
    return {
      ...options,
      resolve: {
        ...options.resolve,
        alias: {
          '@libs/core': path.resolve(__dirname, 'libs/core/src'),
          '@libs/common': path.resolve(__dirname, 'libs/common/src'),
          '@libs/auth': path.resolve(__dirname, 'libs/auth/src'),
          '@libs/database': path.resolve(__dirname, 'libs/database/src')
        }
      }
    };
  };