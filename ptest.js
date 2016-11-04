/*
  Copyright @ Michael Yang
  License MIT
*/

// phantomjs module
var fs = require('fs')
var sys = require('system')
var helper = require('./helpers/helper.js')
var replaceCSSUrl = require('./node_modules/replace-css-url')
var url = require('url')
var page = require('webpage').create()

var DEBUG = sys.env['DEBUG']
var debug = function (arg) {
  var args = [].slice.call(arguments)
  if (DEBUG) console.log.apply(console, args)
}

a= [
  {
    a: 1,
    b: 2
  },
  [
    2,
    3
  ],
  //sdf
  4,
  5
]

b=[
  1,
  //sdf
  2,
  3
]

!{
  "contentType": "text/css",
  "headers": [
    {
      "name": "Content-Type",
      "value": "text/css"
    },
    {
      "name": "server",
      "value": "node-static/0.7.7"
    },
    {
      "name": "cache-control",
      "value": "max-age=3600"
    },
    {
      "name": "Etag",
      "value": "\"1201360-49-1477293879000\""
    },
    {
      "name": "Date",
      "value": "Tue, 25 Oct 2016 00:40:48 GMT"
    },
    {
      "name": "Last-Modified",
      "value": "Mon, 24 Oct 2016 07:24:39 GMT"
    },
    {
      "name": "Content-Length",
      "value": "49"
    },
    {
      "name": "Connection",
      "value": "keep-alive"
    }
  ],
  "id": 8,
  "redirectURL": null,
  "stage": "end",
  "status": 200,
  "statusText": "OK",
  "time": "2016-10-25T00:40:48.733Z",
  "url": "http://1111hui.com/texman/css/test.css"
}


phantom.onError = assertError
function assertError (msg, stack) {
  console.log('phantom onerror:', msg)
  if (!/AssertionError/.test(msg)) return
  console.log(msg, '\n' + stack.map(function (v) { return 'Line ' + v.line + ' ' + (v.function ? '[' + v.function + '] ' : '') + v.file }).join('\n'))
  phantom.exit(1)
}

var clientUtilsInjected = false
var StoreFolder = ''
var StoreRandom = []
var DownloadStore = []
var STOPPED = 0, STOPPING = 1, PAUSING = 2, PAUSED = 4, RUNNING = 8, PLAYING = 16, RECORDING = 32
var ARG_URL = (sys.args.length > 1 && sys.args[1]) || 'about:blank'
var PageClip = {}
var DBLCLICK_INTERVAL = 500 // windows default double click time is 500ms
var WHICH_MOUSE_BUTTON = {'0': '', '1': 'left', '2': 'middle', '3': 'right'}
var ASYNC_COMMAND = {
  'page.reload': null,
  'page.open': null,
  'openPage': null
}
var INPUT_MODE = 'mouse'        // mouse|xpath

var asyncCB = function (cmd) {
  var args = [].slice.call(arguments, 1)
  if (typeof ASYNC_COMMAND[cmd] === 'function') {
    ASYNC_COMMAND[cmd].apply(null, args)
    ASYNC_COMMAND[cmd] = null
  }
}

function _clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

page.zoomFactor = 1
// page.clipRect = { top: 10, left: 0, width: 640, height: 490 }
page.viewportSize = { width: 1000, height: 610 }
page.settings.userAgent = 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'
page.settings.resourceTimeout = 50000 // 5 seconds
page.settings.localToRemoteUrlAccessEnabled = true
page.settings.webSecurityEnabled = false
page.customHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Connection': 'keep-alive'
}

console.log('phantom started')

var ws = null

function connectWS () {
  var WS_CALLBACK = {}
  ws = new WebSocket('ws://localhost:1280')
  ws.onopen = function (e) {
    console.log('phantom connected to ws')
    ws.EventCache = []

    ws.onmessage = function (message) {
      var msg
      try { msg = JSON.parse(message.data) } catch (e) { msg = message.data }
      if (typeof msg !== 'object' || !msg) return

      switch (msg.type) {
      case 'ping':
        // beat heart ping
        return
        break

      case 'stage':
        stage = msg.data.stage
        if(msg.data.storeRandom) StoreRandom = msg.data.storeRandom || []
        if(msg.data.downloadStore) DownloadStore = msg.data.downloadStore || []
        if (msg.data && msg.data.storeFolder) {  //stage === RECORDING
          StoreFolder = msg.data.storeFolder
        }
        break

      case 'broadcast':
        // if(msg.meta=='clientList'&&msg.data.indexOf('client')>-1 && page.status!='success' ) init()

        break

      case 'client_close':
        console.log('client close')
        renderCount = 0
        break

      case 'page_clip':
        PageClip = msg.data

        break
      case 'snapshot':
        hideCursor()
        var prevPos = page.scrollPosition
        page.scrollPosition = { top: 0, left: 0 }
        if (Object.keys(PageClip).length) {
          page.clipRect = {
            top: PageClip.top || page.scrollPosition.top,
            left: PageClip.left || page.scrollPosition.left,
            width: PageClip.width || page.viewportSize.width,
            height: PageClip.height || page.viewportSize.height
          }
        }

        console.log('snapshot path:', msg.data)
        page.render(msg.data)

        page.clipRect = {}

        page.scrollPosition = prevPos

        showCursor()

        break
      case 'window_resize':
      case 'window_scroll':
        page.scrollPosition = {
          top: msg.data.scrollY,
          left: msg.data.scrollX
        }
        page.viewportSize = { width: msg.data.width, height: msg.data.height }
        // console.log( msg.type, JSON.stringify( msg.data ) )

        break

        // command from client.html
      case 'command':
        var cmd = msg.data.trim().match(/([.\w]+)\s*\((.*)\)/)
        var cb = function (result) {
          if (arguments.length) msg.result = result
          // delete msg.data
          msg.type = 'command_result'
          ws._send(msg)
        }
        var isAsync = cmd && cmd[1] in ASYNC_COMMAND
        if (isAsync) {
        }
        if (msg.__id && isAsync) ASYNC_COMMAND[cmd[1]] = cb

        try {
          if (msg.meta == 'client') {
            msg.result = page.evaluate(function (str) {
              return eval(str)
            }, msg.data)
          } else {
            msg.result = eval(msg.data)
          }
        } catch (e) {
          msg.result = e.message
        }

        if (!isAsync) {
          cb()
        }

        break

        // get callback from ws._call
      case 'command_result':
        if (msg.__id) {
          var cb = WS_CALLBACK[msg.__id]
          delete WS_CALLBACK[msg.__id]
          cb && cb(msg)
        }

        break
      case 'event_key':
        var e = msg.data
        var c = e.which
        var name = e.keyName
        var QTKey = name && (page.event.key[name] || page.event.key[ keyNameAlias[name]])
        // console.log(c, name)
        if (QTKey) {
          c = QTKey
          // console.log('found Qt key:', name, c)
        } else {
          c = guessKey(e)
        }

        page.sendEvent(e.type, c, null, null, e.modifier)

        break
      case 'event_mouse':
        var e = msg.data
        // if (/down|up/.test(e.type)) return
        e.type = e.type.replace('dbl', 'double')

        // generate double click event
        if (/down|up/.test(e.type)) {
          var ce = _clone(e)
          ce.time = Date.now()
          ws.EventCache.push(ce)
          if (ws.EventCache.length > 3) ws.EventCache.shift()
          // console.log(JSON.stringify(ws.EventCache))
          if (ws.EventCache.length === 3
              && ws.EventCache[0].type === 'mousedown' && ws.EventCache[1].type === 'mouseup'
              && ws.EventCache[2].time - ws.EventCache[0].time < DBLCLICK_INTERVAL) {
            e.type = ws.EventCache[2].type = 'mousedoubleclick'
          }
        }

        var viewPortX = e.pageX - (page.scrollPosition.left || 0)
        var viewPortY = e.pageY - (page.scrollPosition.top || 0)

        // console.log(e.type, e.pageX, e.pageY, e.which, WHICH_MOUSE_BUTTON[e.which], e.modifier)

        // if (/click|down|up/.test(e.type)) page.sendEvent('mousemove', e.pageX, e.pageY, '')

        page.sendEvent(e.type, viewPortX, viewPortY, WHICH_MOUSE_BUTTON[e.which], e.modifier)
        setCursorPos(e.pageX, e.pageY)

        break
      default:

        break
      }
    }
    ws.onclose = function (code, reason, bClean) {
      console.log('ws error: ', code, reason)
    }
    ws._send({type: 'connection', meta: 'server', name: 'phantom'})
  }
  ws._send = function (msg, cb) {
    if (ws.readyState !== 1) return
    if (typeof cb === 'function') {
      msg.__id = '_' + Date.now() + Math.random()
      WS_CALLBACK[msg.__id] = cb
    }
    ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
}
connectWS()

page.onError = function (msg, stack) {
  console.log(msg, stack)
  ws._send({type: 'client_error', data: {msg: msg, stack: stack}})
}
page.onCallback = function (data) {
  if(typeof data!=='object') return
  switch(data.command) {
  case 'wsMessage':
    ws._send(data.data)
    break
  case 'download':
    var obj = getDownload(data.id)
    var status = data.status
    obj.status = status
    if(status=='success') {
      console.log('success downloaded', data.url)
      var content = atob(data.data.split(',')[1])
      // css: replace all url(),@import path to cache path
      if(obj.response.contentType == 'text/css') {
        content = replaceCSSUrl(content, function(uri) {
          return url.resolve(data.url, uri)
        })
      }
      fs.write(pathJoin(StoreFolder, obj.filePath), content, 'wb')
    } else {
      obj.errorMsg = data.errorMsg
      obj.errorCode = data.errorCode
      console.log('failed download', data.url, data.errorCode, data.errorMsg)
    }
    fs.write(pathJoin(StoreFolder, 'cache.json'), JSON.stringify(DownloadStore, null, 2), 'w')
    break
  default:
    break
  }
}
page.onConsoleMessage = function (msg) {
  var e = msg.split(':')
  if (e.length > 1 && e[0] == 'PageEvent') {
    debug(e[0], e[1])
    // if (e[1] == 'DOMContentLoaded') createCursor()
  } else {
    ws._send({type: 'client_console', data: msg})
  }
}

var renderRun = 0
var renderCount = 0
function renderPage () {
  var prevPos = page.scrollPosition
  page.scrollPosition = { top: 0, left: 0 }
  ws._send({ type: 'render', data: page.renderBase64('JPEG'), meta: { count: renderCount++, size: page.viewportSize } })
  page.scrollPosition = prevPos
}
function renderLoop () {
  renderRun = setTimeout(function () {
    renderPage()
    renderLoop()
  }, 100)
}

function setCursorPos (x, y) {
  page.evaluate(function (x, y) {
    window._phantom.setDot(x, y)
  }, x, y)
}
function hideCursor () {
  page.evaluate(function () {
    window._phantom.dot.style.display = 'none'
  })
}
function showCursor () {
  page.evaluate(function () {
    window._phantom.dot.style.display = 'block'
  })
}

function createCursor () {
  page.evaluate(function () {
    window._phantom.dot = (function () {
      var dot = document.createElement('div')
      dot.id = '__phantom_dot'
      dot.style.cssText = 'pointer-events:none; border-radius:100px; border:1px solid green; background:rgba(255,0,0,0.8); width:9px; height:9px; position:absolute; z-index:9999999999;'
      dot.style.zIndex = Math.pow(2, 53)
      document.body.appendChild(dot)
      return dot
    })()
    window._phantom.setDot = function (x, y) {
      var dot = window._phantom.dot
      if (!dot.parentElement) {
        document.body.appendChild(dot)
      }
      dot.style.left = x - 5 + 'px'
      dot.style.top = y - 5 + 'px'
    }
  })
}

function addPageBG () {
  var head = document.querySelector('head')
  // single page of /abc.png don't have head
  if(!head) return
  style = document.createElement('style')
  text = document.createTextNode('body { background: #fff }')
  style.setAttribute('type', 'text/css')
  style.appendChild(text)
  head.insertBefore(style, head.firstChild)
}

function applyRandom () {
  StoreRandom = StoreRandom || []
  page.evaluate(function (store) {
    var __old_math_random = Math.random
    Math.random = function () {
      var val = __old_math_random()
      // if (store.length) console.log(store[0]) //log Math.random() value
      return store.shift() || val
    }
  }, StoreRandom)
}

function clientLog(msg) {
  var args = [].slice.call(arguments)
  ws._send({type: 'client_console', data: args.join(' ')})
}
function clientErr(e) {
  ws._send({type: 'client_error', data: {msg:e}})
}

function hookRandom () {
  page.evaluate(function () {
    window._phantom.__storeRandom = []
    var __old_math_random = Math.random
    Math.random = function () {
      var val = __old_math_random()
      window._phantom.__storeRandom.push(val)
      return val
    }
  })
}

page.onInitialized = function () {
  debug('onInitialized')
  debug('stage', stage, StoreRandom)
  if (stage === RECORDING) {
    hookRandom()
  } else {
    applyRandom()
  }

  // below will create dot ASAP
  page.evaluate(function () {
    document.addEventListener('DOMContentLoaded', function () {
      console.log('PageEvent:DOMContentLoaded')
    }, false)
  })
}

page.onResourceError = function (resourceError) {
  clientErr(resourceError)
  // console.log('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')')
}

page.onResourceReceived = function (res) {
  clientLog('onResourceReceived', res.url, res.stage, res.bodySize)
  if(stage === RECORDING && res.stage=='start') {
    // the 'start' stage have [body,bodySize] key as extra
    // and the time updated for 'end' stage
    getDownload(res.id).response = res
  }
}

page.onResourceRequested = function (res, req) {
  clientLog('onResourceRequested', res.url)
  // only cache url with http/https protocol
  if(/^https?:/.test(res.url)) {
    if(stage === RECORDING) {
      DownloadStore.push({
        id: res.id,
        status: 'pending',
        method: res.method,
        url: res.url,
        time: res.time
      })
      checkDownload() // another check is after page loaded!
    } else {
      // consume the cache list, remove after retrive
      var urlObj = getDownload(function(v) { return v.url === res.url }, true)
      console.log(res.url, 'replace with cache: ', urlObj.filePath)
      // only change url when it's previous downloaded successfully
      if(urlObj && urlObj.status == 'success') req.changeUrl(helper.format(
        'http://localhost:8080/cache?url=%s&folder=%s',
        encodeURIComponent(res.url),
        encodeURIComponent(StoreFolder)
      ))
    }
  }
}

page.onUrlChanged = function(targetUrl) {
  debug('onUrlChanged to New URL: ' + targetUrl)
}

page.onNavigationRequested = function (url, type, willNavigate, main) {
  console.log('onNavigationrequested')
  if(main) onNewPage()
}
page.onPageCreated = function (newPage) {
  debug('onPageCreated')
}
page.onLoadStarted = function () {
  console.log('onLoadStarted')
}

// reinit vars when main page change URL
function onNewPage() {
  clientUtilsInjected = false
  // StoreFolder = ''
  // StoreRandom = []
  // DownloadStore = []
  PageClip = {}
}

page.onLoadFinished = function (status) { // success
  page.status = status

  // for first blank page, page.url == ''
  console.log('onLoadFinished', page.url, page.status)

  // At first blank page event order: (no DOMContentloaded)
  // onLoadFinished->onInitialized (other url inversed)
  // if (page.url === '') createCursor()
  createCursor()

  // set background to white to prevent transparent
  page.evaluate(addPageBG)

  Object.keys(ASYNC_COMMAND).forEach(function (cmd) {
    asyncCB(cmd, status)
  })

  clearTimeout(renderRun)
  renderRun = 0
  renderLoop()

  page.evaluate(function () {
    _phantom.MODIFIER = {
      shift: 0x02000000,
      ctrl: 0x04000000,
      alt: 0x08000000,
      meta: 0x10000000,
      keypad: 0x20000000
    }

    _phantom._mouseToXPath = function (evt) {
      // get XPath of clicked element
      var XPath = _phantom.getXPath(evt.target)
      console.log(XPath)
      var modifier = 0
      if (evt.shiftKey) modifier |= _phantom.MODIFIER.shift
      if (evt.altKey) modifier |= _phantom.MODIFIER.alt
      if (evt.ctrlKey) modifier |= _phantom.MODIFIER.ctrl
      if (evt.metaKey) modifier |= _phantom.MODIFIER.meta
      var evtData = { type: evt.type, which: evt.which, modifier: modifier, pageX:evt.pageX, pageY:evt.pageY }
      var msg = {type:'xpath', data:evtData, xpath:XPath}
      window.callPhantom({command:'wsMessage', data: msg})
      // ws._send(msg)
      // console.log(evt.type, Date.now())
      // _phantom.setDot(evt.pageX,evt.pageY)
    }
    window.addEventListener('mousemove', function (evt) {
      // _phantom.setDot(evt.pageX,evt.pageY)
    })
    if(_phantom.INPUT_MODE=='xpath') {
      window.addEventListener('mouseup', _phantom._mouseToXPath)
      window.addEventListener('mousedown', _phantom._mouseToXPath)
    }
  })

  var casperOptions = {verbose: true}

  injectClientJS({
    // changed only last line of casper clientutils.js
    // from casper utils, but injected into window._phantom space
    './helpers/clientutils.js': function(success) {
      if(!success) return
      helper.initClientUtils(casperOptions)
    },
    './helpers/utils.js': function(success) {
      clientUtilsInjected = true
      if(stage === RECORDING) checkDownload()
    }
  })

  // downloadFile('http://1111hui.com/texman/formlist.html')
  // downloadFile('http://1111hui.com/texman/js/jquery.js')
  // downloadFile('http://1111hui.com/texman/formlist.js')
  // downloadFile('http://1111hui.com/json-api/formtype?fields[formtype]=name,title,createAt,template')
  // downloadFile('http://phantomjs.org/img/phantomjs-logo.png')

}

function checkDownload() {
  if(!clientUtilsInjected) return
  DownloadStore.filter(function(v) {
    return v.status !== 'success'
  }).forEach(downloadFile)
}

function rand() {
  return +new Date + '_' + Math.random().toString(36).slice(2,10)
}

function getDownload (id, remove) {
  var idx
  var found = DownloadStore.some(function (v, i) {
    idx = i
    return typeof id !== 'function' ? v.id === id : id(v)
  })
  if(!found) return
  return remove
    ? DownloadStore.splice(idx, 1).shift()
    : DownloadStore[idx]
}

function downloadFile (obj) {
  var url = obj.url
  // if(!StoreFolder) return
  var cacheName = rand()
  console.log(pathJoin('cache', cacheName))

  obj.status = 'downloading'
  obj.filePath = 'cache/' + cacheName

  console.log('start downloading', url)
  page.evaluate(function (obj) {
    _phantom.downloadFile(obj)
  }, obj)

}

// from https://github.com/sindresorhus/file-url/blob/master/index.js
function fileUrl (pathName) {
  pathName = pathName.replace(/\\/g, '/')

  // Windows drive letter must be prefixed with a slash
  if (pathName[0] !== '/') {
    pathName = '/' + pathName
  }

  return encodeURI('file://' + pathName)
}

function pathJoin() {
  var args = [].slice.call(arguments)
  if(!args.length) return
  var absolute = typeof args[0]==='boolean' ? args.shift() : false
  if(absolute && !fs.isAbsolute(args[0])) args[0]=fs.absolute(args[0])
  return args.map(function(v) {
    return v.replace(/[\\\/]+$/, '')  // remove trailing slash first
  }).join(fs.separator)
}

// inject JS files from Object
function injectClientJS(obj) {
  Object.keys(obj).forEach(function(v) {
    var isInjected = page.injectJs(v)
    console.log('inject client js '+v, isInjected ? 'success' : 'failed')

    var callback = obj[v] || function() {}
    callback(isInjected)
  })
}

function openPage (url) {
  // if (sys.args.length === 1) return
  url = url || ARG_URL
  // URL = 'http://bing.com'
  if (page.clearMemoryCache) page.clearMemoryCache()
  page.open(url)
}
openPage()

// key code map, for sendEvent of key
var keyNameAlias = {
  'PrintScreen': 'Print',
  'Scroll': 'ScrollLock',
}
var _to_ascii = {
  '188': '44', // ,
  '190': '46', // .
  '191': '47', // /
  '192': '96', // `
  '220': '92', // \
  '222': '39', // '
  '221': '93', // ]
  '219': '91', // [
  '187': '61', // = IE Key codes
  '186': '59', // ; IE Key codes
  // '109': '45', // -
  '173': '45', // -
  '189': '45' // - IE Key codes
}

var shiftUps = {
  '96': '~',
  '49': '!',
  '50': '@',
  '51': '#',
  '52': '$',
  '53': '%',
  '54': '^',
  '55': '&',
  '56': '*',
  '57': '(',
  '48': ')',
  '45': '_',
  '61': '+',
  '91': '{',
  '93': '}',
  '92': '|',
  '59': ':',
  '39': '"',
  '44': '<',
  '46': '>',
  '47': '?',
}
function guessKey (e) {
  var c = e.which
  var shiftKey = e.modifier & 0x02000000
  if (_to_ascii[c]) {
    c = _to_ascii[c]
  }
  if (!shiftKey && (c >= 65 && c <= 90)) {
    c = String.fromCharCode(c + 32)
  } else if (shiftKey && shiftUps[c]) {
    // get shifted keyCode value
    c = shiftUps[c]
  } else if (c == 8) {
    c = page.event.key.Backspace
  } else if (c == 9) {
    c = page.event.key.Tab
  } else if (c == 13) {
    c = page.event.key.Enter
  } else if (c == 27) {
    c = page.event.key.Escape
  } else if (c == 46) {
    c = page.event.key.Delete
  } else {
    c = String.fromCharCode(c)
  }
  return c
}


