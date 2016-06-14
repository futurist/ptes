var walk = require('walk')
var fs = require('fs')
var path = require('path')

function sort (a, b) {
  a = a.toLowerCase()
  b = b.toLowerCase()
  if (a > b) return 1
  if (a < b) return -1
  return 0
}

function ensureExt (file, ext) {
  if (path.extname(file) == ext) return file
  else return [file, '.', ext.replace(/\.+/, '')].join('')
}

function getImageArray (folder, test, base) {
  folder = folder||'../../nlp/test/ptest_data/'
  test = test||'test1464943421058'
  if(base) base = path.parse(base).base

  var readDir = function (err, content) {
    // return console.log(content)
    var obj
    try {obj = JSON.parse(content)} catch(e) {return }
    var snaps = obj.event
          .filter(v => v.msg && v.msg.type == 'snapshot')
          .map(v => path.parse(v.msg.data).base)

    if(base) snaps = snaps.filter(v=>v==base)

    walker = walk.walk(path.join(folder, test))
    walker.on('names', function (dir, files, stats) {
      // console.log('sort: ' + files.join(' ; '))
      var ret = snaps.map(v => {
        var obj = {}
        var keys = {
          'a': v,
          'b': v + '_test.png',
          'diff': v + '_diff.png',
          'last': path.parse(v).name + '_last.png',
        }
        for (var x in keys)
          if (files.indexOf(keys[x]) > -1) obj[x] = path.join(test, keys[x])

        return obj
      })
      console.log(ret)
    })
  }

  fs.readFile(path.join(folder, ensureExt(test, '.json')), 'utf8', readDir)
}

module.exports = getImageArray

getImageArray(1,1,'test1464943421058/1464943205970.png')
