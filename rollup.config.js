
import buble from 'rollup-plugin-buble'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
  entry: './src/client.js',
  moduleName: 'client',
  plugins: [
    resolve(),
    commonjs(),
    buble()
  ],
  targets: [
    {format: 'iife', dest: './js/client.js'}
  ]
}
