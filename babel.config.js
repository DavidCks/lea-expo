module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@assets": "./assets",
            "@images": "./assets/images",
            "@fonts": "./assets/fonts",
            "@components": "./src/components",
            "@utils": "./src/urils",
            "@screens": "./src/screens",
            "@": "./",
            "@root": "../",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
    env: {
      production: {
        plugins: [
          "react-native-paper/babel",
          [
            "module-resolver",
            {
              root: ["./"],
              alias: {
                "@assets": "./assets",
                "@images": "./assets/images",
                "@fonts": "./assets/fonts",
                "@components": "./src/components",
                "@urils": "./src/urils",
                "@screens": "./src/screens",
                "@": "./",
                "@root": "../",
              },
            },
          ],
        ],
      },
    },
  };
};
