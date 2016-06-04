#!/usr/bin/env node

var process = require('process')
var util = require('util')
var assert = require('assert')
var os = require('os')
var fs = require('fs')
var path = require('path')
var split2 = require('split2')
var spawn = require('child_process').spawn
var imageDiff = require('image-diff')
var pointer = require('json-pointer')
var commander = require('commander')
var pkg = require('../package.json')

var ptest
var testList
var DATA_DIR = 'ptest_data/'
var TEST_FOLDER = DATA_DIR = path.join(DATA_DIR, '.') // remove ending sep(/ or \\)

commander
  .version(pkg.version)
  .option('-d, --dir [testDir]', 'read test data from dir, can be relative', '')
  .option('-l, --list', 'check test folder and list available tests', '')
  .parse(process.argv)

var cmdArgs = (commander.args)

if(commander.list){
  console.log(readPtestConfig())
  process.exit()
}
if(commander.dir){
  TEST_FOLDER = path.join(commander.dir, DATA_DIR)
}
if(cmdArgs.length){
  testList = cmdArgs
}else{
  ptest = readPtestConfig(true)
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
    } else {
      console.log('please run server from folder:', TEST_FOLDER)
    }
    return process.exit()
  }
  return toJSON ? json : content
}

// console.log(TEST_FOLDER + '/ptest.json', ptest)

// colors codes from:
// https://github.com/Marak/colors.js
// https://www.linux.com/learn/docs/man/2752-consolecodes4
// https://en.wikipedia.org/wiki/ANSI_escape_code
var csi = '\033['
var codes = {
  bold: [1, 22],
  underline: [4, 24],
  inverse: [7, 27],

  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  grey: [90, 39],

  clear_screen: csi+'0J', // 0J = clear from cursor to bottom; 2J = entire screen
  clear_line: csi+'2K',
  save: csi+'s',
  restore: csi+'u',
}

function _color (str, code) {
  var _open = []
  var _close = []
  code.split(',').forEach(function (key) {
    var val = codes[key]
    _open.push(csi + val[0] + 'm')
    _close.unshift(csi + val[1] + 'm')
  })
  return _open.join('') + str + _close.join('')
}

// see : http://stackoverflow.com/questions/28874665/node-js-cannot-read-property-defaultencoding-of-undefined
var _putcon = process.stdout.write.bind(process.stdout)  // process.stdout.write
var _repeat = function (str, n) {return new Array(n + 1).join(str) }
var _uplines = function (lines) { return csi + lines + 'A' + codes.clear_screen }
var _output = []
var _prevOutput = ''
var _activeTests = []
var _level = 0
var _beforeEach = null
var _afterEach = null
var _statusColor = {
  'fail': 'red,bold',
  'success': 'green',
  'slow': 'yellow',
  'unknown': 'grey',
}
// console.log('') // start test with newline
function _logStatus (str, level, status) {
  var out = _repeat('  ', level || 0) + _color(str, _statusColor[status || 'unknown']) + os.EOL + codes.clear_line
  _putcon(out)
  return out
}
var _report = function () {
  if (_prevOutput) {
    // _putcon( codes.restore + codes.clear_screen )
    _putcon(_uplines(_prevOutput.split(os.EOL).length-1))
  }
  _prevOutput = ''
  _output.forEach(function (v) {
    _prevOutput += _logStatus(v.msg, v.level, v.status)
  })
}
function afterEach (func) {
  _afterEach = func
}
function describe (msg, func) {
  var _stat = {msg: msg, level: _level}
  _output.push(_stat)
  _report()
  _level++
  var _this = new func()
  _level--
}
function it (msg, func) {
  var indent = '⋅ '
  var _this_level = _level
  var _stat = {msg: indent + msg, level: _this_level}
  func.prototype._timeout = 2000
  func.prototype._slow = 2000
  func.prototype.level = function () {
    return _this_level
  }
  func.prototype.timeout = function (val) {
    this._timeout = val
  }
  func.prototype.slow = function (val) {
    this._slow = val
  }
  func.prototype.submsg = function (val) {
    this._submsg = val
    _stat.msg = indent + msg + val
    _report()
  }
  var callback = function (err) {
    var idx = _activeTests.indexOf(_this)
    if (idx > -1) _activeTests.splice(idx, 1)
    _afterEach && _afterEach.call(_this)
    if (err) {
      _stat.status = 'fail'
      _report()
      clearTest()
      assert(false, err)
      return
    }
    _stat.status = 'success'
    _report()
  }
  _output.push(_stat)
  _report()
  var _this = new func(callback)
  _activeTests.push(_this)
}

function clearTest () {
  _activeTests.forEach(function (v) {
    _afterEach && _afterEach.call(v)
  })
  _activeTests = []
}
process.on('SIGINT', function () { clearTest() })
process.on('exit', function (code) { clearTest() })

// test part
function getPath (file) {
  return path.join(TEST_FOLDER, file)
}
function compareImage (imageID, done) {
  var a = imageID
  var b = imageID + '_test.png'
  var diff = imageID + '_diff.png'
  imageDiff({
    actualImage: getPath(a),
    expectedImage: getPath(b),
    diffImage: getPath(diff),
  }, function (err, imagesAreSame) {
    err || !imagesAreSame ? done('failed compare ' + b) : done()
  })
}

afterEach(function () {
  if (this.phantom) this.phantom.kill(), this.phantom = null
})

// helper function
function arrayLast (arr) {
  if (arr.length) return arr[arr.length - 1]
}

function runTestFile (filename, testname) {
  // if(!path.extname(filename)) filename+='.json'
  var data = fs.readFileSync(path.join(TEST_FOLDER, filename+'.json'), 'utf8')
  try{
    var obj = JSON.parse(data)
  }catch(e){ throw new Error('bad json from file:', filename)}

  var testPath = obj.testPath
  if (typeof testPath == 'string') testPath = pointer.parse('/'+testPath)
  // var name = arrayLast(testPath)
  var name = obj.text || ''
  var url = obj.url || (ptest && ptest.url)
  var span = arrayLast(obj.event).time - obj.event[0].time
  if(!url) return

  it('[' + filename + ']' + name, function (done) {
    var self = this
    this.timeout(span * 2)
    this.slow(span * 1.1)
    // var cmd = 'phantomjs --config=phantom.config ptest-phantom.js '+ ptest.url +' '+obj[v].name
    // console.log(__dirname, cmd)

    var phantom = spawn('phantomjs', [
      '--config',
      path.join('.', 'phantom.config'),
      path.join('.', 'ptest-phantom.js'),
      url,
      filename
    ], {
      cwd: path.join(TEST_FOLDER)
    })

    phantom.stdout.pipe(split2()).on('data', function (line) {
      // console.log('stdout', line)
      if (line[0] === '>') {
        // >{id:12345, type:'type', data:data, cur:1, total:5} format is special!!
        try {
          var msg = JSON.parse(line.substr(1))
          switch (msg.type) {
          case 'compareImage':
            compareImage(msg.data, function (err) {
              self.submsg(util.format('(%s / %s)', msg.cur, msg.total))
              if (err) return done(err)
              if (msg.meta == 'last') return done()
            })
            break
          } } catch(e) {}
      }
    })
    phantom.stderr.on('data', function (data) {
      console.log('stderr', data.toString())
    })
    phantom.on('exit', function (code, signal) {
      // console.log('exit', code, signal)
      // if(!signal) done(code)
    })
    phantom.on('error', function (code) {
      console.log('error', code)
    })
    this.phantom = phantom
  })
}


if(ptest)
  describe('ptest for ' + ptest.url, function () {
    var iter = function (obj) {
      if (typeof obj != 'object' || !obj) return
      Object.keys(obj).forEach(function(v) {
        if (v==='') {
          obj[v].forEach(function(f,i) {
            runTestFile(f)
          })
        } else {
          describe(v, function () {
            iter(obj[v])
          })
        }

      })
    }
    iter(ptest[DATA_DIR])
  })

if(testList)
  describe('ptest for custom test files', function(){
    testList.forEach(function(v) {
      runTestFile(v)
    })
  })
