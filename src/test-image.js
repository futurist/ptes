/**
 * @fileOverview Display test images for ptest.
 * @global Mousetrap.js, mithril.js
 * @name test-image.js
 * @author Micheal Yang
 * @license MIT
 */


import mj2c from './mithril-j2c.js'
import mOverlay from './overlay'
import util from 'util'

const mc = mj2c.bindM()

var PTEST_PATH = '/ptestfolder/'

const style = mj2c.sheet({
  '.test-image-con':{
    text_align:'left'
  },
  'menu.top':{
    background:'#ccc'
  },
  '.imageBox':{
    ' .image':{
      position: 'absolute'
    }
  },
  '.hide':{
    display:'none'
  }
})

let current = 0

const gallary={
  controller : function(arg){
    this.data = arg.data || testdata
    this.keys = ['a','b','diff']
    this.cycleVisible = (diff)=>{
      current += diff||1
      if(current<0) current = this.keys.length-1
      current = current % this.keys.length
    }
  },
  view : function(ctrl, arg){
    return mc('.test-image-con', [
      mc.style(style),
      mc('menu.top', [mc('a[href=#]',{onclick:e=>mOverlay.hide(e.target)}, 'close')]),
      mc('.imageBox', {onmousedown:e=>ctrl.cycleVisible(detectRightButton()?-1:1)}, [
        ctrl.keys.map((v,i)=>{
          return mc('.image', {class:current!==i?'  :global(hide)   hide  ':''}, mc('img', {src: PTEST_PATH + ctrl.data.folder+'/'+ctrl.data[v]}))
        })
      ])
    ])
  }
}

module.exports = gallary

var testdata = {"test":"test1465218335247","folder":"ptest_data","a":"test1465218335247/1465218058523.png","b":"test1465218335247/1465218058523.png_test.png","diff":"test1465218335247/1465218058523.png_diff.png"}


//
// helper functions

function detectRightButton (e) {
  var rightclick
  if (!e) var e = window.event
  if (e.which) rightclick = (e.which == 3)
  else if (e.button) rightclick = (e.button == 2)
  return rightclick
}
