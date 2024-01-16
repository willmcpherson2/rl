const path = require("path");

module.exports = {
  target: "node",
  entry: path.resolve(__dirname, "src", "main.ts"),
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
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "..", "dist", "server"),
  },
  cache: {
    type: "filesystem",
  },
};
