const path = require("path");

module.exports = {
  entry: path.resolve(__dirname, "src", "client", "main.ts"),
  devtool: "inline-source-map",
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
