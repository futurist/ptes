/* 
Copyright @ Michael Yang 
License MIT
*/
'use strict'

var DEBUG_MODE = true
var fs=require("fs")
var mkdirp=require("mkdirp")
var http=require("http")
var path=require("path")
var process=require("process")
var co=require("co")
var imageDiff=require("image-diff")
var _util=require("util_extend_exclude")
var spawn=require("child_process").spawn

var HTTP_HOST = '0.0.0.0'
var HTTP_PORT = 8080
var WS_PORT = 1280

var DATA_DIR = 'test/data/'
mkdirp(DATA_DIR, function(err){
	if(err) return console.log(err);
	copyFileSync('js/ptest-runner.js', 'test/ptest-runner.js')
	copyFileSync('./phantom.config', 'test/data/phantom.config')
	copyFileSync('js/ptest-phantom.js', 'test/data/ptest-phantom.js')
})

var ROUTE = {
	'/'		: 	'/client.html',
}
var MIME = {
	'.js'	:	'application/javascript',
	'.json'	:	'application/json',
	'.css'	:	'text/css',
	'.png'	:	'image/png',
}

function copyFileSync (srcFile, destFile, encoding) {
  var content = fs.readFileSync(srcFile, encoding||'utf8');
  fs.writeFileSync(destFile, content, encoding||'utf8');
}
// helper function
function arrayLast(arr){
	if(arr.length) return arr[arr.length-1]
}

// create Http Server
var HttpServer = http.createServer(function(req,res){
	// console.log( (new Date).toLocaleString(), req.method, req.url )

	if(req.url=='/reload'){
		if(Options.syncReload) reloadPhantom();
		return res.end()
	}

	var filePath = req.url
	filePath = '.' + (ROUTE[filePath] || filePath)

	var ext = path.extname(filePath)
	var contentType = MIME[ext] || 'text/html'

	fs.readFile(filePath, function(err, data) {
		if(err){
			res.statusCode=404
			return res.end()
		}
		res.writeHeader(200, {'Content-Type':contentType})
		res.end(data, 'utf8')
	})
})
HttpServer.listen(HTTP_PORT, HTTP_HOST)

console.log('server started at %s:%s', HTTP_HOST, HTTP_PORT )

var DEFAULT_URL = [
    'http://1111hui.com/nlp/tree.html', 
    'http://1111hui.com/github/ptes/abc.html',
  ].pop()
var EventCache = []
var ViewportCache = []
var PageClip = {}
var Config = { url:DEFAULT_URL, data:{} }
var ImageName = ''
var PlayCount = 0
var RECORDING = false
var Options = {
	syncReload	: true,
	playBackOnInit	: true,
}

function snapShot(name){
	toPhantom({ type:'snapshot', data:DATA_DIR+name })
}
function showDiff(a,b){
	imageDiff({
	  actualImage: DATA_DIR+ (a||'a.png'),
	  expectedImage: DATA_DIR+ (b||'b.png'),
	  diffImage: DATA_DIR+ 'diff_'+b,
	}, function (err, imagesAreSame) {
	  console.log(err, imagesAreSame)
	})
}

function startRec(title){
	if(playBack.status!=STOPPED){
		return client_console('cannot record when in playback')
	}
	Config.unsaved = { name:title, span:Date.now() }
	RECORDING = true
	EventCache = [ { time:Date.now(), msg: arrayLast(ViewportCache) }, { time:Date.now(), msg:{type:'page_clip', data:PageClip} } ]
	// ViewportCache = [  ]
}
function stopRec(){
	RECORDING = false
	var name = +new Date()
	ImageName = name
 
    // var Config = {unsaved:{name:'a;b'}}
    var testPath = Config.unsaved.name
    try{
        mkdirp.sync( DATA_DIR + testPath )
    }catch(e){
        throw e
    }
    snapKeyFrame(testPath)
	var objPath = ['data'].concat(testPath.split('/'))
    Config.unsaved.name = name
    Config.unsaved.span = Date.now() - Config.unsaved.span

    // object path
	var p, a = objPath, b=Config
	if(a.length==1) b[a.shift()] = Config.unsaved
	else while( p=a.shift() ) b[p]=(b[p]||{}), a.length>1? b=b[p] : b=b[p][a.shift()]=Config.unsaved;
	delete Config.unsaved
 
    fs.writeFileSync(DATA_DIR + name + '.json', JSON.stringify({ testPath:testPath, clip:PageClip, event: EventCache }) )
    fs.writeFileSync(DATA_DIR + 'ptest.json', JSON.stringify(Config,null,2) )
}
function snapKeyFrame(testPath){
    var name = path.join(testPath, String(+new Date()) )
    snapShot(name+'.png')
    EventCache.push( { time:Date.now(), msg:_util._extend({}, { type:'snapshot', data:name }) } )
}


// create WS Server
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: WS_PORT })
var WS_CALLBACK = {}
wss.on('connection', function connection(ws) {

    ws._send = function(msg, cb) {
    if(ws.readyState!=1) return;
	if(typeof cb=='function'){
		msg.__id = '_'+Date.now()+Math.random()
		WS_CALLBACK[msg.__id] = cb
	}
    ws.send( typeof msg=='string' ? msg : JSON.stringify(msg) )
  }

  var heartbeat = setInterval(function(){ ws.send('') }, 10000)
  ws._send( {type:'ws', msg:'connected to socket 8080'} )
  console.log('protocolVersion', ws.protocolVersion)

  ws.on('close', function incoming(code, message) {
    console.log("WS close:", ws.name, code, message)
    clearInterval(heartbeat)
    if(ws.name=='client') toPhantom({ type:'client_close', meta:'server', data:'' } );
  })

  ws.on('message', function incoming(message) {
    // console.log('received: %s', message)
    var msg; try{ msg=JSON.parse(message) }catch(e){ msg=message }
    if(typeof msg!=='object') return;

    var relay = function(){
    	if( ws.name==='client' ){
        	RECORDING && EventCache.push( { time:Date.now(), msg:_util._extend({}, msg) } )		// , viewport: arrayLast(ViewportCache)
        	toPhantom(msg)
        } else {
        	toClient(msg)
        }
    }

    switch(msg.type){

      case 'connection':
        ws.name = msg.name
        broadcast({ meta:'clientList', data:clientList() })
	    if(ws.name=='client'){
	    	if(Options.playBackOnInit) playBack.play()
	    }
	    if(ws.name=='phantom'){

	    }

        break

      // command from client.html or phantom
      case 'command':
        if(msg.meta=='server'){
          try{
            msg.result = eval( msg.data )
          }catch(e){
            msg.result = e.stack
          }
          delete msg.data
          msg.type = 'command_result'
          ws._send( msg )
          return
        } else {
	        relay()
        }

        break

      // get callback from ws._call
	  case 'command_result':
		if(msg.__id && msg.meta=='server'){
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
class EventPlayBack{
	constructor(){
		this.status = STOPPED
		this.resume = () => {}
		this.cancel = () => {}
	}

	play(){
		
	}

	pause(){
		this.status = PAUSING
	}

	stop(){
		this.status = STOPPING
	}

}

var playBack = new EventPlayBack()

function clientList(){
  return wss.clients.map((v,i)=>v.name)
}
function findClient(name){
  return wss.clients.find((v,i)=>v.name==name)
}
function toClient(msg, cb){
  var client = findClient('client')
  if(client) client._send(msg, cb)
}
function toPhantom(msg, cb){
  var phantom = findClient('phantom')
  if(phantom) phantom._send(msg, cb)
}
function client_console(){
	var msg = ''
	for(let i=0; i<arguments.length; i++) msg+=arguments[i]+' ';
  	toClient( {type:'client_console', data: (new Date).toLocaleString() + ' [server] '+ msg} )
}

function broadcast(data) {
  wss.clients.forEach(function each(client) {
    data.type='broadcast'
    client._send(data);
  })
}


// Phantom
var phantom

function startPhantom(url){
    phantom = spawn("phantomjs", ['--config', 'phantom.config', "ptest.js", url], {cwd:__dirname, stdio: "pipe" });

    phantom.stdout.setEncoding("utf8");
    phantom.stderr.setEncoding("utf8");
    phantom.stdout.on("data",function (data) {
    	console.log('stdout', data);
    })
    phantom.stderr.on("data",function (data) {
    	console.log('stderr', data);
    })
    phantom.on("exit", function (code) {
    	console.log('exit', code)
    })
    phantom.on("error", function (code) {
    	console.log('error', code);
    })
    console.log('spawn phantom', phantom.pid)
}

function reloadPhantom(){
	toPhantom({ type:'command', meta:'server', data:'page.reload()' } );
}

function stopPhantom(){
	if( phantom && phantom.connected ) phantom.kill()
}




function init(){
    var content = ''
    try{
        content = fs.readFileSync(DATA_DIR+ 'ptest.json', 'utf8')
        Config = JSON.parse( content )
    }catch(e){
        if(e.code!=='ENOENT'){
            console.log(e, 'error parse ptest.json...')
            return process.exit()
        }
    }

    if(process.argv.length<3 && !DEBUG_MODE){
        console.log('Usage: node server url [configfile.json] ')
        return process.exit()
    }
    var URL = process.argv[2] || DEFAULT_URL
    var name = process.argv[3]
    if(name) fs.readFile(DATA_DIR+ name +'.json', 'utf8', (err, data) => {
        if(err){
            console.log('invalid json format', DATA_DIR+ name +'.json' )
            return process.exit();
        }
        try{
            data = JSON.parse(data)
            if(typeof data!='object' || !data) throw Error();
            EventCache = data.event
            ViewportCache = [EventCache[0].msg]
            PageClip = data.clip
            ImageName = data.image
            startPhantom()
        }catch(e){
            client_console('userdata parse error')
        }
    });
    else startPhantom(URL)
}
init()


