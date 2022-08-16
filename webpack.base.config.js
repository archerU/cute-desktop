
module.exports = {
  mode: 'development',
  devtool: false,
  entry: {
    renderer: './app/app.js',
    'win-updater': './updater/win/index.js',
    'mac-updater': './updater/mac/index.js',
    // 'guest-api': './guest-api',
  },
  output: {
    path: __dirname + '/bundles',
    filename: '[name].js',
    publicPath: '',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
    ]
  },
  resolve: { extensions: ["*", ".js", ".jsx"] },
  // optimization: {
  //   splitChunks: {
  //     chunks: chunk => chunk.name === 'renderer',
  //     name: 'vendors~renderer',
  //   },
  //   moduleIds: 'deterministic',
  // }
}