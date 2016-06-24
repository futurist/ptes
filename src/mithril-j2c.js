;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory) // define(['jquery'], factory)
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory() // factory(require('jquery'))
  } else {
    root.mj2c = factory() // should return obj in factory
  }
}(this, function () {
var self = this
var mj2c = require('j2c')
var hasOwn = {}.hasOwnProperty
var type = {}.toString

function isObject (object) {
  return type.call(object) === '[object Object]'
}

function isString (object) {
  return type.call(object) === '[object String]'
}

function bindM (M) {
  M = M || self.m || m
  if (!M) throw new Error('cannot find mithril, make sure you have `m` available in this scope.')

  var style = {}

  M.c = function (tag, pairs) {
    var args = []

    for (var i = 1, length = arguments.length; i < length; i++) {
      args[i - 1] = arguments[i]
    }

    if (isObject(tag)) {
      var classAttr = 'class' in tag.attrs ? 'class' : 'className'
      var classObj = tag.attrs && tag.attrs[classAttr]
      if (classObj)
        tag.attrs[classAttr] = classObj.split(/ +/).map(function (c) {
          return style[c] || c
        }).join(' ')
      return M.apply(null, tag)
    }

    var hasAttrs = pairs != null && isObject(pairs) &&
          !('tag' in pairs || 'view' in pairs || 'subtree' in pairs)

    var attrs = hasAttrs ? pairs : {}
    var cell = {
      tag: 'div',
      attrs: {},
    }

    assignAttrs(cell.attrs, attrs, parseTagAttrs(cell, tag, style), style)
    // console.log(hasAttrs, cell, args)

    return M.apply(null, [cell.tag, cell.attrs].concat( hasAttrs?args.slice(1):args ))
  }

  M.c.style = function (j2cObject) {
    if(!arguments.length)
      return style
    if (!j2cObject) {
      style = {}
      return []
    }
    if(isString(j2cObject)){
      style = j2cObject
      return M('style', {type: 'text/css'}, style)
    }
  }

  return M.c
}

mj2c.bindM = bindM

// module.exports = mj2c

//
/** helper functions **/

function getStyle(style, cls) {
  var globalRe = /:global\(([^)]+)\)|!([^.#]+)/i
  var classes = cls.split(/\s+/)
  return classes.map(function(v) {
    var match = v.match(globalRe)
    if(match)
      return match.pop()||match.pop()
    else
      return style[v]||v
  }).join(' ')
}

// get from mithril.js, which not exposed

function parseTagAttrs (cell, tag, style) {
  var classes = []
  var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g
  var match

  while ((match = parser.exec(tag))) {
    if (match[1] === '' && match[2]) {
      cell.tag = match[2]
    } else if (match[1] === '#') {
      cell.attrs.id = match[2]
    } else if (match[1] === '.') {
      classes.push(getStyle(style, match[2]))
    } else if (match[3][0] === '[') {
      var pair = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/.exec(match[3])
      cell.attrs[pair[1]] = pair[3] || ''
    }
  }

  return classes
}


function assignAttrs(target, attrs, classes, style) {
  var classAttr = "class" in attrs ? "class" : "className"

  for (var attrName in attrs) {
    if (hasOwn.call(attrs, attrName)) {
      if (attrName === classAttr &&
          attrs[attrName] != null &&
          attrs[attrName] !== "") {
        classes.push( getStyle(style, attrs[attrName]))
        // create key in correct iteration order
        target[attrName] = ""
      } else {
        target[attrName] = attrs[attrName]
      }
    }
  }

  if (classes.length) target[classAttr] = classes.join(" ")
}

  // module exports
  return mj2c
}))
