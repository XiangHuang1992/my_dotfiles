'use strict';
var path = require('path');
var webpack = require('webpack');

var babelOptions = {
  "presets": [
    'react',
    ['env', {
      targets: {
        electron: '1.17',
        uglify: true
      },
    }],
  ]
};

module.exports = {
  cache: true,
  entry: {
    jobListView: ['babel-polyfill', 'joblistView.tsx'],
    jobDetailView: ['babel-polyfill', 'jobDetailView.tsx'],
    galleryView: ['babel-polyfill', 'galleryView.tsx'],
    galleryDetailView: ['babel-polyfill', 'galleryDetailView.tsx']
  },
  output: {
    path: path.resolve(__dirname, './out/scripts'),
    filename: '[name].js'
  },
  module: {
    rules: [{
      test: /\.ts(x?)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'babel-loader',
          options: babelOptions
        },
        {
          loader: 'ts-loader'
        }
      ]
    }, {
      test: /\.js$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'babel-loader',
          options: babelOptions
        }
      ]
    }]
  },
  resolve: {
    modules: [path.resolve(__dirname, "src", "scripts"), "node_modules"],
    extensions: ['.ts', '.tsx', '.js']
  },
};