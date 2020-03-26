require('dotenv').config();
const path = require('path');
const webpack = require('webpack')
const ZipPlugin = require('zip-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const rm = require('rimraf');

rm.sync('./dist')

const production = process.env.FIO_ENV === 'production';

const staticPlugins = [
	new Dotenv(),
	new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }),
	new webpack.HashedModuleIdsPlugin(),
];
const prodPlugins = staticPlugins.concat([
	new ZipPlugin({ path: '../', filename: 'fio.zip' }),
])

const productionPlugins = !production ? staticPlugins : prodPlugins;

const replaceSuffixes = (file) => file.replace('scss', 'css');

const filesToPack = [
	'background.js',
	'inject.js',
	'content.js',
	'popup.js',
	'prompt.js',
];
const entry = filesToPack.reduce((o, file) => Object.assign(o, {[replaceSuffixes(file)]: `./src/${file}`}), {});

module.exports = {
	entry,
	output: {
		path: path.resolve(__dirname, './dist'),
		filename: '[name]',
		chunkFilename: '[name].bundle.js',
	},
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
		},
		extensions: ['.js', '.vue', '.json'],
		modules: [ path.join(__dirname, "node_modules") ]
	},

	optimization: {
		minimize: false,
	},



	module: {
		rules:[
			{ test: /\.js$/, loader: 'babel-loader', query: { presets: ['es2015', 'stage-3'] }, exclude: /node_modules/ },
			{ test: /\.(sa|sc|c)ss$/, use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'], },
			{ test: /\.(html|png)$/, loader: 'file-loader', options: { name: '[name].[ext]' } },
			{ test: /\.vue$/, loader: 'vue-loader', options: {
					loaders: {
						js: 'babel-loader',
						scss: 'vue-style-loader!css-loader!sass-loader'
					}
				} }
		]
	},
	plugins: [
		new MiniCssExtractPlugin(),
		new CopyWebpackPlugin([`./static/`]),
	].concat(productionPlugins),
	stats: { colors: true },
	devtool: 'inline-source-map', //inline-
}
