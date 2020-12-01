const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "src/web/index.html") },
        { from: path.resolve(__dirname, "src/web/styles.css") },
        { from: path.resolve(__dirname, "src/web/normalize.css") },
        { from: "model", to: "model" },
      ],
    }),
  ],
};