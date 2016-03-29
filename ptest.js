/*
Copyright @ Michael Yang
License MIT
*/

// phantomjs module
var sys = require('system')
var page = require('webpage').create()

phantom.onError = assertError
function assertError (msg, stack) {
  console.log('phantom onerror:', msg)
  if (!/AssertionError/.test(msg)) return
  console.log(msg, '\n' + stack.map(function (v) { return 'Line ' + v.line + ' ' + (v.function ? '[' + v.function + '] ' : '') + v.file }).join('\n'))
  phantom.exit(1)
}
var PageClip = {}
var URL = ''
var DBLCLICK_INTERVAL = 500   // windows default double click time is 500ms
var WHICH_MOUSE_BUTTON = {'0': '', '1': 'left', '2': 'middle', '3': 'right'}
var ASYNC_COMMAND = {
  'page.reload': null,
  'page.go': null
}
var asyncCB = function (cmd) {
  var args = [].slice.call(arguments, 1)
  if (typeof ASYNC_COMMAND[cmd] === 'function') {
    ASYNC_COMMAND[cmd].apply(null, args)
    ASYNC_COMMAND[cmd] = null
  }
}

function _clone(obj){
  return JSON.parse(JSON.stringify(obj))
}

page.zoomFactor = 1
// page.clipRect = { top: 10, left: 0, width: 640, height: 490 }
page.viewportSize = { width: 1000, height: 610 }
// page.settings.userAgent = 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'
page.settings.resourceTimeout = 50000 // 5 seconds
page.settings.localToRemoteUrlAccessEnabled = true
page.settings.webSecurityEnabled = false
page.customHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Connection': 'keep-alive'
}

console.log('phantom started')


var ws = new WebSocket('ws://localhost:1280')
ws.onopen = function (e) {
  console.log('phantom connected to ws')
  ws.EventCache = []

  ws.onmessage = function (message) {
    var msg
    try { msg = JSON.parse(message.data) } catch (e) { msg = message.data }
    if (typeof msg !== 'object' || !msg) return

    switch (msg.type) {
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

      console.log("data path:", msg.data)
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
        var cmd = msg.data.trim().split('(').shift()
        var cb = function (result) {
          if (arguments.length) msg.result = result
          delete msg.data
          msg.type = 'command_result'
          ws._send(msg)
        }
        var isAsync = cmd in ASYNC_COMMAND
        if (msg.__id && isAsync) ASYNC_COMMAND[cmd] = cb

        try {
          if(msg.meta=='client'){
            msg.result = page.evaluate(function(str){
              return eval(str)
            }, msg.data)
          }else{
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
        var QTKey = name && (page.event.key[name] || page.event.key[ keyNameAlias[name] ])
        // console.log(c, name)
        if( QTKey ){
          c = QTKey
          // console.log('found Qt key:', name, c)
        }else{
          c = guessKey(e)
        }

        page.sendEvent(e.type, c, null, null, e.modifier)

        break
      case 'event_mouse':
        var e = msg.data
        // if (/down|up/.test(e.type)) return
        e.type = e.type.replace('dbl', 'double')

        // generate double click event
        if (/down|up/.test(e.type)){
          var ce = _clone(e)
          ce.time = Date.now()
          ws.EventCache.push(ce)
          if(ws.EventCache.length>3) ws.EventCache.shift()
          // console.log(JSON.stringify(ws.EventCache))
          if(ws.EventCache.length===3
            && ws.EventCache[0].type==='mousedown' && ws.EventCache[1].type==='mouseup'
            && ws.EventCache[2].time-ws.EventCache[0].time<DBLCLICK_INTERVAL){
            e.type = ws.EventCache[2].type = 'mousedoubleclick'
          }
        }

        // console.log(e.type, e.pageX, e.pageY, e.which, WHICH_MOUSE_BUTTON[e.which], e.modifier)

        // if (/click|down|up/.test(e.type)) page.sendEvent('mousemove', e.pageX, e.pageY, '')

        page.sendEvent(e.type, e.pageX-(page.scrollPosition.left||0), e.pageY-(page.scrollPosition.top||0), WHICH_MOUSE_BUTTON[e.which], e.modifier)
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
var WS_CALLBACK = {}
ws._send = function (msg, cb) {
  if (ws.readyState !== 1) return
  if (typeof cb === 'function') {
    msg.__id = '_' + Date.now() + Math.random()
    WS_CALLBACK[msg.__id] = cb
  }
  ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg))
}

page.onError = function (msg, stack) {
  ws._send({type: 'client_error', data: {msg: msg, stack: stack}})
}
page.onConsoleMessage = function (msg) {
  ws._send({type: 'client_console', data: msg})
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
      dot.style.cssText = 'pointer-events:none; border-radius:100px; background:rgba(255,0,0,0.8); width:10px; height:10px; position:absolute; z-index:9999999999;'
      dot.style.zIndex = Math.pow(2, 53)
      document.body.appendChild(dot)
      return dot
    })()
    window._phantom.setDot = function (x, y) {
      window._phantom.dot.style.left = x - 5 + 'px'
      window._phantom.dot.style.top = y - 5 + 'px'
    }
  })
}

page.onLoadFinished = function (status) { // success
  page.status = status
  console.log(page.url, page.status)
  //set background to white to prevent transparent
  page.evaluate(function() {
    var head = document.querySelector('head');
        style = document.createElement('style');
        text = document.createTextNode('body { background: #fff }');
    style.setAttribute('type', 'text/css');
    style.appendChild(text);
    head.insertBefore(style, head.firstChild);
  });

  asyncCB('page.open', status)
  asyncCB('page.reload', status)

  createCursor()

  clearTimeout(renderRun)
  renderRun = 0
  renderLoop()

  page.evaluate(function () {
    window.addEventListener('mousemove', function (evt) {
      // _phantom.setDot(evt.pageX,evt.pageY)
    })
    window.addEventListener('mouseup', function (evt) {})
    window.addEventListener('mousedown', function (evt) {
      // console.log(evt.type, Date.now())
      // _phantom.setDot(evt.pageX,evt.pageY)
    })
  })
}

function init () {
  if (sys.args.length === 1) return
  URL = sys.args[1]
  // URL = 'http://bing.com'
  if (page.clearMemoryCache) page.clearMemoryCache()
  page.open(URL)
}
init()



// key code map, for sendEvent of key
var keyNameAlias = {
  'PrintScreen': 'Print',
  'Scroll': 'ScrollLock',
}
var _to_ascii = {
  '188': '44',    // ,
  '190': '46',    // .
  '191': '47',    // /
  '192': '96',    // `
  '220': '92',    // \
  '222': '39',    // '
  '221': '93',    // ]
  '219': '91',    // [
  '187': '61',    // = IE Key codes
  '186': '59',    // ; IE Key codes
  // '109': '45', // -
  '173': '45',    // -
  '189': '45'     // - IE Key codes
}

var shiftUps = {
  "96": "~",
  "49": "!",
  "50": "@",
  "51": "#",
  "52": "$",
  "53": "%",
  "54": "^",
  "55": "&",
  "56": "*",
  "57": "(",
  "48": ")",
  "45": "_",
  "61": "+",
  "91": "{",
  "93": "}",
  "92": "|",
  "59": ":",
  "39": "\"",
  "44": "<",
  "46": ">",
  "47": "?",
}
function guessKey(e){
  var c = e.which
  var shiftKey = e.modifier & 0x02000000
  if (_to_ascii[c]) {
    c = _to_ascii[c]
  }
  if (!shiftKey && (c >= 65 && c <= 90)) {
    c = String.fromCharCode(c + 32)
  } else if (shiftKey && shiftUps[c]) {
    //get shifted keyCode value
    c = shiftUps[c]
  } else if (c==8) { c = page.event.key.Backspace
  } else if (c==9) { c = page.event.key.Tab
  } else if (c==13) { c = page.event.key.Enter
  } else if (c==27) { c = page.event.key.Escape
  } else if (c==46) { c = page.event.key.Delete
  } else {
    c = String.fromCharCode(c)
  }
  return c
}


