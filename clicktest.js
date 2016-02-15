var page = require('webpage').create()

page.onConsoleMessage=function(msg){ console.log(msg) }

page.open('about:blank', function  (status) {
  page.evaluate(function(){
    window.onmousedown = function  (e) {
        console.log(e.type, e.timeStamp)
    }
    window.onmouseup = function  (e) {
        console.log(e.type, e.timeStamp)
    }
    window.onclick = function  (e) {
        console.log(e.type, e.timeStamp)
    }
    window.ondblclick = function  (e) {
        console.log(e.type)
    }
    console.log('event ready')
  })
  // page.sendEvent('click', 10, 10, 'left' )

  // ** simulate click event
  // page.sendEvent('mousedown', 10, 10, 'left' )
  // page.sendEvent('mouseup', 10, 10, 'left' )
  
  setTimeout(function(){
    // ** simulate dblclick event
      page.sendEvent('mousedown', 10, 10, 'left' )
      page.sendEvent('mouseup', 10, 10, 'left' )
      page.sendEvent('mousedoubleclick', 10, 10, 'left' )
      page.sendEvent('mouseup', 10, 10, 'left' )
  },30)

})
