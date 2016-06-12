/**
 * @fileOverview Display test images for ptest.
 * @global Mousetrap.js, mithril.js
 * @name test-image.js
 * @author Micheal Yang
 * @license MIT
 */


import mj2c from './mithril-j2c.js'
import util from 'util'

const mc = mj2c.bindM()

var PTEST_PATH = '/ptestfolder/'

const style = mj2c.sheet({
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
    this.cycleVisible = ()=>{
      current++
      current = current % this.keys.length
    }
  },
  view : function(ctrl, arg){
    return mc('.imageBox', {onclick:e=>ctrl.cycleVisible()}, [
      mc.style(style),
      ctrl.keys.map((v,i)=>{
        return mc('.image', {class:current!==i?'  :global(hide)   hide  ':''}, mc('img', {src: PTEST_PATH + ctrl.data.folder+'/'+ctrl.data[v]}))
      })
    ])
  }
}

module.exports = gallary

var testdata = {"test":"test1465218335247","folder":"ptest_data","a":"test1465218335247/1465218058523.png","b":"test1465218335247/1465218058523.png_test.png","diff":"test1465218335247/1465218058523.png_diff.png"}
