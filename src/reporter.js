/**
 * @fileOverview Render html view from ptest-runner reporter
 * @requires ptest-runner output JSON format file/response
 * @name ptest-resu@lt.js
 * @author Micheal Yang
 * @license MIT
 */

import mj2c from './mithril-j2c.js'
import util from 'util'

var s = mj2c.bindMithril()

const style = mj2c.sheet({
  '.reporter':{
    margin_left: '20px'
  },
  '.item': {
    color: 'grey'
  },
  '.success':{
    color:'green'
  },
  '.fail':{
    color:'red'
  },
  '.footer':{color:'blue'},
  '.abc':{color:'blue'},
})


var footer={
  view : function(ctrl, arg){
    return m('.footerContent', util.format(
      'total:%s, success:%s, fail:%s',
      arg.total.length,
      arg.success.length,
      arg.fail.length
    ))
  }
}


const reporter={
  controller : function(arg){
    this.data=arg.data||data
  },
  view : function(ctrl, arg){
    return m( '.runner-result', {style: {textAlign:'left', padding:'30px'}}, [
      m.style(style),
      s( 'h3', {style:{marginBottom:'10px'}}, 'Result for ptest-runner' ),
      s( '.reporter',
         ctrl.data.map(v=>{
           return s(
             '.item',
             {
               class: style[v.status],
               style:{
                 marginLeft: v.level*20+'px'
               }
             },
             v.test
               ? util.format('%s %s %s', v.msg,v.submsg,v.status)
               :s('strong', v.msg)
           )
         })
        ),
      s('.footer', m(footer, {
        total: ctrl.data.filter(v=>v.test),
        success: ctrl.data.filter(v=>v.status=='success'),
        fail: ctrl.data.filter(v=>v.status=='fail'),
      }))
    ])
  }
}


var data = [{"msg":"ptest for custom test files","submsg":"","level":0},{"msg":"[test1465218312129]","submsg":"(1 / 1)","test":"test1465218312129","level":1,"status":"success"},{"msg":"[test1465218335247]","submsg":"(1 / 1)","test":"test1465218335247","level":1,"status":"fail"}]


module.exports = reporter
