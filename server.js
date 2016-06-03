#!/usr/bin/env node

/*
 Copyright @ Michael Yang
 License MIT
 */
'use strict'

var DEBUG_MODE = true
var fs = require('fs')
var querystring = require('querystring')
var mkdirp = require('mkdirp')
var http = require('http')
var path = require('path')
var process = require('process')
var co = require('co')
var commander = require('commander')
var imageDiff = require('image-diff')
var _util = require('util_extend_exclude')
var spawn = require('child_process').spawn
var pointer = require('json-pointer')
var pkg = require('./package.json')

var DEFAULT_URL = [
  'http://1111hui.com/nlp/tree.html',
  // 'http://1111hui.com/github/ptes/abc.html',
].pop()
var HTTP_HOST = '0.0.0.0'
var HTTP_PORT = 8080
var WS_PORT = 1280
var DATA_DIR = 'ptest_data/'
DATA_DIR = path.join(DATA_DIR, '.') // remove ending sep(/ or \\)
var TEST_FOLDER = path.join(DATA_DIR)
var TEST_FILE = ''

commander
  .version(pkg.version)
  .option('-p, --play [playTest]', 'play test profile when start', '')
  .option('-d, --dir [testDir]', 'save test data to dir, can be relative', '')
  .option('-l, --list', 'check test folder and list available tests', '')
  .parse(process.argv)

var cmdArgs = (commander.args)
if (!commander.list && !cmdArgs.length) {
  console.log('Usage:\n  ptest-server -l\n  ptest-server url -d [testDir] -p [playTest]\n    [testDir] default value: %s', path.join(TEST_FOLDER, '..'))
  process.exit()
}
if (cmdArgs[0] !== 'debug') DEFAULT_URL = cmdArgs[0]
if (commander.list) { }
if (commander.dir) TEST_FOLDER = path.join(commander.dir, DATA_DIR)
if (commander.play) {
  TEST_FILE = commander.play
  // TEST_FILE = path.join(TEST_FOLDER, TEST_FILE)
  TEST_FILE = path.extname(TEST_FILE) ? TEST_FILE : TEST_FILE + '.json'
}
console.log(__dirname, __filename, process.cwd(), DEFAULT_URL, TEST_FOLDER, TEST_FILE)

// convert to absolute path
// TEST_FOLDER = path.isAbsolute(TEST_FOLDER) ? TEST_FOLDER : path.join(process.cwd(), TEST_FOLDER)

mkdirp(TEST_FOLDER, function (err) {
  if (err) return console.log(err)
  // copyFileSync(path.join(__dirname, 'js/ptest-runner.js'), path.join(TEST_FOLDER, '../ptest-runner.js'))
  copyFileSync(path.join(__dirname, './phantom.config'), path.join(TEST_FOLDER, 'phantom.config'))
  copyFileSync(path.join(__dirname, 'js/ptest-phantom.js'), path.join(TEST_FOLDER, 'ptest-phantom.js'))
})

var ROUTE = {
  '/': '/client.html',
}
var MIME = {
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
}

function copyFileSync (srcFile, destFile, encoding) {
  var content = fs.readFileSync(srcFile, encoding || 'utf8')
  fs.writeFileSync(destFile, content, encoding || 'utf8')
}
// helper function
function arrayLast (arr) {
  if (arr.length) return arr[arr.length - 1]
}

// create Http Server
var HttpServer = http.createServer(function (req, res) {
  console.log((new Date).toLocaleString(), req.method, req.url)

  if (req.url === '/config' && req.method == 'GET') {
    res.writeHeader(200, {'Content-Type': 'application/json'})
    return res.end(readPtestConfig())
  }

  if (req.url === '/config' && req.method == 'POST') {
    res.writeHead(200, 'OK', {'Content-Type': 'application/json'})
    var body = ''
    req.on('data', function (chunk) { body += chunk })
    req.on('end', function () {
      try{
        JSON.parse(body)
        writePtestConfig(body)
        res.end(JSON.stringify({error:null}))
      }catch(e){
        var msg = 'Config data not valid json'
        console.log(msg, body)
        res.end(JSON.stringify({error:msg}))
      }
    })
    return
  }

  if (req.url === '/reload') {
    if (Options.syncReload) reloadPhantom()
    return res.end()
  }

  var filePath = req.url
  filePath = '.' + (ROUTE[filePath] || filePath)

  var ext = path.extname(filePath)
  var contentType = MIME[ext] || 'text/html'

  fs.readFile(path.join(__dirname, filePath), function (err, data) {
    if (err) {
      res.statusCode = 404
      return res.end()
    }
    res.writeHeader(200, {'Content-Type': contentType})
    res.end(data, 'utf8')
  })
})
HttpServer.listen(HTTP_PORT, HTTP_HOST)

console.log('server started at %s:%s', HTTP_HOST, HTTP_PORT)

var EventCache = []
var ViewportCache = []
var PageClip = {}
var Config = {url: DEFAULT_URL}
Config[DATA_DIR] = {}

var ImageName = ''
var PlayCount = 0
var RECORDING = false
var Options = {
  syncReload: true, // after recording, reload phantom page
  playBackOnInit: false, // with --play option, auto play test when socket open
}

//
// function begin
function snapShot (name) {
  toPhantom({ type: 'snapshot', data: path.join(TEST_FOLDER, name) })
}
function showDiff (a, b) {
  imageDiff({
    actualImage: path.join(TEST_FOLDER, (a || 'a.png')),
    expectedImage: path.join(TEST_FOLDER, (b || 'b.png')),
    diffImage: path.join(TEST_FOLDER, 'diff_' + b),
  }, function (err, imagesAreSame) {
    console.log(err, imagesAreSame)
  })
}

function startRec (title) {
  if (playBack.status != STOPPED) {
    return client_console('cannot record when in playback')
  }
  toPhantom({ type: 'command', meta: 'server', data: 'page.reload()' }, function (msg) {
    if (msg.result === 'success') {
      Config.unsaved = { name: title, span: Date.now() }
      RECORDING = true
      EventCache = [ { time: Date.now(), msg: arrayLast(ViewportCache) }, { time: Date.now(), msg: {type: 'page_clip', data: PageClip} } ]
      // ViewportCache = [  ]
    } else {
      client_console('error open page, status', msg)
    }
  })
}

function writePtestConfig(Config) {
  fs.writeFileSync(path.join(TEST_FOLDER , 'ptest.json'), JSON.stringify(Config, null, 2))
}

function readPtestConfig() {
  var content = ''
  try {
    content = fs.readFileSync(path.join(TEST_FOLDER, 'ptest.json'), 'utf8')
    Config = JSON.parse(content)
  } catch(e) {
    if (e.code !== 'ENOENT') {
      console.log(e, 'error parse ptest.json...')
      return process.exit()
    }
  }
  return content
}

function stopRec () {
  RECORDING = false
  var name = +new Date()
  ImageName = name

  // var Config = {unsaved:{name:'a;b'}}
  var testPath = Config.unsaved.name
  try {
    mkdirp.sync(path.join(TEST_FOLDER, testPath))
  } catch(e) {
    throw e
  }
  snapKeyFrame(testPath)
  var objPath = [DATA_DIR].concat(testPath.split('/'))
  Config.unsaved.name = name
  Config.unsaved.span = Date.now() - Config.unsaved.span

  // // object path
  // var p, a = objPath, b = Config
  // if (a.length == 1) b[a.shift()] = Config.unsaved
  // else while(p = a.shift()) b[p] = (b[p] || {}), a.length > 1 ? b = b[p] : b = b[p][a.shift()] = Config.unsaved
  // delete Config.unsaved

  pointer.set(Config, objPath, Config.unsaved)
  delete Config.unsaved

  fs.writeFileSync(path.join(TEST_FOLDER, name + '.json'), JSON.stringify({ testPath: testPath, clip: PageClip, event: EventCache }))
  writePtestConfig(Config)
  // reloadPhantom()
}

function snapKeyFrame (testPath) {
  var name = path.join(testPath, String(+new Date()) + '.png')
  console.log('------snapshot:', name)
  snapShot(name)
  EventCache.push({ time: Date.now(), msg: _util._extend({}, { type: 'snapshot', data: name }) })
}

// create WS Server
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: WS_PORT })
var WS_CALLBACK = {}
wss.on('connection', function connection (ws) {
  ws._send = function (msg, cb) {
    if (ws.readyState != 1) return
    if (typeof cb == 'function') {
      msg.__id = '_' + Date.now() + Math.random()
      WS_CALLBACK[msg.__id] = cb
    }
    ws.send(typeof msg == 'string' ? msg : JSON.stringify(msg))
  }

  var heartbeat = setInterval(function () { ws.send('') }, 10000)
  ws._send({type: 'ws', msg: 'connected to socket 8080'})
  // console.log('protocolVersion', ws.protocolVersion)

  ws.on('close', function incoming (code, message) {
    console.log('WS close:', ws.name, code, message)
    clearInterval(heartbeat)
    if (ws.name == 'client') toPhantom({ type: 'client_close', meta: 'server', data: '' })
  })

  ws.on('message', function incoming (message) {
    // console.log('received: %s', message)
    var msg
    try { msg = JSON.parse(message) } catch(e) { msg = message }
    if (typeof msg !== 'object') return

    // beat heart ping to keep alive
    if(msg.type==='ping')return toPhantom(msg)

    var relay = function () {
      if (ws.name === 'client') {
        RECORDING && EventCache.push({ time: Date.now(), msg: _util._extend({}, msg) }) // , viewport: arrayLast(ViewportCache)
        toPhantom(msg)
      } else {
        toClient(msg)
      }
    }

    switch (msg.type) {
    case 'connection':
      ws.name = msg.name
      broadcast({ meta: 'clientList', data: clientList() })
      if (ws.name == 'client') {
        if (Options.playBackOnInit) playBack.play()
      }
      if (ws.name == 'phantom') {
      }

      break

      // command from client.html or phantom
    case 'command':
      if (msg.meta == 'server') {
        try {
          msg.result = eval(msg.data)
        } catch(e) {
          msg.result = e.stack
        }
        delete msg.data
        msg.type = 'command_result'
        ws._send(msg)
        return
      } else {
        relay()
      }

      break

      // get callback from ws._call
    case 'command_result':
      if (msg.__id && msg.meta == 'server') {
        var cb = WS_CALLBACK[msg.__id]
        delete WS_CALLBACK[msg.__id]
        cb && cb(msg)
        return
      } else {
        relay()
      }

      break

    case 'window_resize':
    case 'window_scroll':
      ViewportCache.push(msg)
      relay()
      break

    case 'page_clip':
      PageClip = msg.data
      relay()
      break

    default:
      relay()
      break
    }
  })
})

// *** EventPlayBack will be rewritten, don't use at this time
var STOPPED = 0, STOPPING = 1, PAUSING = 2, PAUSED = 4, RUNNING = 8
class EventPlayBack {
  constructor () {
    this._status = STOPPED
    Object.defineProperty(this, 'status', {
      get: () => {
        return this._status
      },
      set: (status) => {
        this._status = status
        console.log('playback status changed:', status)
        toClient({type: 'playback', data: status})
      }
    })
    this.resume = () => {
    }
    this.cancel = () => {
    }
  }

  play () {
    var self = this
    if (RECORDING) return client_console('cannot play when recording')
    if (self.status === RUNNING) return
    if (self.status === PAUSED) return self.resume()
    if (EventCache.length < 3) return
    let prev = EventCache[0]
    let last = arrayLast(EventCache)
    client_console('begin playback, total time:', last.time - prev.time, '(ms)')
    self.status = RUNNING
    co(function * () {
      // refresh phantom page before play
      yield new Promise(function (ok, error) {
        toPhantom({ type: 'command', meta: 'server', data: 'page.reload()' }, function (msg) {
          if (msg.result == 'success') ok()
          else error()
        })
      })
      for (let i = 0, n = EventCache.length; i < n; i++) {
        if (self.status === STOPPING) {
          self.cancel()
          self.status = STOPPED
          throw 'stopped'
        }
        if (self.status === PAUSING) {
          yield new Promise((resolve, reject) => {
            self.status = PAUSED
            self.resume = () => {
              self.status = RUNNING
              self.resume = () => {
              }
              resolve()
            }
            self.cancel = () => {
              self.status = STOPPED
              self.cancel = () => {
              }
              reject('canceled')
            }
          })
        }
        let e = EventCache[i]
        let inter = e.time - prev.time
        let result = yield new Promise((resolve, reject) => {
          setTimeout(() => {
            // client_console(e.time, e.msg.type, e.msg.data)
            if (e.msg) {
              if (e.msg.type === 'snapshot') {
                console.log(e.msg.data)
                snapShot(e.msg.data.replace('.png', '_last.png'))
              } else {
                toPhantom(e.msg)
              }
              if (/page_clip|scroll|resize/.test(e.msg.type)) toClient(e.msg)
              else e.viewport && toClient(e.viewport)
            }
            prev = e
            resolve(true)
          }, inter)
        })
      }
      return 'playback complete'
    }).then((ret) => {
      self.status = STOPPED
      client_console(ret)
    }, (err) => {
      self.status = STOPPED
      client_console('playback incomplete:', err)
    })
  }

  playPause () {
    if (this.status === PAUSED)  this.play()
    else if (this.status === RUNNING) this.pause()
  }
  pause () {
    this.status = PAUSING
  }

  stop () {
    this.status = STOPPING
  }

}

var playBack = new EventPlayBack()

function clientList () {
  return wss.clients.map((v, i) => v.name)
}
function findClient (name) {
  return wss.clients.find((v, i) => v.name == name)
}
function toClient (msg, cb) {
  var client = findClient('client')
  if (client) client._send(msg, cb)
}
function toPhantom (msg, cb) {
  var phantom = findClient('phantom')
  if (phantom) phantom._send(msg, cb)
}
function client_console () {
  var msg = ''
  for (let i = 0; i < arguments.length; i++) msg += arguments[i] + ' '
  toClient({type: 'client_console', data: (new Date).toLocaleString() + ' [server] ' + msg})
}

function broadcast (data) {
  wss.clients.forEach(function each (client) {
    data.type = 'broadcast'
    client._send(data)
  })
}

// Phantom
var phantom

function startPhantom (url) {
  console.log(url)
  phantom = spawn('phantomjs', ['--config', path.join(__dirname, 'phantom.config'), path.join(__dirname, 'ptest.js'), url], {cwd: process.cwd(), stdio: 'pipe' })

  phantom.stdout.setEncoding('utf8')
  phantom.stderr.setEncoding('utf8')
  phantom.stdout.on('data', function (data) {
    console.log('stdout', data)
  })
  phantom.stderr.on('data', function (data) {
    console.log('stderr', data)
  })
  phantom.on('exit', function (code) {
    console.log('exit', code)
  })
  phantom.on('error', function (code) {
    console.log('error', code)
  })
  console.log('spawn phantom', phantom.pid)
}

function reloadPhantom () {
  toPhantom({ type: 'command', meta: 'server', data: 'page.reload()' })
}

function stopPhantom () {
  if (phantom && phantom.connected) phantom.kill()
}

function playTestFile (filename, url) {
  // console.log(path.join(TEST_FOLDER, filename))
  fs.readFile(path.join(TEST_FOLDER, filename), 'utf8', (err, data) => {
    if (err) {
      console.log('invalid json format', filename)
      return process.exit()
    }
    try {
      data = JSON.parse(data)
      if (typeof data != 'object' || !data) throw Error()
      EventCache = data.event
      ViewportCache = [EventCache[0].msg]
      PageClip = data.clip
      ImageName = data.image
      startPhantom(url)
    } catch(e) {
      client_console('userdata parse error')
    }
  })
}

function init () {
  var content = readPtestConfig()
  if(commander.list){
    var d = Config.ptest_data
    console.log(content)
    return process.exit()
  }

  // if(process.argv.length<3 && !DEBUG_MODE){
  //     console.log('Usage: node server url [configfile.json] ')
  //     return process.exit()
  // }

  var URL = DEFAULT_URL
  if (TEST_FILE)
    playTestFile(TEST_FILE, URL)
  else
    startPhantom(URL)
}
init()


