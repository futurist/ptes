/**
 * @fileOverview Display test images for ptest.
 * @global Mousetrap.js, mithril.js
 * @name test-image.js
 * @author Micheal Yang
 * @license MIT
 */

import cssobj from 'cssobj-mithril'
import cssobjHead from 'cssobj-plugin-post-stylize'
import util from 'util'

var PTEST_PATH = '/ptestfolder/'

const style = {
  '.test-image-con': {
    text_align: 'left'
  },
  'menu.top': {
    background: '#ccc',
    'a, span': {
      margin_left: '10px'
    },
    'span.current': {
      color: 'red'
    }
  },
  '.imageBox': {
    position: 'relative',
    '.info': {
      position: 'absolute',
      right: '10px',
      top: '10px',
      z_index: 999
    },
    '.image': {
      position: 'absolute'
    }
  },
  '.hide': {
    display: 'none'
  }
}
const mc = cssobj(m, style, {post:[cssobjHead()]})

const gallary = {
  controller: function (arg) {
    var ctrl = this
    var group = 0
    var index = 0

    var data = arg.data || testdata
    var folder = data.folder
    var test = data.test
    var a = data.a
    var images = m.request({method: 'GET', url: [PTEST_PATH, 'testimage'].join(''), data: {folder, test} })
        .then(f => {
          const found = f.findIndex(v => v.a == a)
          if (found > -1) group = found
          return f
        })

    ctrl.cycleVisible = (diff) => {
      var obj = images()[group]
      var keys = Object.keys(obj)
      index += diff || 1
      index = (index + keys.length) % keys.length
      m.redraw(true)
    }

    ctrl.getImageList = () => {
      return images().map((v, i) => mc('span', {class: group == i ? 'current' : '',onclick: e => group = i}, v.a))
    }

    ctrl.getInfoTag = (keys, index) => {
      if (keys[index] == 'last')
        return m('a[href=javascript:;]', {onmousedown:e=>{
          e.preventDefault()
          e.stopPropagation()
          alert('Apply this test image?\nWARNING: original test image will be lost!!!')
        }}, 'last')
      else
        return keys[index]
    }

    ctrl.getImageTag = () => {
      var obj = images()[group]
      var keys = Object.keys(obj)
      return [
        mc('.info', ctrl.getInfoTag(keys, index)),
        keys.map((v, i) => {
          return mc('.image', {class: index !== i ? '  :global(hide)   hide  ' : ''}, mc('img', {src: PTEST_PATH + folder + '/' + obj[v]}))
        })
      ]
    }

    ctrl.onunload = (e) => {
      /** tested bug below: preventdefault will trigger 2 unloaded??? */
      // e.preventDefault()
      console.log('unloaded', e)
      Mousetrap.unbind(keyNumber)
    }

    var keyNumber = ['1', '2', '3', '4']
    /** Bind to short cut to switch images */
    Mousetrap.unbind(keyNumber)
    Mousetrap.bind(keyNumber, function (e, key) {
      e.preventDefault()
      index = parseInt(key) - 1
      m.redraw(true)
    })
  },
  view: function (ctrl, arg) {
    return mc('.test-image-con', [
      mc('menu.top', [
        mc('a[href=#]', {onclick: e => arg.onclose && arg.onclose()}, 'close'),
        ctrl.getImageList()
      ]),
      mc('.imageBox', {onmousedown: e => ctrl.cycleVisible(detectRightButton() ? -1 : 1)}, ctrl.getImageTag())
    ])
  }
}

module.exports = gallary

var testdata = {'test': 'test1465218335247','folder': 'ptest_data','a': 'test1465218335247/1465218058523.png','b': 'test1465218335247/1465218058523.png_test.png','diff': 'test1465218335247/1465218058523.png_diff.png'}

//
// helper functions

function detectRightButton (e) {
  var rightclick
  if (!e) var e = window.event
  if (e.which) rightclick = (e.which == 3)
  else if (e.button) rightclick = (e.button == 2)
  return rightclick
}
