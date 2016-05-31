/**
 * @fileOverview file for daily js use
 * @name browserutil.js
 * @author micheal.yang
 * @license MIT
 */



/**
 * get browser window size
 * @returns [w,h] windows width and height
 */
function _getWindowSize () {
  if (window.innerWidth) {
    return [window.innerWidth, window.innerHeight]
  }
  else if (document.documentElement && document.documentElement.clientHeight) {
    return [document.documentElement.clientWidth, document.documentElement.clientHeight]
  }
  else if (document.body) {
    return [document.body.clientWidth, document.body.clientHeight]
  }
  return 0
}

function _getDocumentSize () {
  var body = document.body,
      html = document.documentElement
  var width = Math.max(body.scrollWidth, body.offsetWidth,
                       html.clientWidth, html.scrollWidth, html.offsetWidth)
  var height = Math.max(body.scrollHeight, body.offsetHeight,
                        html.clientHeight, html.scrollHeight, html.offsetHeight)
  return [width, height]
}


