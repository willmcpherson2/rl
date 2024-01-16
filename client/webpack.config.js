const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "src", "main.ts"),
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "static" },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts/,
        loader: "ts-loader",
        include: [
          path.resolve(__dirname, "src"),
          path.resolve(__dirname, "..", "shared"),
        ],
      },
      {
        test: /\.glsl/,
        loader: "ts-shader-loader",
      },
      {
        test: /\.gltf/,
        type: "asset/source",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "..", "dist", "client"),
  },
  cache: {
    type: "filesystem",
  },
};
