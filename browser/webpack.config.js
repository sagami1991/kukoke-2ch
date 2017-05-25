const CopyWebpackPlugin = require('copy-webpack-plugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const config = {
	outputPath: "../build/browser"
}
var path = require('path');

module.exports = [
	// typescriptビルド
	{
		entry: ["./src/ts/app.ts"],
		output: {
			path: config.outputPath,
			filename: "bundle.js",
		},
		devtool: "source-map",
		resolve: {
			modules: [
				path.resolve('./src/ts'),
				path.resolve('./node_modules')
			],
			extensions: [".ts", ".js"],
			alias: {
				lodash: 'lodash-es'
			}
		},
		module: {
			rules: [
				{ 
					test: /\.ts?$/,
					use: { loader: "ts-loader" } },
				{
					test: /\.svg$/,
					use: { loader: 'svg-inline-loader' }
				}, {
					test: /.txt$/,
					use: { loader: 'raw-loader'}
				}
				// { test: /\.scss$/, loaders: ['style', 'css', 'sass'] },
			]
		},
		plugins: [
			new CopyWebpackPlugin([
				{ from: 'src/index.html', to: 'index.html' },
				{ from: "src/resources", to: "resources" }
			]),
			new ProvidePlugin({
				$: "jquery",
				toastr: "toastr"
			}
			),
		],
		externals: {
			remote: "remote",
		},
		target: "electron"
	},
	// scssビルド
	// TODO sourcemap
	{
		entry: {
			style: [
				'./src/scss/main.scss',
				"./node_modules/toastr/build/toastr.css"
			]
		},
		output: {
			path: config.outputPath,
			filename: '[name].css'
		},
		module: {
			rules: [
				{ test: /\.css$/, use: ExtractTextPlugin.extract({ use: 'css-loader' }) },
				{ test: /\.scss$/, use: ExtractTextPlugin.extract({ use: 'css-loader!sass-loader' }) },
				{ test: /\.png$/, use: "url-loader?limit=10000&mimetype=image/png" },
				{ test: /\.svg$/, use: "svg-url-loader" },
			]
		},
		plugins: [
			new ExtractTextPlugin("[name].css")
		]
	}];