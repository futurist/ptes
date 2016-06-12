/**
 * @fileOverview Render html view from ptest-runner reporter
 * @requires ptest-runner output JSON format file/response
 * @name ptest-resu@lt.js
 * @author Micheal Yang
 * @license MIT
 */

import mj2c from './mithril-j2c.js'
import testImage from './test-image'
import mOverlay from './overlay'
import util from 'util'

const mc = mj2c.bindM()

const style = mj2c.sheet({
  '.reporter': {
    margin_left: '2em'
  },
  '.item': {
    line_height: '1.5em',
    color: 'grey'
  },
  '.success': {
    color: 'green'
  },
  '.fail': {
    color: 'red'
  },
  '.footer': {
    color: 'grey',
    margin_top: '1em',
    margin_left: '1.5em',
    ' .finished':{
      color:'blue'
    }
  },
  '.testItem':{
    '&:before':{
      content:"'-'",
      color:'grey'
    },
    ' span, a':{
      margin_left:'10px'
    }
  },
})

const footer = {
  controller: function(arg) {
    this.total = arg.total.length
    this.success = arg.success.length
    this.fail = arg.fail.length
    this.getClass = ()=> {
      return this.total==this.success+this.fail ? 'finished' : 'unfinished'
    }
  },
  view: function (ctrl, arg) {
    return mc('.footerContent',{class:ctrl.getClass()}, util.format(
      'total:%s, success:%s, fail:%s',
      ctrl.total,
      ctrl.success,
      ctrl.fail
    ))
  }
}

const testItem = {
  view: function(ctrl, arg) {
    return mc('.testItem', [
      mc('span', arg.test.msg),
      mc('span', arg.test.submsg||''),
      mc('span', arg.test.status||'running'),
      arg.test.error? mc('a[href=#]', {onclick:function() {
        mOverlay.show('#testimage', {com: m.component(testImage, {data: arg.test.error})})
      }} ,'detail') : []
    ])
  }
}

const reporter = {
  controller: function (arg) {
    this.data = arg.data || testdata
  },
  view: function (ctrl, arg) {
    return mc('.runner-result', {style: {textAlign: 'left', padding: '2em'}}, [
      mc.style(style),
      mc('h3', {style: {marginBottom: '1em'}}, 'Result for ptest-runner'),
      mc('.reporter',
         ctrl.data.map(v => {
           return mc(
             '.item',
             {
               class: style[v.status],
               style: {
                 marginLeft: v.level * 1 + 'em'
               }
             },
             v.test
               ? m(testItem, {test:v})
               : mc('strong', v.msg)
           )
         })
        ),
      mc('.footer', m(footer, {
        total: ctrl.data.filter(v => v.test),
        success: ctrl.data.filter(v => v.status == 'success'),
        fail: ctrl.data.filter(v => v.status == 'fail'),
      }))
    ])
  }
}

var testdata = [{'msg': 'ptest for custom test files','submsg': '','level': 0}, {'msg': '[test1465218312129]','submsg': '(1 / 1)','test': 'test1465218312129','level': 1,'status': 'success'}, {'msg': '[test1465218335247]','submsg': '(1 / 1)','test': 'test1465218335247','level': 1,"error":{"test":"test1465218335247","folder":"ptest_data","a":"test1465218335247/1465218058523.png","b":"test1465218335247/1465218058523.png_test.png","diff":"test1465218335247/1465218058523.png_diff.png"},'status': 'fail'}, {'msg': '[test1465218335247]','submsg': '(1 / 1)','test': 'test1465218335247','level': 1}]

module.exports = reporter
