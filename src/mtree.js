/**
 * DATA format:
 * node -> {
 text             {string}  displayed text for html
 name             {string}  name for node, if no text, used as text
 class            {string}  className for node
 // font          {string}  the font color
 _static          {boolean} whether folder expand on mousemove
 _close           {boolean} true : folder close, false : folder open
 _edit            {boolean} true  : node text edit status, false : node text display status
 _leaf [auto]     {boolean} true  : Leaf node, false : Trunk node
 _path [readOnly] {string}  object path from root
 _idx  [readOnly] {number}  index in parent node
 children         {array}   node type of children; null denotes _leaf node
 }
 */
// var data = require('./data.js')
// window.data = data

// using webpack inline style, but not for lib
// var css = require('../css/mtree.stylus')

let css = {}

import UndoManager from './undo-manager'

const INVALID_NAME = '<>:"\\|?*\/' // '<>:"/\\|?*'
const INVALID_NAME_REGEXP = new RegExp('[' + INVALID_NAME.replace('\\', '\\\\') + ']', 'g')
const isValidName = function isValidName (name, v) {
  return name !== '' && !INVALID_NAME_REGEXP.test(name)
}
const showInvalidMsg = function showInvalidMsg (v) {
  v._invalid = true
  alert('invalid text, cannot contain: ' + INVALID_NAME)
}

//
// ========================================
// Helper Function
// ========================================

// better type check
var type = {}.toString
var OBJECT = '[object Object]'
var ARRAY = '[object Array]'

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

// disable right click
window.oncontextmenu = function () {
  return false
}

/**
 * Array get last element
 */
if (!Array.prototype.last) {
  Array.prototype.last = function () {
    return this[this.length - 1]
  }
}

/**
 * getArraypath - get object using path array, from data object
 * @param {object} arr - root data object
 *									     if array, get index as target
 *                       if object, get index of object.children as target
 * @param {array} path - path to obtain using index array [0,1,0]
 * @returns {object} target object at path
 */
function getArrayPath (arr, path) {
  var obj = arr
  var texts = []
  for (var i = 0; i < path.length; i++) {
    obj = type.call(obj) === ARRAY ? obj[path[i]] : obj && obj.children && obj.children[path[i]]
    texts.push(obj.name)
  }
  return {obj, texts}
}

/**
 * Search standard tree data, with key,val match
 * @param {} data
 * @param {} key
 * @param {} val
 * @returns {}
 */
function deepFindKV (data, key, val, path) {
  var i = 0, found, path = path || []
  for (; i < data.length; i++) {
    if ((new RegExp(val)).test(data[i][key])) {
      return {path: path, item: data[i]}
    } else if (data[i].children) {
      found = deepFindKV(data[i].children, key, val, path.concat(i))
      if (found) {
        return found
      }
    }
  }
}

function cleanData (data, store) {
  store = store || []
  data.forEach((v, i) => {
    if (v && typeof v == 'object') {
      const d = {}
      store.push(d)
      Object.keys(v).forEach(k => {
        if (['_leaf'].indexOf(k) > -1 || k[0] !== '_' && k !== 'children') d[k] = v[k]
      })
      if (v.children && Array.isArray(v.children)) {
        d.children = []
        cleanData(v.children, d.children)
      }
    }
  })
  return store
}

/**
 * isInputactive - check whether user is editing
 * @returns {boolean}
 */
function isInputActive (el) {
  return /input|textarea/i.test((el || document.activeElement).tagName)
}

/**
 * detectleftbutton - detect if the left and only the left mouse button is pressed
 * @param {} evt - event object to check, e.g. onmousemove
 * @returns {boolean}
 */
function detectLeftButton (evt) {
  evt = evt || window.event
  if ('buttons' in evt) {
    return evt.buttons == 1
  }
  var button = evt.which || evt.button
  return button == 1
}

function detectRightButton (e) {
  var rightclick
  if (!e) var e = window.event
  if (e.which) rightclick = (e.which == 3)
  else if (e.button) rightclick = (e.button == 2)
  return rightclick
}

function _clone (dest) {
  return JSON.parse(JSON.stringify(dest))
}

var com = {
  //
  // controller
  controller: function (args) {
    var ctrl = this
    var data = args.data || []
    var result = {}
    if (args.url) {
      m.request({method: 'GET', url: args.url})
        .then(function (ret) {
          result = ret

          // data = result.map(v => {
          //   v.children = convertSimpleData(v.ptest_data, (k, path)=>({desc:''}))
          //   delete v.ptest_data
          //   return v
          // })

          data = result
          console.log(data)
          m.redraw()
        })
    }

    var getRootVar = function (path, key) {
      return result[path[0]][key]
    }

    /**
     * selected =>{
     node {object} selected node object
     idx {number} index at parent node
     parent {object} parent object, or null if it's root
     }
     */
    var selected = data.length ? {node: data[0], idx: 0, parent: null} : null
    // move or copy target node
    var target = null
    // undoList array for manage undo
    var undoList = []
    var addToUndo = function(f) {
      undoList.push(f)
      return f
    }
    var undoManager = new UndoManager()
    undoManager.setCallback(function() {
      console.log(undoManager.getCommands())
    })
    var undoRedo = function(redo, undo) {
      undoManager.add({redo, undo})
      return redo
    }
    var redoList = []
    var addToRedo = function(f) {
      redoList.push(f)
      return f
    }
    // Mouse guesture store array
    var mouseGuesture = []

    /**
     * Extend tree object, ignore _, text, children attr
     * If there's already has className in src, merge className by SPC
     * @param {} dest - new node to merged to, from src
     * @param {} src - tree object
     * @returns {} dest
     */
    function _extend (dest, src) {
      Object.keys(src)
        .filter(k => k[0] !== '_' && ['text', 'children'].indexOf(k) < 0)
        .forEach(k => {
            /class|className/.test(k) ? (dest[k] = dest[k] || '', dest[k] += ' ' + src[k]) : dest[k] = src[k]})
      return dest
    }

    function oneAction (obj) {
      return m('a[href=#]', {class: 'action', onmousedown: e => {
        e.stopPropagation()
        e.preventDefault()
        args.onclose(obj)
      }}, obj.text || obj.action)
    }

    function getAction (v) {
      if (!args.onclose) return
      const node = []
      const emptyNode = !v.children || v.children.length == 0
      const leafNode = (!emptyNode) && v.children && v.children[0]._leaf
      // if (!leafNode && !emptyNode) return node
      let path = getArrayPath(data, v._path).texts
      let folder = getRootVar(v._path, 'folder')
      let url = getRootVar(v._path, 'url')
      if (!v._leaf) {
        node.push({action: 'add', text: 'Add', path: path, folder: folder})
      } else {
        node.push({action: 'play', text: 'Play', path: path, file: v.name, folder: folder, url: url})
      }
      return node.map(oneAction)
    }

    function getText (v) {
      let text = (v.desc || '')
      let node = v.name
            ? [m('span.name', '[' + v.name + ']'), getAction(v), m('br'), text]
            : [text, getAction(v)]
      return node
    }

    /**
     * Generate right class name from node attr
     * e.g. selected if it's selected node

     * @param {} tree node
     * @returns {string} generated class name
     */
    function getClass (node) {
      var c = ' '
      c += selected && selected.node === node ? (css.selected || 'selected') + ' ' : ''
      c += ' '
      c += target && target.node === node ? (css[target.type] || target.type) : ''
      return c
    }

    /**
     * get common path from 2 nodes
     * @param {} tree node1
     * @param {} tree node2
     * @returns {string} path of the common part
     */
    function getCommonPath (node1, node2) {
      var path1 = node1._path, path2 = node2._path, r = []
      for (var i = 0, n = path1.length; i < n; i++) {
        if (path1[i] === path2[i]) r.push(path1[i])
      }
      return r
    }

    /**
     * delete node of parent in idx
     * @param {} parent node
     * @param {} idx
     */
    function deleteNode (parent, idx) {
      if (!parent) {
        var oldData = data[idx]
        undoRedo(
          function() {
            data.splice(idx, 1)
          },
          function() {
            data.splice(idx, 0, oldData)
          }
        )()
        return
      }

      var arr = parent.children = parent.children || []
      var oldStack=[]
      undoRedo(
        function() {
          oldStack.push(arr[idx], arr, parent._close)
          arr.splice(idx, 1)
          // if it's no child, remove +/- symbol in parent
          if (parent && !arr.length) delete parent.children, delete parent._close
        },
        function () {
          parent._close = oldStack.pop()
          parent.children = oldStack.pop()
          parent.children.splice(idx, 0, oldStack.pop())
        }
      )()
    }
    function insertNode (node, parent, _idx, isAfter) {
      return addNode(parent, _idx, isAfter, node)
    }
    function insertChildNode (node, v, isLast) {
      return addChildNode(v, isLast, v._leaf, node)
    }
    function addNode (parent, _idx, isAfter, existsNode) {
      var idx = isAfter ? _idx + 1 : _idx
      if (!parent) {
        var newNode = {name: '', url: '', folder: 'ptest_data', _edit: true}
        undoRedo(
          function() {
            data.splice(idx, 0, newNode)
          },
          function () {
            data.splice(idx, 1)
          }
        )()
        return
      }
      var arr = parent.children = parent.children || []
      var insert = existsNode || {name: '', desc: '', _edit: true}
      undoRedo(
        function() {
        arr.splice(idx, 0, insert)
        selected = { node: arr[idx], idx: idx, parent: parent }
        },
        function () {
        // cannot rely on stored index, coze it maybe changed, recalc again
        var idx = parent.children.indexOf(insert)
        parent.children.splice(idx, 1)
        }
      )()
      return selected
    }
    function addChildNode (v, isLast, isLeaf, existsNode) {
      if (v._leaf) return
      v.children = v.children || []
      var arr = v.children
      var idx = isLast ? v.children.length : 0
      var insert = existsNode || {name: '', desc: '', _edit: true}
      v._close = false
      if (isLeaf) insert._leaf = true
      var selected = {}
      undoRedo(
        function() {
          v.children = arr
        v.children.splice(idx, 0, insert)
        selected.node = v.children[idx]
        selected.idx = idx
        selected.parent = v
        },
        function () {
        // cannot rely on stored index, coze it maybe changed, recalc again
        var idx = arr.indexOf(insert)
        arr.splice(idx, 1)
        if (!v.children.length) delete v.children, delete v._close
        }
      )()
      return selected
    }

    function invalidInput (v) {
      if (!v.name) return v._invalid = 'name'
      if ('folder' in v && !v.folder) return v._invalid = 'folder'
      if ('url' in v && !v.url) return v._invalid = 'url'
      delete v._invalid
      return ''
    }
    function getInput (v) {
      if (v._leaf) {
        return [
          v.name ? m('div', v.name) : [],
          m('textarea', {
            config: el => el.focus(),
            oninput: function (e) {
              v.desc = this.value
              // if (isValidName(this.value)) v.desc = this.value
              // else showInvalidMsg(v)
            },
            onkeydown: e => {
              if (e.keyCode == 13 && e.ctrlKey) {
                if (invalidInput(v)) return alert(v._invalid + ' cannot be empty')
                return v._edit = false
              }
              if (e.keyCode == 27) {
                undoManager.undo()
                v._edit = false
                m.redraw()
              }
            }
          }, v.desc || '')
        ]
      } else {
        return Object.keys(v)
          .filter(k => k[0] !== '_' && k !== 'children')
          .map(k => m('.editline', [
            m('span', k),
            m('input', {
              // config: el => { el.focus() },
              value: v[k] || '',
              oninput: function (e) { v[k] = this.value; },
              onkeydown: e => {
                if (e.keyCode == 13) {
                  if (invalidInput(v)) return alert(v._invalid + ' cannot be empty')
                  return v._edit = false
                }
                if (e.keyCode == 27) {
                  undoManager.undo()
                  v._edit = false
                  m.redraw()
                }
              },
            })
          ]))
      }
    }
    /**
     * interTree interate tree node for children
     * @param {array} arr - children node array, usually from data.children
     * @param {object} parent - parent node
     * @param {array} path - object path array
     * @returns {object} mithril dom object, it's ul tag object
     */
    function interTree (arr, parent, path) {
      path = path || []
      return !arr ? [] : {
        tag: 'ul', attrs: {}, children: arr.map((v, idx) => {
          v._path = path.concat(idx)
          v = typeof v == 'string' ? {name: v, desc: ''} : v
          if ({}.toString.call(v) != '[object Object]') return v
          return {
            tag: 'li',
            attrs: _extend({
              'class': getClass(v),
              config: (el, old, context) => {
              },
              onmouseup: function (e) {},
              onmousedown: function (e) {
                if (!e) e = window.event
                e.stopPropagation()
                selected = {node: v, idx: idx, parent: parent}

                // save parent _pos when select node
                if (parent) parent._pos = idx

                if (isInputActive(e.target)) return
                else if (v._edit && !v._invalid) {
                  // v._edit = false
                  // return
                }

                // Right then Right, do move/copy action
                if (detectRightButton(e)) addGuesture('right')
                if (mouseGuesture.join(',') === 'right,right') {
                  clearGuesture(e)
                  doMoveCopy(e)
                }

                // buttons=Left+Right, button=Right, Left and Right
                if (e.buttons == 3 && e.button == 2) {
                  clearGuesture(e)
                  doCopy(e)
                }

                // buttons=Left+Right, button=Left, Right and Left
                if (e.buttons == 3 && e.button == 0) {
                  clearGuesture(e)
                  doMove(e)
                }

                e.preventDefault()
                var isDown = e.type == 'mousedown'
                // add node
                if (isDown && e.ctrlKey) {
                  // add node before selected
                  if (e.altKey) addChildNode(v)
                  // add child node as first child
                  else addNode(parent, idx)
                  return
                }
                // remove node
                if (isDown && e.altKey) {
                  deleteNode(parent, idx)
                  return
                }
                // else if(v._edit) return v._edit = false
                // close / open node
                if (!v._static && v.children) v._close = e.type == 'mousemove' ? false : !v._close
              },
              onmousemove: function (e) {
                if (!detectLeftButton(e))return
                this.onmousedown(e)
              },
              // dbl click to edit
              ondblclick: function (e) {
                e.stopPropagation()
                v._edit = true
                var oldVal = {}
                Object.keys(v)
                  .filter(k => k[0] !== '_' && k !== 'children')
                  .forEach(k => oldVal[k] = v[k])
                undoRedo(
                  function() {
                  },
                  function () {
                  setTimeout(_ => {
                    Object.assign(v, oldVal)
                    v._edit = false
                    m.redraw()
                  })
                  }
                )()
              },
            }, v),
            children: [
              v.children ? m('a.switch', v._close ? '+ ' : '- ') : [],
              v._edit
                ? getInput(v, path)
                : m(v._leaf ? 'pre.leaf' : 'span.node', [getText(v, path)])
            ].concat(v._close ? [] : interTree(v.children, v, path.concat(idx)))
          }
        })
      }
    }

    function saveConfig () {
      var d = cleanData(data)
      m.request({method: 'POST', url: '/config', data: d})
        .then(function (ret) {
          if (!ret.error) alert('Save success.')
        },
              function (e) {
                alert('save failed!!!!' + e.message)
              }
             )
    }

    function getMenu () {
      return m('a.button[href=#]',
               {
                 onclick: e => {
                   e.preventDefault()
                   saveConfig()
                 }
               },
               'Save'
              )
    }
    ctrl.getDom = _ => {
      return [
        m('.menu', getMenu()),
        interTree(data)
      ]
    }
    ctrl.onunload = e => {
      for (var k in keyMap) {
        Mousetrap.unbind(k)
      }
    }

    //
    // Mousetrap definition
    function toggleNodeOpen (e, key) {
      var sel = selected
      e.preventDefault()
      if (sel && sel.node.children) {
        sel.node._close = !sel.node._close
        m.redraw()
      }
    }
    function keyMoveLevel (e, key) {
      var child, sel = selected, newIdx, newParent, oldNode
      if (sel) {
        e.preventDefault()
        newParent = sel.parent
        child = sel.node.children
        if (/left/.test(key) && newParent) {
          newParent._pos = sel.idx
          sel.node = newParent
          sel.idx = newParent._path.last()
          // _path is data[0][2]... if there's only data[0], then it's first root, parent is null
          sel.parent = newParent._path.length > 1 ? getArrayPath(data, newParent._path.slice(0, -1)).obj : null
          m.redraw()
        }
        if (/right/.test(key) && child && child.length) {
          // save sel.node ref first to as parent
          const oldNode = sel.node
          const pos = oldNode._pos || 0
          sel.node = child[pos]
          sel.node._path = oldNode._path.concat(pos)
          sel.idx = pos
          sel.parent = oldNode
          if (oldNode._close) oldNode._close = false
          m.redraw()
        }
      }
    }
    function keyMoveSibling (e, key) {
      var child, sel = selected, newIdx

      var moveSibling = function (isMove) {
        if (isMove) [child[newIdx], child[sel.idx]] = [child[sel.idx], child[newIdx]]
        sel.node = child[newIdx]
        sel.idx = newIdx
        m.redraw()
      }

      if (sel) {
        e.preventDefault()
        if (!sel.parent) child = data
        else child = sel.parent.children
        if (child.length) {
          if (/down$/.test(key)) {
            if (sel.idx + 1 < child.length) {
              newIdx = sel.idx + 1
            } else {
              newIdx = 0
            }
            moveSibling(/ctrl/.test(key))
          }
          if (/up$/.test(key)) {
            if (sel.idx - 1 >= 0) {
              newIdx = sel.idx - 1
            } else {
              newIdx = child.length - 1
            }
            moveSibling(/ctrl/.test(key))
          }
        }
      }
    }
    function doDelete (e) {
      deleteNode(selected.parent, selected.idx)
      m.redraw()
    }
    function doAddChildLeaf (e) {
      addChildNode(selected.node, true, true)
      m.redraw()
    }
    function doAddChildTrunk (e) {
      addChildNode(selected.node, true)
      m.redraw()
    }
    function doAddNode (e) {
      addNode(selected.parent, selected.idx, true)
      m.redraw()
    }
    function doRedo (e) {
      if (isInputActive()) return
      undoManager.redo()
      // var redo = redoList.pop()
      // if(redo) redo()
      m.redraw(true)
    }
    function doUndo (e) {
      if (isInputActive()) return
      undoManager.undo()
      // var undo = undoList.pop()
      // if (undo) undo()
      m.redraw(true)
    }
    function doMove (e) {
      if (!selected || !selected.parent) return
      target = Object.assign({type: 'moving'}, selected)
      m.redraw()
    }

    function doCopy (e) {
      if (!selected.parent) return
      target = Object.assign({type: 'copying'}, selected)
      m.redraw()
    }
    function doMoveCopy (e) {
      var isChild = !e.shiftKey
      if (!target || !selected || !target.parent || !selected.parent) return
      if (selected.node === target.node) return
      if (selected.node._leaf) return
      if (selected.node._path.length && selected.node._path[0] != target.node._path[0]) {
        return alert('Cannot move test between pages!')
      }
      if (target.type) {
        var insert = _clone(target.node)
        if (isChild) {
          selected = insertChildNode(insert, selected.node) // insert as first child
        } else {
          selected = insertNode(insert, selected.parent, selected.idx)
        }
        var sameLevel = selected.parent == target.parent
        // fix index if target is same level
        if (sameLevel && selected.idx < target.idx) target.idx++

        if (target.type == 'moving') {
          deleteNode(target.parent, target.idx)
          target = null
        }
        undoManager.group(2)
      }
      m.redraw()
    }

    function addGuesture (action) {
      mouseGuesture.push(action)
      setTimeout(function () {
        clearGuesture()
      }, 800)
    }

    function clearGuesture (e) {
      mouseGuesture = []
    }

    var keyMap = {
      'space': toggleNodeOpen,
      'left': keyMoveLevel,
      'right': keyMoveLevel,
      'up': keyMoveSibling,
      'down': keyMoveSibling,
      'ctrl+up': keyMoveSibling,
      'ctrl+down': keyMoveSibling,
      'esc': clearGuesture,
      'del': doDelete,
      'ctrl+enter': doAddChildLeaf,
      'shift+enter': doAddChildTrunk,
      'enter': doAddNode,
      'ctrl+y': doRedo,
      'ctrl+z': doUndo,
      'ctrl+c': doCopy,
      'ctrl+x': doMove,
      'ctrl+shift+v': doMoveCopy,
      'ctrl+v': doMoveCopy,
    }

    for (var k in keyMap) {
      Mousetrap.bind(k, keyMap[k])
    }
  },

  //
  // view
  view: function (ctrl) {
    return m('.' + (css.mtree || 'mtree'), ctrl.getDom())
  }
}

export default com

const testRoot = document.querySelector('#mtree')
if (testRoot) m.mount(testRoot, m.component(com, {data: data}))

// below line will remove -webkit-user-select:none
// which cause phantomjs input cannot be selected!!!!!
if (window._phantom) document.body.className = 'phantom'
