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
        response: {
          status: status,
          statusText: xhr.statusText,
          headers: getHeaders(xhr)
        },
        data: reader.result
      })
    }
    reader.readAsDataURL(xhr.response)
  }, function (xhr, status) {
    var msg = ''
    switch(true) {
    case (status>=400 && status<500):
      msg += ('File not found')
      break
    case (status>=500 && status<600):
      msg += ('Server error')
      break
    case (status === 0):
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
      response: {
        status: status,
        statusText: xhr.statusText,
        headers: getHeaders(xhr)
      },
      errorMsg: msg,
      errorCode: status
    })
  })
}

function getHeaders(xhr) {
  var arr = xhr.getAllResponseHeaders().split('\r\n')
  return arr.map(function(v) {
    var name = v.split(':', 1).shift()
    var value = v.slice(name.length+1).trim()
    return {
      name: name,
      value: value
    }
  })
}

function xhrRequest (url, method, params, props, success, error) {
  error = error || function () {}
  var xhr = new XMLHttpRequest()
  for (var prop in props) {
    xhr[prop] = props[prop]
  }
  // async==false, to let download ordered
  // but cannot set to blob type...
  xhr.open(method || 'GET', url, true)
  xhr.setRequestHeader('PH-IsDownload', 'true')
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status < 400) {
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
