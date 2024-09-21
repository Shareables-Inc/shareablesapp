const chokidar = require('chokidar');
const blacklist = require('metro-config/src/defaults/blacklist');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
      blacklistRE: blacklist([
        /node_modules\/.*\/node_modules\/react-native\/.*/,
        /node_modules\/react-native\/.*/,
        /node_modules\/.*/
      ]),
    },
    watchFolders: [
      // Add any additional watch folders if necessary
    ],
    projectRoot: __dirname,
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    server: {
      enhanceMiddleware: (middleware) => {
        const watcher = chokidar.watch([], { ignored: /node_modules/ });
        watcher.on('all', (event, path) => {
          middleware.serveBundleUpdated(event, path);
        });
        return middleware;
      },
    },
  };
})();