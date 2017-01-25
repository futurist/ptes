'use strict'

// below line will not insert for bare.js rollup config
// import m from 'mithril'

/**
 * @fileOverview Popup toolkit using mithril
 * @name overlay.js
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
  } else if (document.documentElement && document.documentElement.clientHeight) {
    return [document.documentElement.clientWidth, document.documentElement.clientHeight]
  } else if (document.body) {
    return [document.body.clientWidth, document.body.clientHeight]
  }
  return 0
}

var overlay = {
  controller: function (arg) {
    var root = arg.root
    var ctrl = this
    root.classList.add('overlay-root')
    root.style.position = 'fixed'
    root.style.display = 'block'
    root.style.left = 0
    root.style.top = 0
    root.style.zIndex = 99999
    var onresize = function (e) {
      ctrl.width = _getWindowSize()[0]
      ctrl.height = _getWindowSize()[1]
      root.style.width = ctrl.width + 'px'
      root.style.height = ctrl.height + 'px'
      m.redraw()
    }
    window.addEventListener('resize', onresize)
    onresize()
    ctrl.hide = ctrl.close = function (ret) {
      closeOverlay(root, ret)
    }
  },
  view: function (ctrl, arg) {
    var popup = arg.popup
    popup = popup || {}
    popup.style = popup.style || {}

    /* below line for debug purpose */
    // popup.style.border = '1px solid red'

    return [
      m('.overlay-bg',
        {
          config: function (e) {
            ctrl.root = e.parentElement
          },
          style: {
            'display': 'block',
            'height': '100%',
            'width': '100%'

            /* below try to fix IE8 render problem, but not work:(  */
            // backgroundColor: '#000000',
            // filter: 'none !important',
            // filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=50)',
            // filter: 'alpha(opacity=50)',
            // 'zoom':1
          }
        }
       ),
      m('table.overlay',
        {
          style: {
            'position': 'absolute',
            top: 0,
            left: 0,
            // 'z-index': 99999,
            // 'border': 1 + 'px',
            'padding': 0 + 'px',
            'margin': 0 + 'px',
            'width': '100%',
            'height': '100%'
            // using below format to supress error in IE8, rgba color
            // 'background-color': 'rgba(0,0,0,0.5)'
          }
        },
        m('tr',
          m('td',
            {
              'align': 'center',
              'valign': 'middle',
              'style': {
                'position': 'relative'
                // 'vertical-align': 'middle'
              }
            },
            [
              m('div.overlay-content',
                {
                  // onclick: function (e) {
                  //   ctrl.closed = true
                  // },
                  style: popup.style
                },
                popup.com
                ? m.component(popup.com, ctrl)
                : popup.text || m.trust(popup.html)
               )
            ]
           )
         )
       )]
  }
}

function clearRoot (root) {
  m.mount(root, null)
  root.classList.remove('overlay-root')
  root.style.display = 'none'
}

function closeOverlay (root, ret) {
  if (!root) { return }
  root = typeof root === 'string' ? document.querySelector(root) : root.closest('.overlay-root')
  if (root) {
    clearRoot(root)
    var onclose = root.overlayStack.pop()
    if (onclose) { onclose.call(this, ret) }
  }
}
function popupOverlay (root, popup) {
  if (arguments.length == 1) popup = root, root = null
  if (!root) {
    root = document.createElement('div')
    root.className = 'temp-popup'
    document.body.appendChild(root)
  }
  root = typeof root === 'string' ? document.querySelector(root) : root
  if (root) {
    root.overlayStack = root.overlayStack || []
    if (typeof popup.onclose === 'function') root.overlayStack.push(popup.onclose)
    return m.mount(root, m.component(overlay, {root: root, popup: popup}))
  } else {
    throw Error('no root found')
  }
}

// export function
var moverlay = {open: popupOverlay, show: popupOverlay, close: closeOverlay, hide: closeOverlay}

module.exports = moverlay
