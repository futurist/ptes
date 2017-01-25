var webpack = require('webpack')
var path = require('path')

var loaders = [
  {
    test: path.join(__dirname, 'src'),
    loader:'babel',
    exclude: /(node_modules|bower_components)/,
    query:{
      cacheDirectory: true,
      presets:['es2015'],
      plugins:['syntax-trailing-function-commas']
    }
  }
]

var config={
  entry:'./src/client.js',
  output:{
    path:'./js',
    filename:'client.js'
  },
  module:{
    loaders:loaders
  }
}

module.exports = config
