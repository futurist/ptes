var webpack = require('webpack')

var loaders = [
  {test:/\.js$/, loader:'babel', exclude:'node_modules', query:{
    presets:['es2015'],
    plugins:['syntax-trailing-function-commas']
  }}
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
