
window._phantom.hookdate = (function () {
// lib hookDate
var hook = function (store, playBack) {
  if(Date.__hooked) {
    throw new Error('Date already hooked, should not hook again')
  }

  var oldDate = Date;
  store = Array.isArray(store) ? store : [];

  var hookDate = function () {
    // called with new
    var playBack = lib.playBack;
    var dateStore = lib.dateStore;
    var calledWithNew = this instanceof hookDate;
    var args = [].slice.call(arguments);
    var emptyArgs = !args.length;
    if(emptyArgs && playBack) args = dateStore.splice(0,1);

    // call new Date
    var instance = new (oldDate.bind.apply(oldDate, [null].concat(args)))();
    // mock constructor
    instance.constructor = oldDate;
    instance.__proto__  = oldDate.prototype;

    if(emptyArgs && !playBack) dateStore.push(instance.getTime());
    // save the value
    return calledWithNew ? instance : instance.toString()
  };

  // special props
  lib.oldDate = oldDate;
  lib.dateStore = store;
  lib.playBack = !!playBack;
  hookDate.__hooked = true;

  // mock prototypes
  hookDate.prototype = oldDate.prototype;

  // mock static methods
  if(lib.staticMethods) {
    lib.staticMethods.forEach(function(k) {
      delete hookDate[k];
    });
  }
  lib.staticMethods = [];
  Object.getOwnPropertyNames(oldDate).forEach(function(k) {
    lib.staticMethods.push(k);
    hookDate[k] = oldDate[k];
  });

  // hook Date.now
  hookDate.now = function () {
    var playBack = lib.playBack;
    var dateStore = lib.dateStore;
    var val = oldDate.now();
    if(playBack) val = dateStore.shift();
    else dateStore.push(val);
    return val
  };

  Date = hookDate;
};

var unhook = function() {
  if(!Date.__hooked) return
  if(!lib.oldDate) throw new Error('hookDate: cannot get old Date')
  Date.__hooked = false;
  Date = lib.oldDate;
};

var lib = {
  oldDate: null,
  dateStore : [],
  playBack : false,
  staticMethods: [],
  hook: hook,
  unhook: unhook
};

return lib;

}())
