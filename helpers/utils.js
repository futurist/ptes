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

window._phantom.downloadFile = function (obj) {
  var url = obj.url
  xhrRequest(url, 'GET', null, {
    responseType: 'blob'
  }, function(xhr) {
    var reader = new FileReader()
    reader.onloadend = function () {
      // emmit msg to phatom.onCallback function
      window.callPhantom({
        command: 'download',
        id: obj.id,
        url: url,
        status: 'success',
        data: reader.result
      })
    }
    reader.readAsDataURL(xhr.response)
  }, function (xhr, status) {
    var msg = ''
    switch(status) {
    case 404:
      msg += ('File not found')
      break
    case 500:
      msg += ('Server error')
      break
    case 0:
      msg += ('Request aborted: ' + xhr.statusText)
      break
    default:
      msg += ('Unknown error')
    }
    window.callPhantom({
      command: 'download',
      id: obj.id,
      url: url,
      status: 'fail',
      errorMsg: msg,
      errorCode: status
    })
  })
}


function xhrRequest (url, method, params, props, success, error) {
  error = error || function () {}
  var xhr = new XMLHttpRequest()
  for (var prop in props) {
    xhr[prop] = props[prop]
  }
  xhr.open(method || 'GET', url, true)
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        success(xhr)
      } else {
        error(xhr, xhr.status)
      }
    }
  }
  xhr.onerror = function () {
    error(xhr, xhr.status)
  }
  xhr.send(params)
}
