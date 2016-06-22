;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory) // define(['jquery'], factory)
  } else if (typeof exports === 'object') {
    module.exports = factory() // factory(require('jquery'))
  } else {
    root.treeHelper = factory() // should return obj in factory
  }
}(this, function () {
/**
 * @fileOverview
 * @name tree-helper.js
 * @author yumji
 * @license MIT
 * @desc Helper for the standard tree format.
 * All the var data is for standard tree json format.
 * All the var d is for the simple tree json format.
 */

// better type check
var type = {}.toString
var OBJECT = '[object Object]'
var ARRAY = '[object Array]'

/**
 * Search standard tree data, with key,val match
 * @param {} data
 * @param {} key
 * @param {} val
 * @returns {}
 */
  function deepFindKV (data, f, howMany, path, found) {
    var i = 0, path = path || [], found=found||[], howMany=howMany|0
    for (; i < data.length; i++) {
      if (f(data[i])) {
        found.push({path: path.concat(i), item: data[i]})
        if(howMany--<1) break
      }
      if (data[i].children) {
        deepFindKV(data[i].children, f, howMany, path.concat(i), found)
      }
    }
    return found
  }


/**
 * getArraypath - get object using path array, from data object
 * @param {object} data - root data object
 *                       if array, get index as target
 *                       if object, get index of object.children as target
 * @param {array} path - path to obtain using index array [0,1,0]
 * @returns {object} target object at path
 */
function getArrayPath (data, path) {
  var obj = data
  var texts = []
  for (var i = 0; i < path.length; i++) {
    obj = type.call(obj) === ARRAY ? obj[path[i]] : obj && obj.children && obj.children[path[i]]
    texts.push(obj.name)
  }
  return {obj, texts}
}



/**
 * convert simple Object into tree data
 *
 format:
 {"a":{"b":{"c":{"":["leaf 1"]}}},"abc":123, e:[2,3,4], f:null}
 *        1. every key is folder node
 *        2. "":[] is leaf node
 *        3. except leaf node, array value will return as is
 *        4. {abc:123} is shortcut for {abc:{"": [123]}}
 *
 * @param {object} d - simple object data
 * @param {function} [prop] - function(key,val){} to return {object} to merge into current
 * @param {array} [path] - array path represent root to parent
 * @returns {object} tree data object
 */
function convertSimpleData (d, prop, path) {
  path = path || []
  if (!d || typeof d !== 'object') {
    // {abc:123} is shortcut for {abc:{"": [123]}}
    return [Object.assign({name: d, _leaf: true}, prop && prop(d, path))]
  }
  if (type.call(d) === ARRAY) {
    return d
    // return d.map(function (v, i) {
    //   return convertSimpleData(v, prop, path.concat(i))
    // })
  }
  if (type.call(d) === OBJECT) {
    var node = []
    for (var k in d) {
      if (k === '' && type.call(d[k]) === ARRAY) {
        node.push.apply(node, d[k].map(function (v, i) {
          return type.call(v) === OBJECT ? v : Object.assign({name: v, _leaf: true}, prop && prop(v, path.concat(['', i])))
        }))
      } else {
        node.push(Object.assign({name: k, children: convertSimpleData(d[k], prop, path.concat('' + k))}, prop && prop(k, path)))
      }
    }
    return node
  }
  return []
}

  // module exports
  return {
    fromSimple: convertSimpleData,
    getArrayPath: getArrayPath,
    deepFindKV: deepFindKV
  }
}))
