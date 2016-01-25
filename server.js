/* 
Copyright @ Michael Yang 
License MIT
*/
'use strict'

var fs=require("fs")
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

var ROUTE = {
	'/'		: 	'/client.html',
}
var MIME = {
	'.js'	:	'application/javascript',
	'.json'	:	'application/json',
	'.css'	:	'text/css',
	'.png'	:	'image/png',
}

// helper function
function arrayLast(arr){
	if(arr.length) return arr[arr.length-1]
}

// create Http Server
var HttpServer = http.createServer(function(req,res){
	// console.log( (new Date).toLocaleString(), req.method, req.url )

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

var EventCache = []
var ViewportCache = []
var PageClip = {}
var TEST_TITLE = ''
var ImageName = ''
var PlayCount = 0
var RECORDING = false
var Options = {
	syncReload	: false,
}

function snapShot(name){
	toPhantom({ type:'snapshot', data:'data/'+name })
}
function showDiff(a,b){
	imageDiff({
	  actualImage: 'data/'+ (a||'a.png'),
	  expectedImage: 'data/'+ (b||'b.png'),
	  diffImage: 'data/diff_'+b,
	}, function (err, imagesAreSame) {
	  console.log(err, imagesAreSame)
	})
}

function startRec(title){
	if(playBack.status!=STOPPED){
		return console_message('cannot record when in playback')
	}
	TEST_TITLE = title
	RECORDING = true
	EventCache = [ { time:Date.now(), msg: arrayLast(ViewportCache) }, { time:Date.now(), msg:{type:'page_clip', data:PageClip} } ]
	// ViewportCache = [  ]
}
function stopRec(){
	RECORDING = false
	var name = +new Date()
	ImageName = name
	snapShot(name+'.png')
	fs.writeFileSync('data/'+ name +'.json', JSON.stringify({ image:name, clip:PageClip, event: EventCache }) )
}
function init(){
	if(process.argv.length<3) return;
	var name = process.argv[2]
	fs.readFile('data/'+ name +'.json', 'utf8', (err, data) => {
		if(err) return;
		try{
			data = JSON.parse(data)
			if(typeof data!='object' || !data) throw Error();
			EventCache = data.event
			ViewportCache = [EventCache[0].msg]
			PageClip = data.clip
			ImageName = data.image
		}catch(e){
			console_message('userdata parse error')
		}
	})
}
init()

// create WS Server
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: WS_PORT })
var WS_CALLBACK = {}
wss.on('connection', function connection(ws) {

  ws.on('close', function incoming(code, message) {
    console.log("WS close:", ws.name, code, message)
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
	    	if(Options.syncReload) reloadPhantom();
	    	playBack.play()
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
        }
        break

      // get callback from ws._call
	  case 'command_result':
		if(msg.__id && msg.meta=='server'){
			var cb = WS_CALLBACK[msg.__id]
			delete WS_CALLBACK[msg.__id]
			cb && cb(msg)
			return
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

  ws._send = function(msg, cb) {
    if(ws.readyState!=1) return;
	if(typeof cb=='function'){
		msg.__id = '_'+Date.now()+Math.random()
		WS_CALLBACK[msg.__id] = cb
	}
    ws.send( typeof msg=='string' ? msg : JSON.stringify(msg) )
  }

  ws._send( {type:'ws', msg:'connected to socket 8080'} )

})

var STOPPED = 0, STOPPING = 1, PAUSING = 2, PAUSED = 4, RUNNING = 8
class EventPlayBack{
	constructor(){
		this.status = STOPPED
		this.resume = () => {}
		this.cancel = () => {}
	}

	play(){
		var self = this
		if( RECORDING ) return console_message('cannot play when recording');
		if(self.status === RUNNING) return;
		if(self.status === PAUSED) return self.resume();
		if(EventCache.length<3)return;
		let prev = EventCache[0]
		let last = arrayLast(EventCache)
		client_console('begin playback, total time:', last.time-prev.time, '(ms)' )
		self.status = RUNNING
		co(function *(){
			// refresh phantom page before play
			yield new Promise(function(ok, error){
				toPhantom({ type:'command', meta:'server', data:'page.reload()' }, function(msg){
					if(msg.result=='success') ok();
					else error();
				})
			})
			for(let i=0, n=EventCache.length; i<n; i++){
				if(self.status===STOPPING) {
					self.cancel()
					self.status = STOPPED
					throw 'stopped'
				}
				if(self.status===PAUSING) {
					yield new Promise( (resolve, reject) => {
						self.status = PAUSED
						self.resume = () => {
							self.status = RUNNING
							self.resume = () => {}
							resolve()
						}
						self.cancel = () => {
							self.status = STOPPED
							self.cancel = () => {}
							reject('canceled')
						}
					})
				}
				let e=EventCache[i]
				let inter = e.time-prev.time
				let result = yield new Promise( (resolve, reject) => {
					setTimeout( () => {
						// client_console(e.time, e.msg.type, e.msg.data)
						toPhantom(e.msg)
						if( /page_clip|scroll|resize/.test(e.msg.type) ) toClient(e.msg);
						else e.viewport && toClient(e.viewport);
						prev = e
						resolve(true)
					}, inter )
				})
			}
			return 'playback complete'
		}).then( (ret) => {
			self.status = STOPPED
			client_console(ret)

			if(!ImageName) return
			// show image diff with original
			PlayCount++
			var name = ImageName+'_'+PlayCount+'.png'
			snapShot(name)
			setTimeout(function(){
				showDiff( ImageName+'.png', name )
			},1000)

		}, (err) => {
			self.status = STOPPED
			client_console('playback incomplete:', err)
		})
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
  	toClient( {type:'console_message', data: (new Date).toLocaleString() + ' [server] '+ msg} )
}

function broadcast(data) {
  wss.clients.forEach(function each(client) {
    data.type='broadcast'
    client._send(data);
  })
}


// Phantom
var phantom
phantom = spawn("phantomjs", ['--config', 'phantom.config', "ptest.js"], {pwd:__dirname, stdio: "pipe" });

phantom.stdout.setEncoding("utf8");
phantom.stderr.setEncoding("utf8");
phantom.stdout.on("data",function (data) {
	console.log('stdout', data);
})
phantom.stderr.on("data",function (data) {
	console.log('stderr', data);
})
phantom.on("close", function (code) {
	console.log('close', code)
})
phantom.on("error", function (code) {
	console.log('error', code);
})
console.log('spawn phantom', phantom.pid)

function reloadPhantom(){
	toPhantom({ type:'command', meta:'server', data:'page.reload()' } );
}

function stopPhantom(){
	if( phantom && phantom.connected ) phantom.kill()
}




