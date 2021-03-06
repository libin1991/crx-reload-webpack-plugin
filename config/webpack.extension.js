const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CrxReloadWebpackPlugin = require('../dist/crxReloadPlugin')

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}
module.exports = {
	context: resolve('template'),
  mode: 'development',
	entry: {
    background: './background/background',
    content: './content/content',
    options: './options/options',
    popup: './popup/popup',
    main: './main/main.js'
  },
	output: {
    path: resolve('dist'),
    filename: '[name]/[name].js'
  },
	resolve: {
    extensions: ['.js', '.json'],
  },
	module: {
		rules: [
		]
	},
	mode: 'development',
  watch: true,
	plugins: [
    new CrxReloadWebpackPlugin({
      manifest: resolve('template/manifest.js'),
      extraPaths:[
        {
          name: 'main',
          inject: resolve('template/main/main.js'),
          listens: [resolve('template/main')]
        }
      ],
      logLevel: 'info'
    }),
		new HtmlWebpackPlugin({
      filename: resolve('dist/popup/popup.html'),
      chunks: ['popup'],
      template: 'popup/popup.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: resolve('dist/options/options.html'),
      chunks: ['options'],
      template: 'options/options.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: resolve('dist/main/main.html'),
      chunks: ['main'],
      template: 'main/main.html',
      inject: false
    }),
		new CopyWebpackPlugin([
			{
				from: 'images',
				to: resolve('dist/images')
			},
      {
        from: 'content/content.css',
        to: resolve('dist/content')
      }
		])
	]
}