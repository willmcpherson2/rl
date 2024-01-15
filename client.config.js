const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "src", "client", "main.ts"),
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/static" },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "client.json"
          }
        },
        include: [
          path.resolve(__dirname, "src", "client"),
          path.resolve(__dirname, "src", "shared"),
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist", "client"),
  },
  cache: {
    type: "filesystem",
  },
};
