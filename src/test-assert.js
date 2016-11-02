// for assert popup detain info

import cssobj from 'cssobj'
import cssobj_mithril from 'cssobj-mithril'

const style = cssobj({
  '.page':{}
})

const m = cssobj_mithril(style)

const assertPopup = {
  controller: function(arg) {
    var ctrl = this
    ctrl.getResult = function() {
      return m('div', arg.data)
    }
  },
  view: function(ctrl, arg) {
    return m('.test-assert-con', [
      m('menu.top', [
        m('a[href=#]', {onclick: e => arg.onclose && arg.onclose()}, 'close'),
      ]),
      m('.infoBox', ctrl.getResult())
    ])
  }
}

// module.exports = assertPopup
export default assertPopup
