window._phantom.hookdate = (function () {
// lib hookDate

var hook = function (store, playBack, cb) {
  if(Date.__hook) {
    throw new Error('Date already hooked, should not hook again')
  }

  var oldDate = Date;
  store = Array.isArray(store) ? store : [];

  lib.oldDate = oldDate;
  lib.dateStore = store;
  lib.playBack = !!playBack;

  var hookDate = function () {
    // called with new
    var pause = lib.pause;
    var playBack = lib.playBack;
    var dateStore = lib.dateStore;
    var calledWithNew = this instanceof hookDate;
    var args = [].slice.call(arguments);
    var emptyArgs = !args.length;
    if(!pause && emptyArgs && playBack) {
      args = dateStore.splice(0,1);
      cb && cb(playBack, args[0]);
    }

    // call new Date
    var instance = new (oldDate.bind.apply(oldDate, [null].concat(args)))();
    // mock constructor
    instance.constructor = oldDate;
    instance.__proto__  = oldDate.prototype;

    if(!pause && emptyArgs && !playBack) {
      var val = instance.getTime();
      dateStore.push(val);
      cb && cb(playBack, val);
    }
    // save the value
    return calledWithNew ? instance : instance.toString()
  };

  // special props
  hookDate.__hook = lib;

  // mock static methods
  // "parse", "UTC", "now", "name", "prototype", "length"
  Object.getOwnPropertyNames(oldDate).forEach(function(k) {
    hookDate[k] = oldDate[k];
  });

  // hook Date.now
  hookDate.now = function () {
    var pause = lib.pause;
    var playBack = lib.playBack;
    var dateStore = lib.dateStore;
    var val = oldDate.now();
    if(!pause) {
      if (playBack) {
        val = dateStore.shift();
      } else {
        dateStore.push(val);
      }
      cb && cb(playBack, val);
    }
    return val
  };

  Date = hookDate;
};

var unhook = function() {
  var handle = Date.__hook;
  if(!handle) return
  if(!handle.oldDate) throw new Error('hookDate: cannot get old Date')
  Date = handle.oldDate;
  return handle
};

var lib = {
  oldDate: null,
  dateStore : [],
  playBack : false,
  hook: hook,
  unhook: unhook,
  pause: false
};

return lib;

}());
