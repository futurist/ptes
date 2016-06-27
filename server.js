#!/usr/bin/env node

/*
 Copyright @ Michael Yang
 License MIT
 */
'use strict'

var DEBUG_MODE = true
var fs = require('fs')
var atob = require('atob')
var querystring = require('querystring')
var split2 = require('split2')
var mkdirp = require('mkdirp')
var http = require('http')
var url = require('url')
var path = require('path')
var process = require('process')
var co = require('co')
var commander = require('commander')
var imageDiff = require('image-diff')
var _util = require('util_extend_exclude')
var spawn = require('child_process').spawn
var pointer = require('json-pointer')
var pkg = require('./package.json')
var treeHelper = require('./src/tree-helper')
var getImageArray = require('./getImageArray.js')

var DEFAULT_URL = [
  'http://1111hui.com/nlp/tree.html',
  // 'http://1111hui.com/github/ptes/abc.html',
].pop()
var HTTP_HOST = '0.0.0.0'
var HTTP_PORT = 8080
var WS_PORT = 1280
var DATA_DIR = 'ptest_data/'
var TEST_FOLDER = './'
var TEST_FILE = ''              // test_dir/test12345.json

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
if (commander.dir) TEST_FOLDER = commander.dir
if (commander.play) {
  TEST_FILE = commander.play
  // TEST_FILE = path.join(TEST_FOLDER, TEST_FILE)
  // TEST_FILE = path.extname(TEST_FILE) ? TEST_FILE : TEST_FILE + '.json'
}
// console.log(__dirname, __filename, process.cwd(), DEFAULT_URL, TEST_FOLDER, TEST_FILE)

// convert to absolute path
// TEST_FOLDER = path.isAbsolute(TEST_FOLDER) ? TEST_FOLDER : path.join(process.cwd(), TEST_FOLDER)

mkdirp(TEST_FOLDER, function (err) {
  if (err) return console.log(err)
  // copyFileSync(path.join(__dirname, 'js/ptest-runner.js'), path.join(TEST_FOLDER, '../ptest-runner.js'))
  copyFileSync(path.join(__dirname, './phantom.config'), path.join(TEST_FOLDER, 'phantom.config'))
  // copyFileSync(path.join(__dirname, 'js/ptest-phantom.js'), path.join(TEST_FOLDER, 'ptest-phantom.js'))
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

// req.url to match ptest folder
var PTEST_PATH = '/ptestfolder/'

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
      try {
        body = JSON.parse(body)
        writePtestConfig(body)
        res.end(JSON.stringify({error: null}))
      } catch(e) {
        var msg = 'Config data not valid json'
        console.log(msg, body)
        res.end(JSON.stringify({error: msg}))
      }
    })
    return
  }

  if (req.url === '/reload') {
    if (Options.syncReload) reloadPhantom()
    return res.end()
  }

  var ROOT = __dirname
  if(req.url.indexOf(PTEST_PATH)===0){
    ROOT = './'
    req.url = req.url.replace(PTEST_PATH, '/')
  }

  var urlObj = url.parse(req.url,true)
  if (urlObj.pathname === '/testimage' && req.method == 'GET') {
    var folder = urlObj.query.folder
    var test = urlObj.query.test
    var base = urlObj.query.base
    getImageArray(folder, test, base, ret=>{
      res.writeHead(200, 'OK', {'Content-Type': 'application/json'})
      res.end(JSON.stringify(ret))
    })
    return
  }

  var filePath = req.url
  filePath = (ROUTE[filePath] || filePath)

  var ext = path.extname(filePath)
  var contentType = MIME[ext] || 'text/html'

  fs.readFile(path.join(ROOT, filePath), function (err, data) {
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

var stage = null
var EventCache = []
var ViewportCache = []
var PageClip = {}
var Config = {url: DEFAULT_URL}

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
  toPhantom({ type: 'snapshot', data: path.join(TEST_FOLDER, DATA_DIR, name) })
}
function showDiff (a, b) {
  var folder = path.join(TEST_FOLDER, DATA_DIR)
  imageDiff({
    actualImage: path.join(folder, (a || 'a.png')),
    expectedImage: path.join(folder, (b || 'b.png')),
    diffImage: path.join(folder, 'diff_' + b),
  }, function (err, imagesAreSame) {
    console.log(err, imagesAreSame)
  })
}

function startRec (arg, name) {
  if (playBack.status != STOPPED) {
    return client_console('cannot record when in playback')
  }
  try {
    // title is base64+JSON-stringify, so decode it
    arg = JSON.parse(querystring.unescape(atob(arg)))
  } catch(e) { return console.log('startRec: bad argument') }

  DATA_DIR = arg.folder
  var title = arg.path
  var folder = arg.folder
  var url = arg.url

  Config = readPtestConfig(true)

  // return console.log(arg, folder, title, name, Config)

  toPhantom({ type: 'command', meta: 'server', data: 'openPage("'+ url +'")' }, function (msg) {
    if (msg.result === 'success') {
      name = name || 'test' + (+new Date())
      ImageName = name
      Config.unsaved = { name: name, path: title, span: Date.now() }
      RECORDING = true
      EventCache = [ { time: Date.now(), msg: arrayLast(ViewportCache) }, { time: Date.now(), msg: {type: 'page_clip', data: PageClip} } ]
      // ViewportCache = [  ]
    } else {
      client_console('error open page, status', msg)
    }
  })
}

function writePtestConfig (Config) {
  console.log(Config)
  fs.writeFileSync(path.join(TEST_FOLDER , 'ptest.json'), JSON.stringify(Config, null, 2))
}

function readPtestConfig (toJSON) {
  var content = ''
  var json = null
  try {
    content = fs.readFileSync(path.join(TEST_FOLDER, 'ptest.json'), 'utf8')
    json = JSON.parse(content)
  } catch(e) {
    if (e.code !== 'ENOENT') {
      console.log(e, 'error parse ptest.json...')
    }else{
      console.log('please run server from folder:', TEST_FOLDER)
    }
    return process.exit()
  }
  return toJSON?json: content
}

function stopRec () {
  RECORDING = false
  const name = Config.unsaved.name
  // var Config = {unsaved:{path:'a/b'}}
  try {
    mkdirp.sync(path.join(TEST_FOLDER, DATA_DIR, name))
  } catch(e) {
    throw e
  }
  snapKeyFrame(name)

  var testPath = Config.unsaved.path
  delete Config.unsaved.path

  var objPath = pointer.compile(simplePathToStandardPath(Config, testPath, true).concat('-'))

  Config.unsaved.span = Date.now() - Config.unsaved.span

  // // object path
  // var p, a = objPath, b = Config
  // if (a.length == 1) b[a.shift()] = Config.unsaved
  // else while(p = a.shift()) b[p] = (b[p] || {}), a.length > 1 ? b = b[p] : b = b[p][a.shift()] = Config.unsaved
  // delete Config.unsaved

  pointer.set(Config, objPath, {_leaf:true, name:Config.unsaved.name, desc:''})
  delete Config.unsaved

  fs.writeFileSync(path.join(TEST_FOLDER, DATA_DIR, name + '.json'), JSON.stringify({url:DEFAULT_URL, testPath: testPath, clip: PageClip, event: EventCache }))
  writePtestConfig(Config)
  // reloadPhantom()
}

function simplePathToStandardPath(data, path, newIfNotFound) {
  var newPath = []
  path.forEach((p,idx)=>{
    var i = data.findIndex(v=>v.name==p)
    if(newIfNotFound && i===-1){
      data.push({name:p, children:[]})
      newPath.push(data.length-1)
    }else{
      newPath.push(i)
    }
    var d = data.find(v=>v.name==p)
    data=d.children
    newPath.push('children')
  })
  return newPath
}

function snapKeyFrame (testName) {
  var name = path.join(testName, String(+new Date()) + '.png')
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

  var heartbeat = setInterval(function () { ws._send({type:'ping'}) }, 10000)
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
    if (msg.type === 'ping')return

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
      console.log(msg)
      broadcast({ meta: 'clientList', data: clientList() })
      if (ws.name == 'client') {
        if (Options.playBackOnInit || stage === PLAYING) playBack.play()
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
var STOPPED = 0, STOPPING = 1, PAUSING = 2, PAUSED = 4, RUNNING = 8, PLAYING = 16
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
                console.log('msg:snapshot', e.msg.data)
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
      stage = null
    }, (err) => {
      self.status = STOPPED
      client_console('playback incomplete:', err)
      stage = null
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

var runner
function runTestFile(filenames) {
  filenames = filenames||[]
  runner = spawn('node', [path.join(__dirname, 'js', 'ptest-runner.js')].concat(filenames), {cwd: process.cwd()})
  console.log(process.cwd(), typeof filenames, filenames)
  runner.stdout.pipe(split2()).on('data', function (line) {
    console.log('----'+line+'----')
    var ret = JSON.parse(line)
    // var filenames = ret.filter(v=>v.test).map(v=>v.test)
    toClient({type:'test_output', data: ret})
  })
  runner.stderr.pipe(split2()).on('data', function (line) {
    console.log('runner stderr', line)
    toClient({type:'test_error', data: line})
  })
}

// runTestFile(['test1465218312129', 'test1465218335247'])
// eval("runTestFile([1459850842156]) ")

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

function getTestRoot(filename) {
  var found = treeHelper.deepFindKV(Config, v=>v['name']==filename, 1).pop()
  return found ? Config[found.path[0]] : null
}

function playTestFile (filename, url) {
  var root = getTestRoot(filename)
  if(!root) return
  DATA_DIR = root.folder
  if (!path.extname(filename)) filename += '.json'
  fs.readFile(path.join(TEST_FOLDER, DATA_DIR, filename), 'utf8', (err, data) => {
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
      stage = PLAYING
      if (!phantom) {
        startPhantom(url)
      } else {
        playBack.play()
      }
    } catch(e) {
      client_console('userdata parse error')
    }
  })
}

function init () {
  Config = readPtestConfig(true)
  if (commander.list) {
    console.log(JSON.stringify(Config))
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


//
// Clear function
function clearTest () {
  if(phantom) phantom.kill()
}

process.on('SIGINT', function () {
  clearTest()
  process.exit()
})
process.on('exit', function (code) { clearTest() })
