/**
 * @fileOverview Render html view from ptest-runner reporter
 * @requires ptest-runner output JSON format file/response
 * @name ptest-resu@lt.js
 * @author Micheal Yang
 * @license MIT
 */

import cssobj from 'cssobj'
import cssobj_mithril from 'cssobj-mithril'
import util from 'util'

const style = {
  '.runner-result':{
    text_align:'left'
  },
  'menu.top':{
    background:'#ccc'
  },
  '.reporter': {
    margin_left: '2em',
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
    margin_bottom: '3em',
    margin_left: '1.5em',
    '.finished':{
      color:'blue'
    }
  },
  '.button':{
    margin_left: '1em'
  },
  '.testItem':{
    '&:before':{
      content:"'-'",
      color:'grey'
    },
    'span, a':{
      margin_left:'10px'
    }
  }
}

const result = cssobj(style, {local:true})

const m = cssobj_mithril(result)

const footer = {
  controller: function(arg) {
    this.total = arg.total.length
    this.success = arg.success.length
    this.fail = arg.fail.length
    this.getClass = ()=> {
      return arg.result
    }
  },
  view: function (ctrl, arg) {
    return m('.footerContent',{class:ctrl.getClass()},
              [util.format(
                'total:%s, success:%s, fail:%s',
                ctrl.total,
                ctrl.success,
                ctrl.fail,
              ),
               arg.result ? m('a.button[href=#]',{onclick:e=>arg.onclose&&arg.onclose()}, 'close')  : [],
              ])
  }
}

const testItem = {
  view: function(ctrl, arg) {
    return m('.testItem', [
      m('span', arg.test.msg),
      m('span', arg.test.submsg||''),
      m('span', arg.test.status||'?'),
      arg.test.error? m('a[href=#]', {onclick:function() {
        arg.onmsg && arg.onmsg(arg.test)
      }} ,'detail') : []
    ])
  }
}

const reporter = {
  controller: function (arg) {
    this.data = arg.data || testdata
    this.result = this.data.length && this.data[0].result
  },
  view: function (ctrl, arg) {
    return m('.runner-result', [
      ctrl.result ? m('menu.top', [ m('a[href=#]',{onclick:e=>arg.onclose&&arg.onclose()}, 'close') ]) : [],
      m('h3', {style: {margin: '1em 0 0 1em'}}, 'Result for ptest-runner'),
      m('.reporter',
         ctrl.data.map( (v,i) => {
           return m(
             '.item',
             {
               class: result.mapClass(v.status),
               style: {
                 marginLeft: v.level * 1 + 'em'
               }
             },
             v.test
               ? m(testItem, Object.assign({},arg, {test:v}))
             : m('strong', v.msg + (v.result? ' '+v.result:''))
           )
         })
        ),
      m('.footer', m(footer, Object.assign({},arg,{
        result: ctrl.data[0].result,
        total: ctrl.data.filter(v => v.test),
        success: ctrl.data.filter(v => v.status == 'success'),
        fail: ctrl.data.filter(v => v.status == 'fail'),
      })))
    ])
  }
}

var testdata = [{'msg': 'ptest for custom test files','submsg': '','level': 0}, {'msg': '[test1465218312129]','submsg': '(1 / 1)','test': 'test1465218312129','level': 1,'status': 'success'}, {'msg': '[test1465218335247]','submsg': '(1 / 1)','test': 'test1465218335247','level': 1,"error":{"test":"test1465218335247","folder":"ptest_data","a":"test1465218335247/1465218058523.png","b":"test1465218335247/1465218058523.png_test.png","diff":"test1465218335247/1465218058523.png_diff.png"},'status': 'fail'}, {'msg': '[test1465218335247]','submsg': '(1 / 1)','test': 'test1465218335247','level': 1}]

module.exports = reporter


//
// helper functions
