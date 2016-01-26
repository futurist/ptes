var path = require('path')
var exec = require('child_process').exec
var imageDiff=require("image-diff")
var ptest = require('./data/ptest.json')

var DATA_DIR = 'data/'

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
		      this.phantom = exec(cmd, {cwd:path.join(__dirname, DATA_DIR)}, function(err, stdout, stderr){
		        // console.log(err, stdout, stderr)
		        if(err) return done(err);
		        var a = obj[v].name +'.png'
		        var b = obj[v].name +'_1.png'
		        imageDiff({
				  actualImage: path.join(__dirname, DATA_DIR, a),
				  expectedImage: path.join(__dirname, DATA_DIR, b),
				  diffImage: path.join(__dirname, DATA_DIR, 'diff_'+b),
				}, function (err, imagesAreSame) {
					err||!imagesAreSame ? done('failed compare ' + b) : done()
				})
		      })
		    })
	  	} else {
	  		describe(v, function(){
	  			iter(obj[v])
	  		})
	  	}
	  })
	}
	iter(ptest.data)
})


