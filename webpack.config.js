const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node",
  mode: "development",
  entry: {
    run: "./src/index.ts",
    clear: "./src/clear.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, "run"),
  },
  externals: [nodeExternals()],
};
