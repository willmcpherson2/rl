const path = require("path");

module.exports = {
  target: "node",
  entry: path.resolve(__dirname, "src", "server", "main.ts"),
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.ts/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "server.json"
          }
        },
        include: [
          path.resolve(__dirname, "src", "server"),
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
    path: path.resolve(__dirname, "dist", "server"),
  },
  cache: {
    type: "filesystem",
  },
};
