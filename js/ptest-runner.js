var process = require('process')
var assert = require('assert')
var os = require('os')
var fs = require('fs')
var path = require('path')
var split2 = require('split2')
var spawn = require('child_process').spawn
var imageDiff=require("image-diff")


var DATA_DIR = 'ptest_data/'
DATA_DIR = path.join(DATA_DIR, '.') // remove ending sep(/ or \\)
var ptest = require('./' + path.join(DATA_DIR , 'ptest.json'))

console.log(DATA_DIR+'/ptest.json', ptest)

// colors codes from:
// https://github.com/Marak/colors.js
// https://www.linux.com/learn/docs/man/2752-consolecodes4
// https://en.wikipedia.org/wiki/ANSI_escape_code
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

  clear_screen: '\u001b[0J\r',  // 0J = clear from cursor to bottom; 2J = entire screen
  clear_line: '\u001b[2K\r',
  save: '\u001b[s',
  restore: '\u001b[u',
}

function _color(str, code){
  var _open = []
  var _close = []
  code.split(',').forEach(function( key ){
    var val = codes[key]
    _open.push( '\u001b[' + val[0] + 'm' )
    _close.unshift( '\u001b[' + val[1] + 'm' )
  })
  return _open.join('') + str + _close.join('')
}

var _repeat = function(str, n){return new Array(n+1).join(str) }
var _uplines = function(lines){ return '\u001b['+ lines +'A'+ codes.clear_screen }
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
console.log('') //start test with newline
function _logStatus(str, level, status){
  var out = _repeat('  ',level||0) + _color( str, _statusColor[status||'unknown'] )
  console.log( out )
  return out
}
var _report = function(){
    if(_prevOutput){
      // console.log( codes.restore + codes.clear_screen )
      console.log( _uplines( _prevOutput.split(os.EOL).length ) )
    }
    _prevOutput = ''
    _output.forEach(function(v){
        _prevOutput += _logStatus(v.msg, v.level, v.status)+os.EOL
    })
}
function afterEach(func){
    _afterEach = func
}
function describe(msg, func){
    var _stat = {msg:msg, level:_level}
    _output.push(_stat)
    _report()
    _level++
    var _this = new func()
    _level--
}
function it(msg, func){
    var _this_level = _level;
    var _stat = {msg:'⋅ ' + msg, level:_this_level}
    func.prototype._timeout = 2000
    func.prototype._slow = 2000
    func.prototype.timeout = function(val){
        this._timeout = val
    }
    func.prototype.slow = function(val){
        this._slow = val
    }
    var callback = function(err){
        var idx = _activeTests.indexOf(_this)
        if(idx>-1) _activeTests.splice(idx, 1)
        _afterEach && _afterEach.call(_this)
        if(err){
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
function clearTest(){
    _activeTests.forEach(function(v){
        _afterEach && _afterEach.call(v)
    })
    _activeTests = []
}
process.on('SIGINT', function(){ clearTest() })
process.on('exit', function(code){ clearTest() })



// test part
function getPath(file){
    return path.join(__dirname, DATA_DIR, file)
}
function compareImage(imageID, done){
  var a = imageID
  var b = imageID+'_test.png'
  var diff = imageID+'_diff.png'
  imageDiff({
    actualImage: getPath(a),
    expectedImage: getPath(b),
    diffImage: getPath(diff),
    }, function (err, imagesAreSame) {
    err||!imagesAreSame ? done('failed compare ' + b) : done()
  })
}

afterEach(function(){
    if(this.phantom) this.phantom.kill(), this.phantom=null;
})


describe('ptest for '+ptest.url, function () {
  var iter = function(obj){
      if(typeof obj!='object' || !obj) return;
      Object.keys(obj).forEach(function(v){
        if( typeof obj[v]!=='object') return;
        if(obj[v].name && obj[v].span){
            it(v+'['+ obj[v].name +']', function(done){
              this.timeout(obj[v].span*2)
              this.slow(obj[v].span*1.1)
              var cmd = 'phantomjs --config=phantom.config ptest-phantom.js '+ ptest.url +' '+obj[v].name
              // console.log(__dirname, cmd)

              // delete exists test images
              var a = obj[v].name +'.png';
              var b = obj[v].name +'_1.png';
              [getPath(b), getPath('diff_'+b)].forEach(function(v){
                fs.unlink(v, function(err){ 
                    if(err && err.code!=='ENOENT') throw Error('file or folder permission error') 
                })
              })


          var phantom = spawn("phantomjs", ['--config', 'phantom.config', "ptest-phantom.js", ptest.url, obj[v].name], {cwd:path.join(__dirname, DATA_DIR) })

          phantom.stdout.pipe(split2()).on("data",function (line) {
            // console.log('stdout', line)
            if (line[0] === '>') {
              // >{id:12345, type:'type', data:data} format is special!!
              try{
                var msg = JSON.parse(line.substr(1))
                switch(msg.type){
                  case 'compareImage':
                    compareImage( msg.data, function(err){ 
                        if(err) return done(err)
                        if(msg.meta=='last') done()
                    } )
                    break
                }
              }catch(e){}
            }
          })
          phantom.stderr.on("data",function (data) {
            console.log('stderr', data.toString())
          })
          phantom.on("exit", function (code, signal) {
            // console.log('exit', code, signal)
            // if(!signal) done(code)
          })
          phantom.on("error", function (code) {
            console.log('error', code)
          })
          this.phantom = phantom

            })
        } else {
            describe(v, function(){
                iter(obj[v])
            })
        }
      })
    }
  iter(ptest[DATA_DIR])
})


