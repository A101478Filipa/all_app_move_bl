const path = require("path");
const { getDefaultConfig, mergeConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const sharedRoot = path.resolve(__dirname, "../shared");

const config = getDefaultConfig(projectRoot);

config.resolver.assetExts = [...config.resolver.assetExts, "ttf", "otf"];
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter(ext => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
  nodeModulesPaths: [path.resolve(projectRoot, "node_modules")],
  extraNodeModules: {
    "moveplus-shared": path.resolve(sharedRoot, "dist"),
  },
};

config.watchFolders = [
  sharedRoot,
];

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

module.exports = config;
