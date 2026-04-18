module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      'module:react-native-dotenv',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@assets': './assets',
            '@icons': './assets/icons',
            '@fonts': './assets/fonts',
            '@api': './src/api',
            '@components': './src/components',
            '@constants': './src/constants',
            '@hooks': './src/hooks',
            '@navigation': './src/navigation',
            '@providers': './src/providers',
            '@screens': './src/screens',
            '@services': './src/services',
            '@stores': './src/stores',
            '@styles': './src/styles',
            '@types': './src/types',
            '@utils': './src/utils',
            '@src': './src',
          }
        }
      ]
    ]
  };
};
