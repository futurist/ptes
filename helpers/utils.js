// inject helper functions to window._phantom name space

window._phantom.getXPath = function (element) {
  if(!element) return ''
  if (element.id!=='')
      return 'id("'+element.id+'")'
  if (!element.parentElement)
    return element.tagName
  var ix = 0
  var siblings = element.parentNode.childNodes
  for (var i = 0; i < siblings.length; i++) {
    var sibling = siblings[i]
    if (sibling === element) return window._phantom.getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']'
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++
  }
}

window._phantom.downloadFile = function (url) {
  var xhr = new XMLHttpRequest()
  xhr.responseType = 'blob'
  xhr.onload = function () {
    var reader = new FileReader()
    reader.onloadend = function () {
      // emmit msg to phatom.onCallback function
      window.callPhantom({command: 'download', url: url, data: reader.result})
    }
    reader.readAsDataURL(xhr.response)
  }
  xhr.open('GET', url, true) //async load
  xhr.send()
}
