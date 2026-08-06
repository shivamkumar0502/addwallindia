module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4 / react-native-worklets: babel-preset-expo auto-adds the
    // worklets babel plugin when react-native-worklets is installed, so no
    // manual plugin entry is needed here (the old 'react-native-reanimated/plugin'
    // entry is outdated for v4 and can silently break animations if kept).
  };
};
