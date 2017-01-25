/*
 Copyright @ Michael Yang
 License MIT
 */

import mTree from './mtree'
import reporter from './reporter'
import testImage from './test-image'
import testAssert from './test-assert.js'
import mOverlay from './overlay.js'
import objutil from 'objutil'

import pointer from 'json-pointer'
window.pointer = pointer

const RECORDING = 'STAGE_RECORDING', PLAYING = 'STAGE_PLAYING', CLIPPING = 'STAGE_CLIPPING',
      SETUP = 128, REPORTER = 256, IMAGEVIEW = 512
const INVALID_NAME = '<>:"\\|?*' // '<>:"/\\|?*'
const INVALID_NAME_REGEXP = new RegExp('[' + INVALID_NAME.replace('\\', '\\\\') + ']', 'g')
const MODIFIER = {
  shift: 0x02000000,
  ctrl: 0x04000000,
  alt: 0x08000000,
  meta: 0x10000000,
  keypad: 0x20000000
}

const STOPPED = 0, STOPPING = 1, PAUSING = 2, PAUSED = 4, RUNNING = 8

let currentName = ''
let currentPath = ''
let keyframeCount = 0
let intervalTitle = 0
let PageClip = {}
let clipDrag = m_drag({})
let stage = null
let playbackStatus = STOPPED
window.stage = ()=>stage

let startClip = clipDrag('clip', function (e, data, root) {
  if (stage != CLIPPING) return
  PageClip.top = data.oy
  PageClip.left = data.ox
  PageClip.width = -data.dx
  PageClip.height = -data.dy
  applyPageClip()
}, function (e, data) {
  if (stage != CLIPPING) return
  console.log(PageClip)
  ws._send({ type: 'page_clip', data: PageClip })
  stage = null
})

function applyPageClip () {
  $('#clipArea').show().css({ top: PageClip.top + 'px', left: PageClip.left + 'px', width: PageClip.width + 'px', height: PageClip.height + 'px' })
}

$('#phantom').on('mousedown', startClip)

const ws = new WebSocket('ws://' + window.location.hostname + ':1280')
ws.onopen = function (e) {
  ws.onmessage = function (message) {
    let msg
    try {
      msg = JSON.parse(message.data)
    } catch(e) {
      msg = message.data
    }
    if (typeof msg != 'object' || !msg) return

    switch (msg.type) {
    case 'broadcast':

      break
    case 'playback':
      playbackStatus = msg.data
      console.log('playbackStatus', msg.data)
      stage = !msg.data || msg.data === STOPPED ? null : PLAYING
      if (stage) {
        flashTitle(msg.data === RUNNING ? 'PLAYING' : 'PAUSED', true)
      } else {
        clearTitle()
        alert('Play back complete')
      }

      break
    case 'page_clip':
      PageClip = msg.data
      applyPageClip()

      break
    case 'command':
      try {
        msg.result = eval(msg.data)
      } catch(e) {
        msg.result = e.stack
      }
      delete msg.data
      msg.type = 'command_result'
      ws._send(msg)

      break
    case 'client_error':
      console.error(msg.data.msg, JSON.stringify(msg.data.stack))

      break
    case 'client_console':
      console.log(msg.data)

      break
    case 'test_output':
      // case 'test_error':
      console.log(msg.data)
      stage = REPORTER
      mOverlay.show('#reporter', {com: m.component(reporter, {
        data:msg.data,
        onmsg:function(msg) {
          stage = IMAGEVIEW
          mOverlay.show('#testimage', {com: m.component(msg.type=='assert' ? testAssert : testImage, {data: msg.error, onclose:function() {
            stage = REPORTER
            mOverlay.hide('#testimage')
          }})})
        },
        onclose:function() {
          stage = SETUP
          mOverlay.hide('#reporter')
        }
      })})

      break
    case 'command_result':
      if (msg.__id) {
        const cb = WS_CALLBACK[msg.__id]
        delete WS_CALLBACK[msg.__id]
        cb && cb(msg)
      }

      break
    case 'window_resize':
    case 'window_scroll':
      $(window).scrollLeft(msg.data.scrollX)
      $(window).scrollTop(msg.data.scrollY)
      $(window).width(msg.data.width)
      $(window).height(msg.data.height)

      break
    case 'render':
      $('.imgCon').width(msg.meta.size.width).height(msg.meta.size.height)
      $('.screenshot').attr('src', 'data:image/png;base64,' + msg.data)
      // FIXME: phantom don't have scrollbar but browser's scrollbar will reduce window size
      // if( msg.meta.count==0 ) $(window).trigger('resize')
      break

    default:

      break
    }
  }
  ws.onclose = function (code, reason, bClean) {
    console.log('ws error: ', code, reason)
  }

  var heartbeat = setInterval(function () { ws._send({type:'ping'}) }, 10000)
  ws._send({type: 'connection', meta: 'server', name: 'client'})

}

const WS_CALLBACK = {}
ws._send = function (msg, cb) {
  if (ws.readyState != 1) return
  if (typeof cb == 'function') {
    msg.__id = '_' + Date.now() + Math.random()
    WS_CALLBACK[msg.__id] = cb
  }
  ws.send(typeof msg == 'string' ? msg : JSON.stringify(msg))
}
ws._send_debounce = util_debounce_throttle._debounce(ws._send, 30)
ws._send_throttle = util_debounce_throttle._throttle(ws._send, 30, true)
ws._send_throttle2 = util_debounce_throttle._throttle(ws._send, 30, false)

function sc (str, cb) {
  cb = cb || function (msg) {
    if (msg.result !== undefined) console.log(msg.result)
  }
  ws._send({type: 'command', meta: 'server', data: str}, cb)
}
function cc (str, isPhantom, cb) {
  cb = cb || function (msg) {
    if (msg.result !== undefined) console.log(msg.result)
  }
  ws._send({type: 'command', meta: isPhantom ? 'phantom' : 'client', data: str}, cb)
}
function assert(str, type) {
  var args = [].slice.call(arguments, 2)
  var cb = function (msg) {
    chai.assert[type].apply(null, [msg.result].concat(args))
  }
  ws._send({type: 'command', meta: 'client', data: str, assert:{type:type, args:args}}, cb)
}

window.assert = assert
window.sc=sc
window.cc=cc

function startStopRec (e, arg) {
  if (e) e.preventDefault()
  arg=arg||{}
  let title = arg.path
  if (stage == null) {
    if (!title)
      while(1) {
        title = currentPath = window.prompt('which title', currentPath) || ''
        if (!title) return
        if (INVALID_NAME_REGEXP.test(title)) alert('path name cannot contain ' + INVALID_NAME)
        else if (/\/$/.test(title)) alert('cannot end of /')
        else {
          // title is string of json: ['a','b']
          arg.path = title = JSON.stringify(title.split('/'))
          break
        }
      }
    else
      currentPath = title
    // document.title = 'recording...'+title
    flashTitle('RECORDING')
    currentName = 'test' + (+new Date())
    sc(' startRec("' + btoa(encodeURIComponent(JSON.stringify(arg))) + '", "' + currentName + '") ')
    stage = RECORDING
  } else if (stage == RECORDING) {
    return saveRec(null, true)
  }
}

function saveRec(e, save, slient) {
  if (e) e.preventDefault()
  if(!slient && !confirm('Confirm '+ (save?'save':'!!!not!!! save')+ ' current record:'+currentPath)) return false
  sc(' stopRec(' + !!save + ') ')
  clearTitle()
  keyframeCount = 0
  showSetup()
  return true
}

var oncloseSetup = function (arg) {
  const path =JSON.stringify(arg.path)
  if (arg.action=='add') {
    arg.retain = true
    mOverlay.show({
      com: {
        controller() {
          this.captureMode = 'mouse'
        },
        view(ctrl, overlay) {
          return m(
            'div',
            {},
            [
              m('', 'will test: ' + path + '@'+arg.folder),
              m('div.option', [
                m('span', 'input capture method: '),
                m('select', {
                  oninput: function(e) {
                    ctrl.captureMode = $(this).val()
                  }
                }, ['mouse', 'xpath'].map( v=> m('option', v)))
              ]),
              m('div.option', [
                m('span', 'cache include blob: '),
                m('input', {
                  oninput: function(e) {
                    ctrl.cacheInclude = this.value
                  }
                })
              ]),
              m('div.option', [
                m('span', 'cache exclude blob: '),
                m('input', {
                  oninput: function(e) {
                    ctrl.cacheExclude = this.value
                  }
                })
              ]),
              m('button', {
                onclick:e=>{
                  overlay.hide()
                  hideSetup()
                  objutil.assign(arg, ctrl)
                  startStopRec(null, arg)
                }
              }, 'ok'),
              m('button', {
                onclick () {
                  overlay.hide()
                }
              }, 'cancel')
            ]
          )
        }
      }
    })
    // if(confirm('Confirm to begin record new test for path:\n\n    ' + path+'\n    '+ arg.folder))
    //   startStopRec(null, aprg)
  }
  if(arg.action=='play'){
    stage = PLAYING
    sc(' playTestFile("' + arg.file + '", "' + arg.url + '") ')
    setTimeout(function(arg) {
      // window.reload()
    })
  }
  if(arg.action=='view'){
    let {folder, file:test, a} = arg
    stage = IMAGEVIEW
    mOverlay.show( '#testimage', { com: m.component(
        testImage,
        {
          data: {folder,test,a},
          onclose:function() {
            stage=SETUP
            mOverlay.hide('#testimage')
          }
        }
      ) } )
  }
  if(arg.action=='testAll'){
    stage = REPORTER
    sc(' runTestFile() ')
  }
  if(arg.action=='test'){
    stage = REPORTER
    sc(' runTestFile(' + JSON.stringify(arg.file) + ') ')
  }
  if (!arg.retain) hideSetup()
}

function hideSetup (arg) {
  mOverlay.hide('#overlay')
  $(window).trigger('resize')
  stage = null
}

function showSetup (arg) {
  if(stage == RECORDING && !startStopRec() ) return
  stage = SETUP
  mOverlay.show('#overlay', {com: m.component(mTree, {url: '/config', onclose: oncloseSetup })})
}

// mOverlay.show('#reporter', {com: m.component(reporter, {})})
// mOverlay.show('#testimage', {com: m.component(testImage, {})})

//
// setup keyboard event

function registerEvent () {
  Mousetrap.bind('ctrl+p', function (e) {
    e.preventDefault()
  })
  Mousetrap.bind('f4', function (e) {
    e.preventDefault()
    if(stage>SETUP) return
    if (stage === SETUP) {
      hideSetup()
    } else {
      showSetup()
    }
  })
  Mousetrap.bind('space', function (e) {
    if (stage !== PLAYING) return
    e.preventDefault()
    sc(' playBack.playPause() ')
  })
  Mousetrap.bind('f5', function (e) {
    if (stage !== null) return
    e.preventDefault()
    sc(' reloadPhantom() ')
  })
  Mousetrap.bind('ctrl+a', function (e) {
    e.preventDefault()
    if (stage !== null) return
    stage = CLIPPING
  })
  Mousetrap.bind('f8', function (e) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    if (!currentPath || stage!==RECORDING) return
    sc(' snapKeyFrame("' + currentName + '") ')
    keyframeCount++
  })
  Mousetrap.bind('ctrl+r', function (e) {
    if (e) e.preventDefault()
    if(stage!==RECORDING) return
    saveRec(e, false)
  })

  $(window).on('resize', function (e) {
    const data = { scrollX: window.scrollX, scrollY: window.scrollY, width: $(window).width(), height: $(window).height()}
    ws._send({ type: 'window_resize', data: data })
  })
  $(window).trigger('resize')

  $(window).on('scroll', function (e) {
    const data = { scrollX: window.scrollX, scrollY: window.scrollY, width: $(window).width(), height: $(window).height()}
    ws._send({ type: 'window_scroll', data: data })
  })
  $(window).trigger('scroll')

  const eventList = [
    'keydown',
    'keyup',
    'mousedown',
    'mouseup',
    'mousemove',
    // 'click',
    // 'dblclick',
  ]
  eventList.forEach(function (v) {
    $(document).on(v, function (evt) {
      if (stage !== RECORDING && stage!==null) return
      const e = evt.originalEvent
      if (e.defaultPrevented) {
        return // Should do nothing if the key event was already consumed.
      }
      const isKey = /key/.test(e.type)
      if (isKey && ['F12'].indexOf(e.key)<0 ) e.preventDefault()
      // if (!isKey && e.target.id!=='phantom') return
      let modifier = 0
      if (e.shiftKey) modifier |= MODIFIER.shift
      if (e.altKey) modifier |= MODIFIER.alt
      if (e.ctrlKey) modifier |= MODIFIER.ctrl
      if (e.metaKey) modifier |= MODIFIER.meta
      const evtData = { type: e.type, which: e.which, modifier: modifier }
      if (isKey) {
        evtData.keyName = e.key || e.keyIdentifier
        // console.log(e,  e.key||e.keyIdentifier, modifier )
        if(modifier===0 && evtData.keyName==='F8') return
      } else {
        evtData.pageX = e.pageX // -window.scrollX
        evtData.pageY = e.pageY // -window.scrollY
      }
      // if(evtData.type=='mousemove') ws._send_throttle({ type:'event_mouse', data:evtData })
      // else ws._send({ type:'event_mouse', data:evtData })
      ws._send({ type: isKey ? 'event_key' : 'event_mouse', data: evtData })
    })
  })
}

const _repeat = function (str, n) {return new Array(n + 1).join(str) }

function clearTitle (str) {
  clearInterval(intervalTitle)
  document.title = 'ptest'
  stage = null
}
function flashTitle (str, isStatic) {
  clearInterval(intervalTitle)
  let t = 0
  const flash = function () {
    let tt = _repeat('+', keyframeCount)
    if (isStatic) tt += str + '...'
    else tt += t++ % 2 ? str + '...' : 'ptest...'
    document.title = tt
  }
  intervalTitle = setInterval(flash, 1000)
  flash()
}

$(function () {
  registerEvent()
  document.body.focus()
})

window.onunload = function () {
  // $.ajax({ type:'GET', url: window.location.protocol+ '//'+ window.location.host + '/reload', async:false })
  sc(' reloadPhantom() ')
}

var testText = 'this is the mithril com test'
var test = {
  controller: function () {},
  view: function (ctrl) {
    return m('.abc', {
      onclick: function (e) {
        var target = e.target || event.srcElement
        mOverlay.hide(target)
      }
    }, testText)
  }
}
