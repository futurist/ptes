/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /*
	                                                                                                                                                                                                                                                   Copyright @ Michael Yang
	                                                                                                                                                                                                                                                   License MIT
	                                                                                                                                                                                                                                                   */

	var _mtree = __webpack_require__(1);

	var _mtree2 = _interopRequireDefault(_mtree);

	var _reporter = __webpack_require__(5);

	var _reporter2 = _interopRequireDefault(_reporter);

	var _testImage = __webpack_require__(11);

	var _testImage2 = _interopRequireDefault(_testImage);

	var _testAssert = __webpack_require__(12);

	var _testAssert2 = _interopRequireDefault(_testAssert);

	var _overlay = __webpack_require__(13);

	var _overlay2 = _interopRequireDefault(_overlay);

	var _objutil = __webpack_require__(14);

	var _objutil2 = _interopRequireDefault(_objutil);

	var _jsonPointer = __webpack_require__(15);

	var _jsonPointer2 = _interopRequireDefault(_jsonPointer);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	window.pointer = _jsonPointer2.default;

	var RECORDING = 'STAGE_RECORDING',
	    PLAYING = 'STAGE_PLAYING',
	    CLIPPING = 'STAGE_CLIPPING',
	    SETUP = 128,
	    REPORTER = 256,
	    IMAGEVIEW = 512;
	var INVALID_NAME = '<>:"\\|?*'; // '<>:"/\\|?*'
	var INVALID_NAME_REGEXP = new RegExp('[' + INVALID_NAME.replace('\\', '\\\\') + ']', 'g');
	var MODIFIER = {
	  shift: 0x02000000,
	  ctrl: 0x04000000,
	  alt: 0x08000000,
	  meta: 0x10000000,
	  keypad: 0x20000000
	};

	var STOPPED = 0,
	    STOPPING = 1,
	    PAUSING = 2,
	    PAUSED = 4,
	    RUNNING = 8;

	var currentName = '';
	var currentPath = '';
	var keyframeCount = 0;
	var intervalTitle = 0;
	var PageClip = {};
	var clipDrag = m_drag({});
	var stage = null;
	var playbackStatus = STOPPED;
	window.stage = function () {
	  return stage;
	};

	var startClip = clipDrag('clip', function (e, data, root) {
	  if (stage != CLIPPING) return;
	  PageClip.top = data.oy;
	  PageClip.left = data.ox;
	  PageClip.width = -data.dx;
	  PageClip.height = -data.dy;
	  applyPageClip();
	}, function (e, data) {
	  if (stage != CLIPPING) return;
	  console.log(PageClip);
	  ws._send({ type: 'page_clip', data: PageClip });
	  stage = null;
	});

	function applyPageClip() {
	  $('#clipArea').show().css({ top: PageClip.top + 'px', left: PageClip.left + 'px', width: PageClip.width + 'px', height: PageClip.height + 'px' });
	}

	$('#phantom').on('mousedown', startClip);

	var ws = new WebSocket('ws://' + window.location.hostname + ':1280');
	ws.onopen = function (e) {
	  ws.onmessage = function (message) {
	    var msg = void 0;
	    try {
	      msg = JSON.parse(message.data);
	    } catch (e) {
	      msg = message.data;
	    }
	    if ((typeof msg === 'undefined' ? 'undefined' : _typeof(msg)) != 'object' || !msg) return;

	    switch (msg.type) {
	      case 'broadcast':

	        break;
	      case 'playback':
	        playbackStatus = msg.data;
	        console.log('playbackStatus', msg.data);
	        stage = !msg.data || msg.data === STOPPED ? null : PLAYING;
	        if (stage) {
	          flashTitle(msg.data === RUNNING ? 'PLAYING' : 'PAUSED', true);
	        } else {
	          clearTitle();
	          alert('Play back complete');
	        }

	        break;
	      case 'page_clip':
	        PageClip = msg.data;
	        applyPageClip();

	        break;
	      case 'command':
	        try {
	          msg.result = eval(msg.data);
	        } catch (e) {
	          msg.result = e.stack;
	        }
	        delete msg.data;
	        msg.type = 'command_result';
	        ws._send(msg);

	        break;
	      case 'client_error':
	        console.error(msg.data.msg, JSON.stringify(msg.data.stack));

	        break;
	      case 'client_console':
	        console.log(msg.data);

	        break;
	      case 'test_output':
	        // case 'test_error':
	        console.log(msg.data);
	        stage = REPORTER;
	        _overlay2.default.show('#reporter', { com: m.component(_reporter2.default, {
	            data: msg.data,
	            onmsg: function onmsg(msg) {
	              stage = IMAGEVIEW;
	              _overlay2.default.show('#testimage', { com: m.component(msg.type == 'assert' ? _testAssert2.default : _testImage2.default, { data: msg.error, onclose: function onclose() {
	                    stage = REPORTER;
	                    _overlay2.default.hide('#testimage');
	                  } }) });
	            },
	            onclose: function onclose() {
	              stage = SETUP;
	              _overlay2.default.hide('#reporter');
	            }
	          }) });

	        break;
	      case 'command_result':
	        if (msg.__id) {
	          var cb = WS_CALLBACK[msg.__id];
	          delete WS_CALLBACK[msg.__id];
	          cb && cb(msg);
	        }

	        break;
	      case 'window_resize':
	      case 'window_scroll':
	        $(window).scrollLeft(msg.data.scrollX);
	        $(window).scrollTop(msg.data.scrollY);
	        $(window).width(msg.data.width);
	        $(window).height(msg.data.height);

	        break;
	      case 'render':
	        $('.imgCon').width(msg.meta.size.width).height(msg.meta.size.height);
	        $('.screenshot').attr('src', 'data:image/png;base64,' + msg.data);
	        // FIXME: phantom don't have scrollbar but browser's scrollbar will reduce window size
	        // if( msg.meta.count==0 ) $(window).trigger('resize')
	        break;

	      default:

	        break;
	    }
	  };
	  ws.onclose = function (code, reason, bClean) {
	    console.log('ws error: ', code, reason);
	  };

	  var heartbeat = setInterval(function () {
	    ws._send({ type: 'ping' });
	  }, 10000);
	  ws._send({ type: 'connection', meta: 'server', name: 'client' });
	};

	var WS_CALLBACK = {};
	ws._send = function (msg, cb) {
	  if (ws.readyState != 1) return;
	  if (typeof cb == 'function') {
	    msg.__id = '_' + Date.now() + Math.random();
	    WS_CALLBACK[msg.__id] = cb;
	  }
	  ws.send(typeof msg == 'string' ? msg : JSON.stringify(msg));
	};
	ws._send_debounce = util_debounce_throttle._debounce(ws._send, 30);
	ws._send_throttle = util_debounce_throttle._throttle(ws._send, 30, true);
	ws._send_throttle2 = util_debounce_throttle._throttle(ws._send, 30, false);

	function sc(str, cb) {
	  cb = cb || function (msg) {
	    if (msg.result !== undefined) console.log(msg.result);
	  };
	  ws._send({ type: 'command', meta: 'server', data: str }, cb);
	}
	function cc(str, isPhantom, cb) {
	  cb = cb || function (msg) {
	    if (msg.result !== undefined) console.log(msg.result);
	  };
	  ws._send({ type: 'command', meta: isPhantom ? 'phantom' : 'client', data: str }, cb);
	}
	function assert(str, type) {
	  var args = [].slice.call(arguments, 2);
	  var cb = function cb(msg) {
	    chai.assert[type].apply(null, [msg.result].concat(args));
	  };
	  ws._send({ type: 'command', meta: 'client', data: str, assert: { type: type, args: args } }, cb);
	}

	window.assert = assert;
	window.sc = sc;
	window.cc = cc;

	function startStopRec(e, arg) {
	  if (e) e.preventDefault();
	  arg = arg || {};
	  var title = arg.path;
	  if (stage == null) {
	    if (!title) while (1) {
	      title = currentPath = window.prompt('which title', currentPath) || '';
	      if (!title) return;
	      if (INVALID_NAME_REGEXP.test(title)) alert('path name cannot contain ' + INVALID_NAME);else if (/\/$/.test(title)) alert('cannot end of /');else {
	        // title is string of json: ['a','b']
	        arg.path = title = JSON.stringify(title.split('/'));
	        break;
	      }
	    } else currentPath = title;
	    // document.title = 'recording...'+title
	    flashTitle('RECORDING');
	    currentName = 'test' + +new Date();
	    sc(' startRec("' + btoa(encodeURIComponent(JSON.stringify(arg))) + '", "' + currentName + '") ');
	    stage = RECORDING;
	  } else if (stage == RECORDING) {
	    return saveRec(null, true);
	  }
	}

	function saveRec(e, save, slient) {
	  if (e) e.preventDefault();
	  if (!slient && !confirm('Confirm ' + (save ? 'save' : '!!!not!!! save') + ' current record:' + currentPath)) return false;
	  sc(' stopRec(' + !!save + ') ');
	  clearTitle();
	  keyframeCount = 0;
	  showSetup();
	  return true;
	}

	var oncloseSetup = function oncloseSetup(arg) {
	  var path = JSON.stringify(arg.path);
	  if (arg.action == 'add') {
	    arg.retain = true;
	    _overlay2.default.show({
	      com: {
	        controller: function controller() {
	          this.captureMode = 'mouse';
	        },
	        view: function view(ctrl, overlay) {
	          return m('div', {}, [m('', 'will test: ' + path + '@' + arg.folder), m('div.option', [m('span', 'input capture method: '), m('select', {
	            oninput: function oninput(e) {
	              ctrl.captureMode = $(this).val();
	            }
	          }, ['mouse', 'xpath'].map(function (v) {
	            return m('option', v);
	          }))]), m('div.option', [m('span', 'cache include blob: '), m('input', {
	            oninput: function oninput(e) {
	              ctrl.cacheInclude = this.value;
	            }
	          })]), m('div.option', [m('span', 'cache exclude blob: '), m('input', {
	            oninput: function oninput(e) {
	              ctrl.cacheExclude = this.value;
	            }
	          })]), m('button', {
	            onclick: function onclick(e) {
	              overlay.hide();
	              hideSetup();
	              _objutil2.default.assign(arg, ctrl);
	              startStopRec(null, arg);
	            }
	          }, 'ok'), m('button', {
	            onclick: function onclick() {
	              overlay.hide();
	            }
	          }, 'cancel')]);
	        }
	      }
	    });
	    // if(confirm('Confirm to begin record new test for path:\n\n    ' + path+'\n    '+ arg.folder))
	    //   startStopRec(null, aprg)
	  }
	  if (arg.action == 'play') {
	    stage = PLAYING;
	    sc(' playTestFile("' + arg.file + '", "' + arg.url + '") ');
	    setTimeout(function (arg) {
	      // window.reload()
	    });
	  }
	  if (arg.action == 'view') {
	    var folder = arg.folder;
	    var _test = arg.file;
	    var a = arg.a;

	    stage = IMAGEVIEW;
	    _overlay2.default.show('#testimage', { com: m.component(_testImage2.default, {
	        data: { folder: folder, test: _test, a: a },
	        onclose: function onclose() {
	          stage = SETUP;
	          _overlay2.default.hide('#testimage');
	        }
	      }) });
	  }
	  if (arg.action == 'testAll') {
	    stage = REPORTER;
	    sc(' runTestFile() ');
	  }
	  if (arg.action == 'test') {
	    stage = REPORTER;
	    sc(' runTestFile(' + JSON.stringify(arg.file) + ') ');
	  }
	  if (!arg.retain) hideSetup();
	};

	function hideSetup(arg) {
	  _overlay2.default.hide('#overlay');
	  $(window).trigger('resize');
	  stage = null;
	}

	function showSetup(arg) {
	  if (stage == RECORDING && !startStopRec()) return;
	  stage = SETUP;
	  _overlay2.default.show('#overlay', { com: m.component(_mtree2.default, { url: '/config', onclose: oncloseSetup }) });
	}

	// mOverlay.show('#reporter', {com: m.component(reporter, {})})
	// mOverlay.show('#testimage', {com: m.component(testImage, {})})

	//
	// setup keyboard event

	function registerEvent() {
	  Mousetrap.bind('ctrl+p', function (e) {
	    e.preventDefault();
	  });
	  Mousetrap.bind('f4', function (e) {
	    e.preventDefault();
	    if (stage > SETUP) return;
	    if (stage === SETUP) {
	      hideSetup();
	    } else {
	      showSetup();
	    }
	  });
	  Mousetrap.bind('space', function (e) {
	    if (stage !== PLAYING) return;
	    e.preventDefault();
	    sc(' playBack.playPause() ');
	  });
	  Mousetrap.bind('f5', function (e) {
	    if (stage !== null) return;
	    e.preventDefault();
	    sc(' reloadPhantom() ');
	  });
	  Mousetrap.bind('ctrl+a', function (e) {
	    e.preventDefault();
	    if (stage !== null) return;
	    stage = CLIPPING;
	  });
	  Mousetrap.bind('f8', function (e) {
	    e.preventDefault();
	    e.stopPropagation();
	    e.stopImmediatePropagation();
	    if (!currentPath || stage !== RECORDING) return;
	    sc(' snapKeyFrame("' + currentName + '") ');
	    keyframeCount++;
	  });
	  Mousetrap.bind('ctrl+r', function (e) {
	    if (e) e.preventDefault();
	    if (stage !== RECORDING) return;
	    saveRec(e, false);
	  });

	  $(window).on('resize', function (e) {
	    var data = { scrollX: window.scrollX, scrollY: window.scrollY, width: $(window).width(), height: $(window).height() };
	    ws._send({ type: 'window_resize', data: data });
	  });
	  $(window).trigger('resize');

	  $(window).on('scroll', function (e) {
	    var data = { scrollX: window.scrollX, scrollY: window.scrollY, width: $(window).width(), height: $(window).height() };
	    ws._send({ type: 'window_scroll', data: data });
	  });
	  $(window).trigger('scroll');

	  var eventList = ['keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove'];

	  // 'click',
	  // 'dblclick',
	  eventList.forEach(function (v) {
	    $(document).on(v, function (evt) {
	      if (stage !== RECORDING && stage !== null) return;
	      var e = evt.originalEvent;
	      if (e.defaultPrevented) {
	        return; // Should do nothing if the key event was already consumed.
	      }
	      var isKey = /key/.test(e.type);
	      if (isKey && ['F12'].indexOf(e.key) < 0) e.preventDefault();
	      // if (!isKey && e.target.id!=='phantom') return
	      var modifier = 0;
	      if (e.shiftKey) modifier |= MODIFIER.shift;
	      if (e.altKey) modifier |= MODIFIER.alt;
	      if (e.ctrlKey) modifier |= MODIFIER.ctrl;
	      if (e.metaKey) modifier |= MODIFIER.meta;
	      var evtData = { type: e.type, which: e.which, modifier: modifier };
	      if (isKey) {
	        evtData.keyName = e.key || e.keyIdentifier;
	        // console.log(e,  e.key||e.keyIdentifier, modifier )
	        if (modifier === 0 && evtData.keyName === 'F8') return;
	      } else {
	        evtData.pageX = e.pageX; // -window.scrollX
	        evtData.pageY = e.pageY; // -window.scrollY
	      }
	      // if(evtData.type=='mousemove') ws._send_throttle({ type:'event_mouse', data:evtData })
	      // else ws._send({ type:'event_mouse', data:evtData })
	      ws._send({ type: isKey ? 'event_key' : 'event_mouse', data: evtData });
	    });
	  });
	}

	var _repeat = function _repeat(str, n) {
	  return new Array(n + 1).join(str);
	};

	function clearTitle(str) {
	  clearInterval(intervalTitle);
	  document.title = 'ptest';
	  stage = null;
	}
	function flashTitle(str, isStatic) {
	  clearInterval(intervalTitle);
	  var t = 0;
	  var flash = function flash() {
	    var tt = _repeat('+', keyframeCount);
	    if (isStatic) tt += str + '...';else tt += t++ % 2 ? str + '...' : 'ptest...';
	    document.title = tt;
	  };
	  intervalTitle = setInterval(flash, 1000);
	  flash();
	}

	$(function () {
	  registerEvent();
	  document.body.focus();
	});

	window.onunload = function () {
	  // $.ajax({ type:'GET', url: window.location.protocol+ '//'+ window.location.host + '/reload', async:false })
	  sc(' reloadPhantom() ');
	};

	var testText = 'this is the mithril com test';
	var test = {
	  controller: function controller() {},
	  view: function view(ctrl) {
	    return m('.abc', {
	      onclick: function onclick(e) {
	        var target = e.target || event.srcElement;
	        _overlay2.default.hide(target);
	      }
	    }, testText);
	  }
	};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var _undoManager = __webpack_require__(2);

	var _undoManager2 = _interopRequireDefault(_undoManager);

	var _treeHelper = __webpack_require__(4);

	var _treeHelper2 = _interopRequireDefault(_treeHelper);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/**
	 * DATA format:
	 * node -> {
	 text             {string}  displayed text for html
	 name             {string}  name for node, if no text, used as text
	 class            {string}  className for node
	 // font          {string}  the font color
	 _static          {boolean} whether folder expand on mousemove
	 _close           {boolean} true : folder close, false : folder open
	 _edit            {boolean} true  : node text edit status, false : node text display status
	 _leaf [auto]     {boolean} true  : Leaf node, false : Trunk node
	 _path [readOnly] {string}  object path from root
	 _idx  [readOnly] {number}  index in parent node
	 children         {array}   node type of children; null denotes _leaf node
	 }
	 */
	// var data = require('./data.js')
	// window.data = data

	// using webpack inline style, but not for lib
	// var css = require('../css/mtree.stylus')

	var css = {};

	var INVALID_NAME = '<>:"\\|?*\/'; // '<>:"/\\|?*'
	var INVALID_NAME_REGEXP = new RegExp('[' + INVALID_NAME.replace('\\', '\\\\') + ']', 'g');
	var isValidName = function isValidName(name, v) {
	  return name !== '' && !INVALID_NAME_REGEXP.test(name);
	};
	var showInvalidMsg = function showInvalidMsg(v) {
	  v._invalid = true;
	  alert('invalid text, cannot contain: ' + INVALID_NAME);
	};

	//
	// ========================================
	// Helper Function
	// ========================================

	// better type check
	var type = {}.toString;
	var OBJECT = '[object Object]';
	var ARRAY = '[object Array]';

	// disable right click
	window.oncontextmenu = function () {
	  return false;
	};

	/**
	 * Array get last element
	 */
	if (!Array.prototype.last) {
	  Array.prototype.last = function () {
	    return this[this.length - 1];
	  };
	}

	function getLeaf(node, f) {
	  if (node._leaf) return [node];else if (!node.children) return [];else return _treeHelper2.default.deepFindKV(node.children, function (v) {
	    return v._leaf == true;
	  });
	}
	function cleanData(data, store) {
	  store = store || [];
	  data.forEach(function (v, i) {
	    if (v && (typeof v === 'undefined' ? 'undefined' : _typeof(v)) == 'object') {
	      (function () {
	        var d = {};
	        store.push(d);
	        Object.keys(v).forEach(function (k) {
	          if (['_leaf'].indexOf(k) > -1 || k[0] !== '_' && k !== 'children') d[k] = v[k];
	        });
	        if (v.children && Array.isArray(v.children)) {
	          d.children = [];
	          cleanData(v.children, d.children);
	        }
	      })();
	    }
	  });
	  return store;
	}

	/**
	 * isInputactive - check whether user is editing
	 * @returns {boolean}
	 */
	function isInputActive(el) {
	  return (/input|textarea/i.test((el || document.activeElement).tagName)
	  );
	}

	/**
	 * detectleftbutton - detect if the left and only the left mouse button is pressed
	 * @param {} evt - event object to check, e.g. onmousemove
	 * @returns {boolean}
	 */
	function detectLeftButton(evt) {
	  evt = evt || window.event;
	  if ('buttons' in evt) {
	    return evt.buttons == 1;
	  }
	  var button = evt.which || evt.button;
	  return button == 1;
	}

	function detectRightButton(e) {
	  var rightclick;
	  if (!e) var e = window.event;
	  if (e.which) rightclick = e.which == 3;else if (e.button) rightclick = e.button == 2;
	  return rightclick;
	}

	function _clone(dest) {
	  return JSON.parse(JSON.stringify(dest));
	}

	var com = {
	  //
	  // controller
	  controller: function controller(args) {
	    var ctrl = this;
	    var data = args.data || [];
	    var result = {};
	    if (args.url) {
	      m.request({ method: 'GET', url: args.url }).then(function (ret) {
	        result = ret;

	        // data = result.map(v => {
	        //   v.children = convertSimpleData(v.ptest_data, (k, path)=>({desc:''}))
	        //   delete v.ptest_data
	        //   return v
	        // })

	        window.data = data = result;
	        console.log(data);
	        m.redraw();
	      });
	    }

	    var getRootVar = function getRootVar(path, key) {
	      return result[path[0]][key];
	    };

	    /**
	     * selected =>{
	     node {object} selected node object
	     idx {number} index at parent node
	     parent {object} parent object, or null if it's root
	     }
	     */
	    var selected = data.length ? { node: data[0], idx: 0, parent: null } : null;
	    // move or copy target node
	    var target = null;
	    // undoList array for manage undo
	    var undoList = [];
	    var addToUndo = function addToUndo(f) {
	      undoList.push(f);
	      return f;
	    };
	    var undoManager = new _undoManager2.default();
	    var undoRedo = function undoRedo(redo, undo) {
	      undoManager.add({ redo: redo, undo: undo });
	      return redo;
	    };
	    var redoList = [];
	    var addToRedo = function addToRedo(f) {
	      redoList.push(f);
	      return f;
	    };
	    // Mouse guesture store array
	    var mouseGuesture = [];

	    /**
	     * Extend tree object, ignore _, text, children attr
	     * If there's already has className in src, merge className by SPC
	     * @param {} dest - new node to merged to, from src
	     * @param {} src - tree object
	     * @returns {} dest
	     */
	    function _extend(dest, src) {
	      Object.keys(src).filter(function (k) {
	        return k[0] !== '_' && ['text', 'children'].indexOf(k) < 0;
	      }).forEach(function (k) {
	        /class|className/.test(k) ? (dest[k] = dest[k] || '', dest[k] += ' ' + src[k]) : dest[k] = src[k];
	      });
	      return dest;
	    }

	    function isValidTree(arg) {
	      if (_treeHelper2.default.deepFindKV(data, function (v) {
	        return v._edit;
	      }, 1).length) {
	        alert('Cannot proceed when in edit status');
	        return false;
	      }
	      return true;
	    }

	    function oneAction(obj) {
	      return m('a[href=#]', { class: 'action', onmousedown: function onmousedown(e) {
	          e.stopPropagation();
	          e.preventDefault();
	          if (!isValidTree()) return;
	          if (obj.save) saveConfig(true, function (err, ret) {
	            args.onclose(obj);
	          });else args.onclose(obj);
	        } }, obj.text || obj.action);
	    }

	    function getAction(v) {
	      if (!args.onclose) return;
	      var node = [];
	      var emptyNode = !v.children || v.children.length == 0;
	      var leafNode = !emptyNode && v.children && v.children[0]._leaf;
	      // if (!leafNode && !emptyNode) return node
	      var path = _treeHelper2.default.getArrayPath(data, v._path).texts;
	      var folder = getRootVar(v._path, 'folder');
	      var url = getRootVar(v._path, 'url');
	      if (!v._leaf) {
	        node.push({ action: 'add', text: 'Add', _path: v._path, path: path, folder: folder, save: true, url: url }, { action: 'test', text: 'Test', _path: v._path, path: path, file: getLeaf(v).map(function (x) {
	            return x.item.name;
	          }), folder: folder, retain: true, url: url });
	      } else {
	        node.push({ action: 'play', text: 'Play', _path: v._path, path: path, file: v.name, folder: folder, url: url }, { action: 'test', text: 'Test', _path: v._path, path: path, file: [v.name], folder: folder, url: url, retain: true }, { action: 'view', text: 'View', _path: v._path, path: path, file: v.name, folder: folder, retain: true });
	      }
	      return node.map(oneAction);
	    }

	    function getText(v, path) {
	      var text = [m('span', v.desc || '')];
	      if (isRoot(v)) text.push(m('em', '[' + v.folder + ']@' + v.url));
	      var node = v.name ? [m('span.name', '[', m(isRoot(v) ? 'strong' : 'span', v.name), ']'), getAction(v), m('br'), text] : [text, getAction(v)];
	      return node;
	    }

	    /**
	     * Generate right class name from node attr
	     * e.g. selected if it's selected node
	      * @param {} tree node
	     * @returns {string} generated class name
	     */
	    function getClass(node) {
	      var c = ' ';
	      c += selected && selected.node === node ? (css.selected || 'selected') + ' ' : '';
	      c += ' ';
	      c += target && target.node === node ? css[target.type] || target.type : '';
	      return c;
	    }

	    /**
	     * get common path from 2 nodes
	     * @param {} tree node1
	     * @param {} tree node2
	     * @returns {string} path of the common part
	     */
	    function getCommonPath(node1, node2) {
	      var path1 = node1._path,
	          path2 = node2._path,
	          r = [];
	      for (var i = 0, n = path1.length; i < n; i++) {
	        if (path1[i] === path2[i]) r.push(path1[i]);
	      }
	      return r;
	    }

	    /**
	     * delete node of parent in idx
	     * @param {object} parent node
	     * @param {} idx
	     */
	    function deleteNode(parent, idx) {
	      if (!parent || !parent._path) {
	        var oldData = data[idx];
	        undoRedo(function () {
	          data.splice(idx, 1);
	        }, function () {
	          data.splice(idx, 0, oldData);
	        })();
	        return;
	      }

	      var arr = parent.children = parent.children || [];
	      var oldStack = [];
	      undoRedo(function () {
	        oldStack.push(arr[idx], arr, parent._close);
	        arr.splice(idx, 1);
	        // if it's no child, remove +/- symbol in parent
	        if (parent && !arr.length) delete parent.children, delete parent._close;
	      }, function () {
	        parent._close = oldStack.pop();
	        parent.children = oldStack.pop();
	        parent.children.splice(idx, 0, oldStack.pop());
	      })();
	    }
	    function insertNode(node, parent, _idx, isAfter) {
	      return addNode(parent || data, _idx, isAfter, node);
	    }
	    function insertChildNode(node, v, isLast) {
	      return addChildNode(v, isLast, v._leaf, node);
	    }
	    function addNode(parent, _idx, isAfter, existsNode) {
	      var idx = isAfter ? _idx + 1 : _idx;
	      if (!parent || !parent._path) {
	        var newNode = { name: '', url: '', folder: 'ptest_data', _edit: true };
	        undoRedo(function () {
	          data.splice(idx, 0, newNode);
	        }, function () {
	          data.splice(idx, 1);
	        })();
	        return;
	      }
	      var arr = parent.children = parent.children || [];
	      var insert = existsNode || { name: '', desc: '', _edit: true };
	      undoRedo(function () {
	        arr.splice(idx, 0, insert);
	        selected = { node: arr[idx], idx: idx, parent: parent };
	      }, function () {
	        // cannot rely on stored index, coze it maybe changed, recalc again
	        var idx = parent.children.indexOf(insert);
	        parent.children.splice(idx, 1);
	      })();
	      return selected;
	    }
	    function addChildNode(v, isLast, isLeaf, existsNode) {
	      if (v._leaf) return;
	      v.children = v.children || [];
	      var arr = v.children;
	      var idx = isLast ? v.children.length : 0;
	      var insert = existsNode || { name: '', desc: '', _edit: true };
	      v._close = false;
	      if (isLeaf) insert._leaf = true;
	      var selected = {};
	      undoRedo(function () {
	        v.children = arr;
	        v.children.splice(idx, 0, insert);
	        selected.node = v.children[idx];
	        selected.idx = idx;
	        selected.parent = v;
	      }, function () {
	        // cannot rely on stored index, coze it maybe changed, recalc again
	        var idx = arr.indexOf(insert);
	        arr.splice(idx, 1);
	        if (!v.children.length) delete v.children, delete v._close;
	      })();
	      return selected;
	    }

	    function invalidInput(v) {
	      if (!v.name) return v._invalid = 'name';
	      if ('folder' in v && !v.folder) return v._invalid = 'folder';
	      if ('url' in v && !v.url) return v._invalid = 'url';
	      delete v._invalid;
	      return '';
	    }
	    function getInput(v) {
	      if (v._leaf) {
	        return [v.name ? m('div', v.name) : [], m('textarea', {
	          config: function config(el) {
	            return el.focus();
	          },
	          oninput: function oninput(e) {
	            v.desc = this.value;
	            // if (isValidName(this.value)) v.desc = this.value
	            // else showInvalidMsg(v)
	          },
	          onkeydown: function onkeydown(e) {
	            if (e.keyCode == 13 && e.ctrlKey) {
	              if (invalidInput(v)) return alert(v._invalid + ' cannot be empty');
	              return v._edit = false;
	            }
	            if (e.keyCode == 27) {
	              undoManager.undo();
	              v._edit = false;
	              m.redraw();
	            }
	          }
	        }, v.desc || '')];
	      } else {
	        return Object.keys(v).filter(function (k) {
	          return k[0] !== '_' && k !== 'children';
	        }).map(function (k) {
	          return m('.editline', [m('span', k), m('input', {
	            // config: el => { el.focus() },
	            value: v[k] || '',
	            oninput: function oninput(e) {
	              v[k] = this.value;
	            },
	            onkeydown: function onkeydown(e) {
	              if (e.keyCode == 13) {
	                if (invalidInput(v)) return alert(v._invalid + ' cannot be empty');
	                return v._edit = false;
	              }
	              if (e.keyCode == 27) {
	                undoManager.undo();
	                v._edit = false;
	                m.redraw();
	              }
	            }
	          })]);
	        });
	      }
	    }

	    function isRoot(node) {
	      return node._path.length < 2;
	    }
	    /**
	     * interTree interate tree node for children
	     * @param {array} arr - children node array, usually from data.children
	     * @param {object} parent - parent node
	     * @param {array} path - object path array
	     * @returns {object} mithril dom object, it's ul tag object
	     */
	    function interTree(data, path) {
	      path = path || [];
	      var arr = path.length == 0 ? data : data.children;
	      return !arr ? [] : {
	        tag: 'ul', attrs: {}, children: arr.map(function (v, idx) {
	          v._path = path.concat(idx);
	          v = typeof v == 'string' ? { name: v, desc: '' } : v;
	          if ({}.toString.call(v) != '[object Object]') return v;
	          return {
	            tag: 'li',
	            attrs: _extend({
	              'class': getClass(v),
	              config: function config(el, old, context) {},
	              onmouseup: function onmouseup(e) {},
	              onmousedown: function onmousedown(e) {
	                if (!e) e = window.event;
	                e.stopPropagation();
	                selected = { node: v, idx: idx, parent: data };

	                // save parent _pos when select node
	                if (path.length) data._pos = idx;

	                if (isInputActive(e.target)) return;else if (v._edit && !v._invalid) {}
	                // v._edit = false
	                // return


	                // Right then Right, do move/copy action
	                if (detectRightButton(e)) addGuesture('right');
	                if (mouseGuesture.join(',') === 'right,right') {
	                  clearGuesture(e);
	                  doMoveCopy(e);
	                }

	                // buttons=Left+Right, button=Right, Left and Right
	                if (e.buttons == 3 && e.button == 2) {
	                  clearGuesture(e);
	                  doCopy(e);
	                }

	                // buttons=Left+Right, button=Left, Right and Left
	                if (e.buttons == 3 && e.button == 0) {
	                  clearGuesture(e);
	                  doMove(e);
	                }

	                e.preventDefault();
	                var isDown = e.type == 'mousedown';
	                // add node
	                if (isDown && e.ctrlKey) {
	                  // add node before selected
	                  if (e.altKey) addChildNode(v);
	                  // add child node as first child
	                  else addNode(data, idx);
	                  return;
	                }
	                // remove node
	                if (isDown && e.altKey) {
	                  deleteNode(data, idx);
	                  return;
	                }
	                // else if(v._edit) return v._edit = false
	                // close / open node
	                if (!v._static && v.children) v._close = e.type == 'mousemove' ? false : !v._close;
	              },
	              onmousemove: function onmousemove(e) {
	                if (!detectLeftButton(e)) return;
	                this.onmousedown(e);
	              },
	              // dbl click to edit
	              ondblclick: function ondblclick(e) {
	                e.stopPropagation();
	                v._edit = true;
	                var oldVal = {};
	                Object.keys(v).filter(function (k) {
	                  return k[0] !== '_' && k !== 'children';
	                }).forEach(function (k) {
	                  return oldVal[k] = v[k];
	                });
	                undoRedo(function () {}, function () {
	                  setTimeout(function (_) {
	                    Object.assign(v, oldVal);
	                    v._edit = false;
	                    m.redraw();
	                  });
	                })();
	              }
	            }, v),
	            children: [v.children ? m('a.switch', v._close ? '+ ' : '- ') : [], v._edit ? getInput(v, path) : m(v._leaf ? 'pre.leaf' : 'span.node', [getText(v, path)])].concat(v._close ? [] : interTree(v, path.concat(idx)))
	          };
	        })
	      };
	    }

	    function saveConfig(silent, callback) {
	      if (!isValidTree()) return;
	      var d = cleanData(data);
	      m.request({ method: 'POST', url: '/config', data: d }).then(function (ret) {
	        if (!ret.error) {
	          if (!silent) alert('Save success.');
	          if (callback) callback(null, ret);
	        }
	      }, function (e) {
	        alert('save failed!!!!' + e.message);
	        if (callback) callback(e);
	      });
	    }

	    function getMenu(items) {
	      return items.map(function (v) {
	        return m('a.button[href=#]', {
	          onclick: function onclick(e) {
	            e.preventDefault();
	            v.action();
	          }
	        }, v.text);
	      });
	    }
	    ctrl.getDom = function (_) {
	      return [m('.menu', [getMenu([{ text: 'Save', action: function action() {
	          saveConfig();
	        } }]),
	      // {text:'TestAll', action:()=>{saveConfig()} },
	      oneAction({ action: 'testAll', text: 'TestAll', retain: true })]), interTree(data)];
	    };
	    ctrl.onunload = function (e) {
	      for (var k in keyMap) {
	        Mousetrap.unbind(k);
	      }
	    };

	    //
	    // Mousetrap definition
	    function toggleNodeOpen(e, key) {
	      var sel = selected;
	      e.preventDefault();
	      if (sel && sel.node.children) {
	        sel.node._close = !sel.node._close;
	        m.redraw();
	      }
	    }
	    function keyMoveLevel(e, key) {
	      var child,
	          sel = selected,
	          newIdx,
	          newParent,
	          oldNode;
	      if (sel) {
	        e.preventDefault();
	        newParent = sel.parent;
	        child = sel.node.children;
	        if (/left/.test(key) && newParent) {
	          newParent._pos = sel.idx;
	          sel.node = newParent;
	          sel.idx = newParent._path.last();
	          // _path is data[0][2]... if there's only data[0], then it's first root, parent is null
	          sel.parent = newParent._path.length > 1 ? _treeHelper2.default.getArrayPath(data, newParent._path.slice(0, -1)).obj : null;
	          m.redraw();
	        }
	        if (/right/.test(key) && child && child.length) {
	          // save sel.node ref first to as parent
	          var _oldNode = sel.node;
	          var pos = _oldNode._pos || 0;
	          sel.node = child[pos];
	          sel.node._path = _oldNode._path.concat(pos);
	          sel.idx = pos;
	          sel.parent = _oldNode;
	          if (_oldNode._close) _oldNode._close = false;
	          m.redraw();
	        }
	      }
	    }
	    function keyMoveSibling(e, key) {
	      var child,
	          sel = selected,
	          newIdx;

	      var moveSibling = function moveSibling(isMove) {
	        if (isMove) {
	          ;
	          var _ref = [child[sel.idx], child[newIdx]];
	          child[newIdx] = _ref[0];
	          child[sel.idx] = _ref[1];
	        }sel.node = child[newIdx];
	        sel.idx = newIdx;
	        m.redraw();
	      };

	      if (sel) {
	        e.preventDefault();
	        if (!sel.parent) child = data;else child = sel.parent.children;
	        if (child.length) {
	          if (/down$/.test(key)) {
	            if (sel.idx + 1 < child.length) {
	              newIdx = sel.idx + 1;
	            } else {
	              newIdx = 0;
	            }
	            moveSibling(/ctrl/.test(key));
	          }
	          if (/up$/.test(key)) {
	            if (sel.idx - 1 >= 0) {
	              newIdx = sel.idx - 1;
	            } else {
	              newIdx = child.length - 1;
	            }
	            moveSibling(/ctrl/.test(key));
	          }
	        }
	      }
	    }
	    function doDelete(e) {
	      deleteNode(selected.parent, selected.idx);
	      m.redraw();
	    }
	    function doAddChildLeaf(e) {
	      addChildNode(selected.node, true, true);
	      m.redraw();
	    }
	    function doAddChildTrunk(e) {
	      addChildNode(selected.node, true);
	      m.redraw();
	    }
	    function doAddNode(e) {
	      addNode(selected.parent, selected.idx, true);
	      m.redraw();
	    }
	    function doRedo(e) {
	      if (isInputActive()) return;
	      undoManager.redo();
	      // var redo = redoList.pop()
	      // if(redo) redo()
	      m.redraw(true);
	    }
	    function doUndo(e) {
	      if (isInputActive()) return;
	      undoManager.undo();
	      // var undo = undoList.pop()
	      // if (undo) undo()
	      m.redraw(true);
	    }
	    function doMove(e) {
	      if (!selected || !selected.parent) return;
	      target = Object.assign({ type: 'moving' }, selected);
	      m.redraw();
	    }

	    function doCopy(e) {
	      if (!selected || !selected.parent) return;
	      target = Object.assign({ type: 'copying' }, selected);
	      m.redraw();
	    }
	    function doMoveCopy(e) {
	      var isChild = !e.shiftKey;
	      if (!target || !selected) return;
	      if (selected.node === target.node) return;
	      if (selected.node._leaf) return;
	      if (selected.node._path.length && selected.node._path[0] != target.node._path[0]) {
	        return alert('Cannot move test between pages!');
	      }
	      if (target.type) {
	        var insert = _clone(target.node);
	        if (isChild) {
	          selected = insertChildNode(insert, selected.node); // insert as first child
	        } else {
	            selected = insertNode(insert, selected.parent, selected.idx);
	          }
	        var sameLevel = selected.parent == target.parent;
	        // fix index if target is same level
	        if (sameLevel && selected.idx < target.idx) target.idx++;

	        if (target.type == 'moving') {
	          deleteNode(target.parent, target.idx);
	          target = null;
	        }
	        var g = undoManager.group(2);
	        window.undo = undoManager;
	      }
	      m.redraw();
	    }

	    function addGuesture(action) {
	      mouseGuesture.push(action);
	      setTimeout(function () {
	        clearGuesture();
	      }, 800);
	    }

	    function clearGuesture(e) {
	      mouseGuesture = [];
	    }

	    var keyMap = {
	      'space': toggleNodeOpen,
	      'left': keyMoveLevel,
	      'right': keyMoveLevel,
	      'up': keyMoveSibling,
	      'down': keyMoveSibling,
	      'ctrl+up': keyMoveSibling,
	      'ctrl+down': keyMoveSibling,
	      'esc': clearGuesture,
	      'del': doDelete,
	      'ctrl+enter': doAddChildLeaf,
	      'shift+enter': doAddChildTrunk,
	      'enter': doAddNode,
	      'ctrl+y': doRedo,
	      'ctrl+z': doUndo,
	      'ctrl+c': doCopy,
	      'ctrl+x': doMove,
	      'ctrl+shift+v': doMoveCopy,
	      'ctrl+v': doMoveCopy
	    };

	    for (var k in keyMap) {
	      Mousetrap.bind(k, keyMap[k]);
	    }
	  },

	  //
	  // view
	  view: function view(ctrl) {
	    return m('.' + (css.mtree || 'mtree'), ctrl.getDom());
	  }
	};

	exports.default = com;


	var testRoot = document.querySelector('#mtree');
	if (testRoot) m.mount(testRoot, m.component(com, { data: data }));

	// below line will remove -webkit-user-select:none
	// which cause phantomjs input cannot be selected!!!!!
	if (window._phantom) document.body.className = 'phantom';

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;"use strict";

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	/*
	Simple Javascript undo and redo.
	https://github.com/ArthurClemens/Javascript-Undo-Manager
	*/

	;(function () {

	    'use strict';

	    function removeFromTo(array, from, to) {
	        array.splice(from, !to || 1 + to - from + (!(to < 0 ^ from >= 0) && (to < 0 || -1) * array.length));
	        return array.length;
	    }

	    var UndoManager = function UndoManager() {

	        var commands = [],
	            index = -1,
	            groupIndex = 0,
	            limit = 0,
	            isExecuting = false,
	            callback,


	        // functions
	        execute;

	        execute = function execute(command, action) {
	            if (!command || typeof command[action] !== "function") {
	                return this;
	            }
	            isExecuting = true;

	            command[action]();

	            isExecuting = false;
	            return this;
	        };

	        return {

	            /*
	            Add a command to the queue.
	            */
	            add: function add(command) {
	                if (isExecuting) {
	                    return this;
	                }
	                // if we are here after having called undo,
	                // invalidate items higher on the stack
	                commands.splice(index + 1, commands.length - index);

	                commands.push(command);

	                // if limit is set, remove items from the start
	                if (limit && commands.length > limit) {
	                    removeFromTo(commands, 0, -(limit + 1));
	                }

	                // set the current index to the end
	                index = commands.length - 1;
	                if (callback) {
	                    callback();
	                }
	                return this;
	            },

	            /*
	            Pass a function to be called on undo and redo actions.
	            */
	            setCallback: function setCallback(callbackFunc) {
	                callback = callbackFunc;
	            },

	            /*
	            Perform undo: call the undo function at the current index and decrease the index by 1.
	            */
	            undo: function undo() {
	                var command = commands[index];
	                if (!command) {
	                    return this;
	                }
	                var g = command.group;
	                while (command.group === g) {
	                    execute(command, "undo");
	                    index -= 1;
	                    command = commands[index];
	                    if (!command || !command.group) break;
	                }
	                if (callback) {
	                    callback();
	                }
	                return this;
	            },

	            /*
	            Perform redo: call the redo function at the next index and increase the index by 1.
	            */
	            redo: function redo() {
	                var command = commands[index + 1];
	                if (!command) {
	                    return this;
	                }
	                var g = command.group;
	                while (command.group === g) {
	                    execute(command, "redo");
	                    index += 1;
	                    command = commands[index + 1];
	                    if (!command || !command.group) break;
	                }
	                if (callback) {
	                    callback();
	                }
	                return this;
	            },

	            group: function group(step, idx) {
	                if (!step) return groupIndex;
	                idx = idx || index;
	                if (step < 1) step = 1;
	                groupIndex += 1;
	                while (step-- && idx - step >= 0) {
	                    commands[idx - step].group = groupIndex;
	                }return groupIndex;
	            },

	            /*
	            Clears the memory, losing all stored states. Reset the index.
	            */
	            clear: function clear() {
	                var prev_size = commands.length;

	                commands = [];
	                index = -1;
	                groupIndex = 0;

	                if (callback && prev_size > 0) {
	                    callback();
	                }
	            },

	            hasUndo: function hasUndo() {
	                return index !== -1;
	            },

	            hasRedo: function hasRedo() {
	                return index < commands.length - 1;
	            },

	            getCommands: function getCommands() {
	                return commands;
	            },

	            getIndex: function getIndex() {
	                return index;
	            },

	            getGroup: function getGroup(g) {
	                var G = [];
	                for (var i = 0, len = commands.length; i < len; i++) {
	                    if (commands[i].group === g) G.push({ index: i, command: commands[i] });
	                }
	                return G;
	            },

	            setLimit: function setLimit(l) {
	                limit = l;
	            }
	        };
	    };

	    if ("function" === 'function' && _typeof(__webpack_require__(3)) === 'object' && __webpack_require__(3)) {
	        // AMD. Register as an anonymous module.
	        !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	            return UndoManager;
	        }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof module !== 'undefined' && module.exports) {
	        module.exports = UndoManager;
	    } else {
	        window.UndoManager = UndoManager;
	    }
	})();

/***/ },
/* 3 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	/**
	 * @fileOverview
	 * @name tree-helper.js
	 * @author yumji
	 * @license MIT
	 * @desc Helper for the standard tree format.
	 * All the var data is for standard tree json format.
	 * All the var d is for the simple tree json format.
	 */

	// better type check
	var type = {}.toString;
	var OBJECT = '[object Object]';
	var ARRAY = '[object Array]';

	/**
	 * Search standard tree data, with key,val match
	 * @param {} data
	 * @param {} key
	 * @param {} val
	 * @returns {}
	 */
	function deepFindKV(data, f, howMany, path, found) {
	  var i = 0,
	      path = path || [],
	      found = found || [],
	      howMany = howMany | 0;
	  for (; i < data.length; i++) {
	    if (f(data[i])) {
	      found.push({ path: path.concat(i), item: data[i] });
	      if (howMany-- < 1) break;
	    }
	    if (data[i].children) {
	      deepFindKV(data[i].children, f, howMany, path.concat(i), found);
	    }
	  }
	  return found;
	}

	/**
	 * getArraypath - get object using path array, from data object
	 * @param {object} data - root data object
	 *                       if array, get index as target
	 *                       if object, get index of object.children as target
	 * @param {array} path - path to obtain using index array [0,1,0]
	 * @returns {object} target object at path
	 */
	function getArrayPath(data, path) {
	  var obj = data;
	  var texts = [];
	  for (var i = 0; i < path.length; i++) {
	    obj = type.call(obj) === ARRAY ? obj[path[i]] : obj && obj.children && obj.children[path[i]];
	    texts.push(obj.name);
	  }
	  return { obj: obj, texts: texts };
	}

	/**
	 * convert simple Object into tree data
	 *
	 format:
	 {"a":{"b":{"c":{"":["leaf 1"]}}},"abc":123, e:[2,3,4], f:null}
	 *        1. every key is folder node
	 *        2. "":[] is leaf node
	 *        3. except leaf node, array value will return as is
	 *        4. {abc:123} is shortcut for {abc:{"": [123]}}
	 *
	 * @param {object} d - simple object data
	 * @param {function} [prop] - function(key,val){} to return {object} to merge into current
	 * @param {array} [path] - array path represent root to parent
	 * @returns {object} tree data object
	 */
	function convertSimpleData(d, prop, path) {
	  path = path || [];
	  if (!d || (typeof d === 'undefined' ? 'undefined' : _typeof(d)) !== 'object') {
	    // {abc:123} is shortcut for {abc:{"": [123]}}
	    return [Object.assign({ name: d, _leaf: true }, prop && prop(d, path))];
	  }
	  if (type.call(d) === ARRAY) {
	    return d;
	    // return d.map(function (v, i) {
	    //   return convertSimpleData(v, prop, path.concat(i))
	    // })
	  }
	  if (type.call(d) === OBJECT) {
	    var node = [];
	    for (var k in d) {
	      if (k === '' && type.call(d[k]) === ARRAY) {
	        node.push.apply(node, d[k].map(function (v, i) {
	          return type.call(v) === OBJECT ? v : Object.assign({ name: v, _leaf: true }, prop && prop(v, path.concat(['', i])));
	        }));
	      } else {
	        node.push(Object.assign({ name: k, children: convertSimpleData(d[k], prop, path.concat('' + k)) }, prop && prop(k, path)));
	      }
	    }
	    return node;
	  }
	  return [];
	}

	// module exports
	module.exports = {
	  fromSimple: convertSimpleData,
	  getArrayPath: getArrayPath,
	  deepFindKV: deepFindKV
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _cssobj = __webpack_require__(6);

	var _cssobj2 = _interopRequireDefault(_cssobj);

	var _cssobjMithril = __webpack_require__(7);

	var _cssobjMithril2 = _interopRequireDefault(_cssobjMithril);

	var _format = __webpack_require__(10);

	var _format2 = _interopRequireDefault(_format);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var style = {
	  '.runner-result': {
	    text_align: 'left'
	  },
	  'menu.top': {
	    background: '#ccc'
	  },
	  '.reporter': {
	    margin_left: '2em'
	  },
	  '.item': {
	    line_height: '1.5em',
	    color: 'grey'
	  },
	  '.success': {
	    color: 'green'
	  },
	  '.fail': {
	    color: 'red'
	  },
	  '.footer': {
	    color: 'grey',
	    margin_top: '1em',
	    margin_bottom: '3em',
	    margin_left: '1.5em',
	    '.finished': {
	      color: 'blue'
	    }
	  },
	  '.button': {
	    margin_left: '1em'
	  },
	  '.testItem': {
	    '&:before': {
	      content: "'-'",
	      color: 'grey'
	    },
	    'span, a': {
	      margin_left: '10px'
	    }
	  }
	}; /**
	    * @fileOverview Render html view from ptest-runner reporter
	    * @requires ptest-runner output JSON format file/response
	    * @name ptest-resu@lt.js
	    * @author Micheal Yang
	    * @license MIT
	    */

	var result = (0, _cssobj2.default)(style, { local: true });

	var m = (0, _cssobjMithril2.default)(result);

	var footer = {
	  controller: function controller(arg) {
	    this.total = arg.total.length;
	    this.success = arg.success.length;
	    this.fail = arg.fail.length;
	    this.getClass = function () {
	      return arg.result;
	    };
	  },
	  view: function view(ctrl, arg) {
	    return m('.footerContent', { class: ctrl.getClass() }, [(0, _format2.default)('total:%s, success:%s, fail:%s', ctrl.total, ctrl.success, ctrl.fail), arg.result ? m('a.button[href=#]', { onclick: function onclick(e) {
	        return arg.onclose && arg.onclose();
	      } }, 'close') : []]);
	  }
	};

	var testItem = {
	  view: function view(ctrl, arg) {
	    return m('.testItem', [m('span', arg.test.msg), m('span', arg.test.submsg || ''), m('span', arg.test.status || '?'), arg.test.error ? m('a[href=#]', { onclick: function onclick() {
	        arg.onmsg && arg.onmsg(arg.test);
	      } }, 'detail') : []]);
	  }
	};

	var reporter = {
	  controller: function controller(arg) {
	    this.data = arg.data || testdata;
	    this.result = this.data.length && this.data[0].result;
	  },
	  view: function view(ctrl, arg) {
	    return m('.runner-result', [ctrl.result ? m('menu.top', [m('a[href=#]', { onclick: function onclick(e) {
	        return arg.onclose && arg.onclose();
	      } }, 'close')]) : [], m('h3', { style: { margin: '1em 0 0 1em' } }, 'Result for ptest-runner'), m('.reporter', ctrl.data.map(function (v, i) {
	      return m('.item', {
	        class: result.mapClass(v.status),
	        style: {
	          marginLeft: v.level * 1 + 'em'
	        }
	      }, v.test ? m(testItem, Object.assign({}, arg, { test: v })) : m('strong', v.msg + (v.result ? ' ' + v.result : '')));
	    })), m('.footer', m(footer, Object.assign({}, arg, {
	      result: ctrl.data[0].result,
	      total: ctrl.data.filter(function (v) {
	        return v.test;
	      }),
	      success: ctrl.data.filter(function (v) {
	        return v.status == 'success';
	      }),
	      fail: ctrl.data.filter(function (v) {
	        return v.status == 'fail';
	      })
	    })))]);
	  }
	};

	var testdata = [{ 'msg': 'ptest for custom test files', 'submsg': '', 'level': 0 }, { 'msg': '[test1465218312129]', 'submsg': '(1 / 1)', 'test': 'test1465218312129', 'level': 1, 'status': 'success' }, { 'msg': '[test1465218335247]', 'submsg': '(1 / 1)', 'test': 'test1465218335247', 'level': 1, "error": { "test": "test1465218335247", "folder": "ptest_data", "a": "test1465218335247/1465218058523.png", "b": "test1465218335247/1465218058523.png_test.png", "diff": "test1465218335247/1465218058523.png_diff.png" }, 'status': 'fail' }, { 'msg': '[test1465218335247]', 'submsg': '(1 / 1)', 'test': 'test1465218335247', 'level': 1 }];

	// module.exports = reporter

	exports.default = reporter;

	//
	// helper functions

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	// helper functions for cssobj

	// set default option (not deeply)
	function defaults(options, defaultOption) {
	  options = options || {}
	  for (var i in defaultOption) {
	    if (!(i in options)) options[i] = defaultOption[i]
	  }
	  return options
	}

	// convert js prop into css prop (dashified)
	function dashify(str) {
	  return str.replace(/[A-Z]/g, function(m) {
	    return '-' + m.toLowerCase()
	  })
	}

	// capitalize str
	function capitalize (str) {
	  return str.charAt(0).toUpperCase() + str.substr(1)
	}

	// random string, should used across all cssobj plugins
	var random = (function () {
	  var count = 0
	  return function () {
	    count++
	    return '_' + Math.floor(Math.random() * Math.pow(2, 32)).toString(36) + count + '_'
	  }
	})()

	// extend obj from source, if it's no key in obj, create one
	function extendObj (obj, key, source) {
	  obj[key] = obj[key] || {}
	  for (var k in source) obj[key][k] = source[k]
	  return obj[key]
	}

	// ensure obj[k] as array, then push v into it
	function arrayKV (obj, k, v, reverse, unique) {
	  obj[k] = k in obj ? [].concat(obj[k]) : []
	  if(unique && obj[k].indexOf(v)>-1) return
	  reverse ? obj[k].unshift(v) : obj[k].push(v)
	}

	// replace find in str, with rep function result
	function strSugar (str, find, rep) {
	  return str.replace(
	    new RegExp('\\\\?(' + find + ')', 'g'),
	    function (m, z) {
	      return m == z ? rep(z) : z
	    }
	  )
	}

	// get parents array from node (when it's passed the test)
	function getParents (node, test, key, childrenKey, parentKey) {
	  var p = node, path = []
	  while(p) {
	    if (test(p)) {
	      if(childrenKey) path.forEach(function(v) {
	        arrayKV(p, childrenKey, v, false, true)
	      })
	      if(path[0] && parentKey){
	        path[0][parentKey] = p
	      }
	      path.unshift(p)
	    }
	    p = p.parent
	  }
	  return path.map(function(p){return key?p[key]:p })
	}

	// split selector etc. aware of css attributes
	function splitComma (str) {
	  for (var c, i = 0, n = 0, prev = 0, d = []; c = str.charAt(i); i++) {
	    if (c == '(' || c == '[') n++
	    if (c == ')' || c == ']') n--
	    if (!n && c == ',') d.push(str.substring(prev, i)), prev = i + 1
	  }
	  return d.concat(str.substring(prev))
	}

	// checking for valid css value
	function isValidCSSValue (val) {
	  // falsy: '', NaN, Infinity, [], {}
	  return typeof val=='string' && val || typeof val=='number' && isFinite(val)
	}

	// using var as iteral to help optimize
	var KEY_ID = '$id'
	var KEY_ORDER = '$order'
	var KEY_TEST = '$test'

	var TYPE_GROUP = 'group'

	// helper function
	var keys = Object.keys

	// type check helpers
	var type = {}.toString
	var ARRAY = type.call([])
	var OBJECT = type.call({})

	// only array, object now treated as iterable
	function isIterable (v) {
	  return type.call(v) == OBJECT || type.call(v) == ARRAY
	}

	// regexp constants
	// @page rule: CSSOM:
	//   IE returned: not implemented error
	//   FF, Chrome actually is not groupRule(not cssRules), same as @font-face rule
	//   https://developer.mozilla.org/en-US/docs/Web/API/CSSGroupingRule
	//   CSSPageRule is listed as derived from CSSGroupingRule, but not implemented yet.
	//   Here added @page as GroupRule, but plugin should take care of this.
	var reGroupRule = /^@(media|document|supports|page|keyframes)/i
	var reAtRule = /^\s*@/i

	/**
	 * convert simple Object into node data
	 *
	 input data format:
	 {"a":{"b":{"c":{"":[{color:1}]}}}, "abc":123, '@import':[2,3,4], '@media (min-width:320px)':{ d:{ok:1} }}
	 *        1. every key is folder node
	 *        2. "":[{rule1}, {rule2}] will split into several rules
	 *        3. & will replaced by parent, \\& will escape
	 *        4. all prop should be in dom.style camelCase
	 *
	 * @param {object|array} d - simple object data, or array
	 * @param {object} result - the reulst object to store options and root node
	 * @param {object} [previousNode] - also act as parent for next node
	 * @param {boolean} init whether it's the root call
	 * @returns {object} node data object
	 */
	function parseObj (d, result, node, init) {
	  if (init) {
	    result.nodes = []
	    result.ref = {}
	    if (node) result.diff = {}
	  }

	  node = node || {}

	  node.obj = d

	  if (type.call(d) == ARRAY) {
	    var nodes = []
	    for(var i = 0; i < d.length; i++) {
	      var prev = node[i]
	      var n = parseObj(d[i], result, node[i] || {parent: node, src: d, parentNode: nodes, index: i})
	      if(result.diff && prev!=n) arrayKV(result.diff, n ? 'added' : 'removed', n||prev)
	      nodes.push(n)
	    }
	    return nodes
	  }
	  if (type.call(d) == OBJECT) {
	    var prevVal = node.prevVal = node.lastVal
	    // at first stage check $test
	    if (KEY_TEST in d) {
	      var test = typeof d[KEY_TEST] == 'function' ? d[KEY_TEST](!node.disabled, node, result) : d[KEY_TEST]
	      // if test false, remove node completely
	      // if it's return function, going to stage 2 where all prop rendered
	      if(!test) {
	        return
	      }
	      node.test = test
	    }
	    var children = node.children = node.children || {}
	    node.lastVal = {}
	    node.rawVal = {}
	    node.prop = {}
	    node.diff = {}
	    if (d[KEY_ID]) result.ref[d[KEY_ID]] = node
	    var order = d[KEY_ORDER] | 0
	    var funcArr = []

	    var processObj = function (obj, k, nodeObj) {
	      var haveOldChild = k in children
	      var newNode = extendObj(children, k, nodeObj)
	      // don't overwrite selPart for previous node
	      newNode.selPart = newNode.selPart || splitComma(k)
	      var n = parseObj(obj, result, newNode)
	      if(n) children[k] = n
	      // it's new added node
	      if (prevVal) !haveOldChild
	        ? n && arrayKV(result.diff, 'added', n)
	        : !n && arrayKV(result.diff, 'removed', children[k])
	      // for first time check, remove from parent (no diff)
	      if(!n) delete nodeObj.parent.children[k]
	    }

	    // only there's no selText, getSel
	    if(!('selText' in node)) getSel(node, result)

	    for (var k in d) {
	      // here $key start with $ is special
	      // k.charAt(0) == '$' ... but the core will calc it into node.
	      // Plugins should take $ with care and mark as a special case. e.g. ignore it
	      if (!d.hasOwnProperty(k)) continue
	      if (!isIterable(d[k]) || type.call(d[k]) == ARRAY && !isIterable(d[k][0])) {

	        // it's inline at-rule: @import etc.
	        if (k.charAt(0)=='@') {
	          processObj(
	            // map @import: [a,b,c] into {a:1, b:1, c:1}
	            [].concat(d[k]).reduce(function(prev, cur) {
	              prev[cur] = ';'
	              return prev
	            }, {}), k, {parent: node, src: d, key: k, inline:true})
	          continue
	        }

	        var r = function (_k) {
	          // skip $test key
	          if(_k != KEY_TEST) parseProp(node, d, _k, result)
	        }
	        order
	          ? funcArr.push([r, k])
	          : r(k)
	      } else {
	        processObj(d[k], k, {parent: node, src: d, key: k})
	      }
	    }

	    // when it's second time visit node
	    if (prevVal) {
	      // children removed
	      for (k in children) {
	        if (!(k in d)) {
	          arrayKV(result.diff, 'removed', children[k])
	          delete children[k]
	        }
	      }

	      // prop changed
	      var diffProp = function () {
	        var newKeys = keys(node.lastVal)
	        var removed = keys(prevVal).filter(function (x) { return newKeys.indexOf(x) < 0 })
	        if (removed.length) node.diff.removed = removed
	        if (keys(node.diff).length) arrayKV(result.diff, 'changed', node)
	      }
	      order
	        ? funcArr.push([diffProp, null])
	        : diffProp()
	    }

	    if (order) arrayKV(result, '_order', {order: order, func: funcArr})
	    result.nodes.push(node)
	    return node
	  }

	  return node
	}

	function getSel(node, result) {

	  var opt = result.options

	  // array index don't have key,
	  // fetch parent key as ruleNode
	  var ruleNode = getParents(node, function (v) {
	    return v.key
	  }).pop()

	  node.parentRule = getParents(node.parent, function (n) {
	    return n.type == TYPE_GROUP
	  }).pop() || null

	  if (ruleNode) {
	    var isMedia, sel = ruleNode.key
	    var groupRule = sel.match(reGroupRule)
	    if (groupRule) {
	      node.type = TYPE_GROUP
	      node.at = groupRule.pop()
	      isMedia = node.at == 'media'

	      // only media allow nested and join, and have node.selPart
	      if (isMedia) node.selPart = splitComma(sel.replace(reGroupRule, ''))

	      // combinePath is array, '' + array instead of array.join(',')
	      node.groupText = isMedia
	        ? '@' + node.at + combinePath(getParents(ruleNode, function (v) {
	          return v.type == TYPE_GROUP
	        }, 'selPart', 'selChild', 'selParent'), '', ' and')
	      : sel

	      node.selText = getParents(node, function (v) {
	        return v.selText && !v.at
	      }, 'selText').pop() || ''
	    } else if (reAtRule.test(sel)) {
	      node.type = 'at'
	      node.selText = sel
	    } else {
	      node.selText = '' + combinePath(getParents(ruleNode, function (v) {
	        return v.selPart && !v.at
	      }, 'selPart', 'selChild', 'selParent'), '', ' ', true), opt
	    }

	    node.selText = applyPlugins(opt, 'selector', node.selText, node, result)
	    if (node.selText) node.selTextPart = splitComma(node.selText)

	    if (node !== ruleNode) node.ruleNode = ruleNode
	  }

	}

	function parseProp (node, d, key, result) {
	  var prevVal = node.prevVal
	  var lastVal = node.lastVal

	  var prev = prevVal && prevVal[key]

	  ![].concat(d[key]).forEach(function (v) {
	    // pass lastVal if it's function
	    var val = typeof v == 'function'
	        ? v(prev, node, result)
	        : v

	    node.rawVal[key] = val
	    val = applyPlugins(result.options, 'value', val, key, node, result)
	    // only valid val can be lastVal
	    if (isValidCSSValue(val)) {
	      // push every val to prop
	      arrayKV(
	        node.prop,
	        key,
	        val,
	        true
	      )
	      prev = lastVal[key] = val
	    }
	  })
	  if (prevVal) {
	    if (!(key in prevVal)) {
	      arrayKV(node.diff, 'added', key)
	    } else if (prevVal[key] != lastVal[key]) {
	      arrayKV(node.diff, 'changed', key)
	    }
	  }
	}

	function combinePath (array, prev, sep, rep) {
	  return !array.length ? prev : array[0].reduce(function (result, value) {
	    var str = prev ? prev + sep : prev
	    if (rep) {
	      var isReplace = false
	      var sugar = strSugar(value, '&', function (z) {
	        isReplace = true
	        return prev
	      })
	      str = isReplace ? sugar : str + sugar
	    } else {
	      str += value
	    }
	    return result.concat(combinePath(array.slice(1), str, sep, rep))
	  }, [])
	}

	function applyPlugins (opt, type) {
	  var args = [].slice.call(arguments, 2)
	  var plugin = opt.plugins
	  return !plugin ? args[0] : [].concat(plugin).reduce(
	    function (pre, plugin) { return plugin[type] ? plugin[type].apply(null, [pre].concat(args)) : pre },
	    args.shift()
	  )
	}

	function applyOrder (opt) {
	  if (!opt._order) return
	  opt._order
	    .sort(function (a, b) {
	      return a.order - b.order
	    })
	    .forEach(function (v) {
	      v.func.forEach(function (f) {
	        f[0](f[1])
	      })
	    })
	  delete opt._order
	}

	function cssobj$1 (options) {

	  options = defaults(options, {
	    plugins: {}
	  })

	  return function (obj, initData) {
	    var updater = function (data) {
	      if (arguments.length) result.data = data || {}

	      result.root = parseObj(result.obj || {}, result, result.root, true)
	      applyOrder(result)
	      result = applyPlugins(options, 'post', result)
	      typeof options.onUpdate=='function' && options.onUpdate(result)
	      return result
	    }

	    var result = {
	      obj: obj,
	      update: updater,
	      options: options
	    }

	    updater(initData)

	    return result
	  }
	}

	function createDOM (id, option) {
	  var el = document.createElement('style')
	  document.getElementsByTagName('head')[0].appendChild(el)
	  el.setAttribute('id', id)
	  if (option && typeof option == 'object' && option.attrs)
	    for (var i in option.attrs) {
	      el.setAttribute(i, option.attrs[i])
	    }
	  return el
	}

	var addCSSRule = function (parent, selector, body, node) {
	  var isImportRule = /@import/i.test(node.selText)
	  var rules = parent.cssRules || parent.rules
	  var index=0

	  var omArr = []
	  var str = node.inline
	      ? body.map(function(v) {
	        return [node.selText, ' ', v]
	      })
	      : [[selector, '{', body.join(''), '}']]

	  str.forEach(function(text) {
	    if (parent.cssRules) {
	      try {
	        index = isImportRule ? 0 : rules.length
	        parent.appendRule
	          ? parent.appendRule(text.join(''))  // keyframes.appendRule return undefined
	          : parent.insertRule(text.join(''), index) //firefox <16 also return undefined...

	        omArr.push(rules[index])

	      } catch(e) {
	        // modern browser with prefix check, now only -webkit-
	        // http://shouldiprefix.com/#animations
	        // if(selector && selector.indexOf('@keyframes')==0) for(var ret, i = 0, len = cssPrefixes.length; i < len; i++) {
	        //   ret = addCSSRule(parent, selector.replace('@keyframes', '@-'+cssPrefixes[i].toLowerCase()+'-keyframes'), body, node)
	        //   if(ret.length) return ret
	        // }
	        // the rule is not supported, fail silently
	        // console.log(e, selector, body, pos)
	      }
	    } else if (parent.addRule) {
	      // https://msdn.microsoft.com/en-us/library/hh781508(v=vs.85).aspx
	      // only supported @rule will accept: @import
	      // old IE addRule don't support 'dd,dl' form, add one by one
	      // selector normally is node.selTextPart, but have to be array type
	      ![].concat(selector).forEach(function (sel) {
	        try {
	          // remove ALL @-rule support for old IE
	          if(isImportRule) {
	            index = parent.addImport(text[2])
	            omArr.push(parent.imports[index])

	            // IE addPageRule() return: not implemented!!!!
	            // } else if (/@page/.test(sel)) {
	            //   index = parent.addPageRule(sel, text[2], -1)
	            //   omArr.push(rules[rules.length-1])

	          } else if (!/^\s*@/.test(sel)) {
	            parent.addRule(sel, text[2], rules.length)
	            // old IE have bug: addRule will always return -1!!!
	            omArr.push(rules[rules.length-1])
	          }
	        } catch(e) {
	          // console.log(e, selector, body)
	        }
	      })
	    }
	  })

	  return omArr
	}

	function getBodyCss (node) {
	  // get cssText from prop
	  var prop = node.prop
	  return Object.keys(prop).map(function (k) {
	    // skip $prop, e.g. $id, $order
	    if(k.charAt(0)=='$') return ''
	    for (var v, ret='', i = prop[k].length; i--;) {
	      v = prop[k][i]

	      // display:flex expand for vendor prefix
	      var vArr = k=='display' && v=='flex'
	        ? ['-webkit-box', '-ms-flexbox', '-webkit-flex', 'flex']
	        : [v]

	      ret += vArr.map(function(v2) {
	        return node.inline ? k : dashify(prefixProp(k, true)) + ':' + v2 + ';'
	      }).join('')
	    }
	    return ret
	  })
	}

	// vendor prefix support
	// borrowed from jQuery 1.12
	var	cssPrefixes = [ "Webkit", "Moz", "ms", "O" ]
	var cssPrefixesReg = new RegExp('^(?:' + cssPrefixes.join('|') + ')[A-Z]')
	var	emptyStyle = document.createElement( "div" ).style
	var testProp  = function (list) {
	  for(var i = list.length; i--;) {
	    if(list[i] in emptyStyle) return list[i]
	  }
	}

	// cache cssProps
	var	cssProps = {
	  // normalize float css property
	  'float': testProp(['styleFloat', 'cssFloat', 'float']),
	  'flex': testProp(['WebkitBoxFlex', 'msFlex', 'WebkitFlex', 'flex'])
	}


	// return a css property mapped to a potentially vendor prefixed property
	function vendorPropName( name ) {

	  // shortcut for names that are not vendor prefixed
	  if ( name in emptyStyle ) return

	  // check for vendor prefixed names
	  var preName, capName = name.charAt( 0 ).toUpperCase() + name.slice( 1 )
	  var i = cssPrefixes.length

	  while ( i-- ) {
	    preName = cssPrefixes[ i ] + capName
	    if ( preName in emptyStyle ) return preName
	  }
	}

	// apply prop to get right vendor prefix
	// cap=0 for no cap; cap=1 for capitalize prefix
	function prefixProp (name, inCSS) {
	  // $prop will skip
	  if(name.charAt(0)=='$') return ''
	  // find name and cache the name for next time use
	  var retName = cssProps[ name ] ||
	      ( cssProps[ name ] = vendorPropName( name ) || name)
	  return inCSS   // if hasPrefix in prop
	      ? cssPrefixesReg.test(retName) ? capitalize(retName) : name=='float' && name || retName  // fix float in CSS, avoid return cssFloat
	      : retName
	}


	function cssobj_plugin_post_cssom (option) {
	  option = option || {}

	  var id = option.name
	      ? (option.name+'').replace(/[^a-zA-Z0-9$_-]/g, '')
	      : 'style_cssobj' + random()

	  var dom = document.getElementById(id) || createDOM(id, option)
	  var sheet = dom.sheet || dom.styleSheet

	  // sheet.insertRule ("@import url('test.css');", 0)  // it's ok to insert @import, but only at top
	  // sheet.insertRule ("@charset 'UTF-8';", 0)  // throw SyntaxError https://www.w3.org/Bugs/Public/show_bug.cgi?id=22207

	  // IE has a bug, first comma rule not work! insert a dummy here
	  // addCSSRule(sheet, 'html,body', [], {})

	  // helper regexp & function
	  // @page in FF not allowed pseudo @page :first{}, with SyntaxError: An invalid or illegal string was specified
	  var reWholeRule = /page/i
	  var atomGroupRule = function (node) {
	    return !node ? false : reWholeRule.test(node.at) || node.parentRule && reWholeRule.test(node.parentRule.at)
	  }

	  var getParent = function (node) {
	    var p = 'omGroup' in node ? node : node.parentRule
	    return p && p.omGroup || sheet
	  }

	  var validParent = function (node) {
	    return !node.parentRule || node.parentRule.omGroup !== null
	  }

	  var removeOneRule = function (rule) {
	    if (!rule) return
	    var parent = rule.parentRule || sheet
	    var rules = parent.cssRules || parent.rules
	    var removeFunc = function (v, i) {
	      if((v===rule)) {
	        parent.deleteRule
	          ? parent.deleteRule(rule.keyText || i)
	          : parent.removeRule(i)
	        return true
	      }
	    }
	    // sheet.imports have bugs in IE:
	    // > sheet.removeImport(0)  it's work, then again
	    // > sheet.removeImport(0)  it's not work!!!
	    //
	    // parent.imports && [].some.call(parent.imports, removeFunc)
	    ![].some.call(rules, removeFunc)
	  }

	  function removeNode (node) {
	    // remove mediaStore for old IE
	    var groupIdx = mediaStore.indexOf(node)
	    if (groupIdx > -1) {
	      // before remove from mediaStore
	      // don't forget to remove all children, by a walk
	      node.mediaEnabled = false
	      walk(node)
	      mediaStore.splice(groupIdx, 1)
	    }
	    // remove Group rule and Nomal rule
	    ![node.omGroup].concat(node.omRule).forEach(removeOneRule)
	  }

	  // helper function for addNormalrule
	  var addNormalRule = function (node, selText, cssText) {
	    if(!cssText) return
	    // get parent to add
	    var parent = getParent(node)
	    if (validParent(node))
	      return node.omRule = addCSSRule(parent, selText, cssText, node)
	    else if (node.parentRule) {
	      // for old IE not support @media, check mediaEnabled, add child nodes
	      if (node.parentRule.mediaEnabled) {
	        if (!node.omRule) return node.omRule = addCSSRule(parent, selText, cssText, node)
	      }else if (node.omRule) {
	        node.omRule.forEach(removeOneRule)
	        delete node.omRule
	      }
	    }
	  }

	  var mediaStore = []

	  var checkMediaList = function () {
	    mediaStore.forEach(function (v) {
	      v.mediaEnabled = v.mediaTest()
	      walk(v)
	    })
	  }

	  if (window.attachEvent) {
	    window.attachEvent('onresize', checkMediaList)
	  } else if (window.addEventListener) {
	    window.addEventListener('resize', checkMediaList, true)
	  }

	  var walk = function (node, store) {
	    if (!node) return

	    // cssobj generate vanilla Array, it's safe to use constructor, fast
	    if (node.constructor === Array) return node.map(function (v) {walk(v, store)})

	    // skip $key node
	    if(node.key && node.key.charAt(0)=='$' || !node.prop) return

	    // nested media rule will pending proceed
	    if(node.at=='media' && node.selParent && node.selParent.postArr) {
	      return node.selParent.postArr.push(node)
	    }

	    node.postArr = []
	    var children = node.children
	    var isGroup = node.type == 'group'

	    if (atomGroupRule(node)) store = store || []

	    if (isGroup) {
	      // if it's not @page, @keyframes (which is not groupRule in fact)
	      if (!atomGroupRule(node)) {
	        var reAdd = 'omGroup' in node
	        if (node.at=='media' && option.noMedia) node.omGroup = null
	        else [''].concat(cssPrefixes).some(function (v) {
	          return node.omGroup = addCSSRule(
	            // all groupRule will be added to root sheet
	            sheet,
	            '@' + (v ? '-' + v.toLowerCase() + '-' : v) + node.groupText.slice(1), [], node
	          ).pop() || null
	        })


	        // when add media rule failed, build test function then check on window.resize
	        if (node.at == 'media' && !reAdd && !node.omGroup) {
	          // build test function from @media rule
	          var mediaTest = new Function(
	            'return ' + node.groupText
	              .replace(/@media\s*/i, '')
	              .replace(/min-width:/ig, '>=')
	              .replace(/max-width:/ig, '<=')
	              .replace(/(px)?\s*\)/ig, ')')
	              .replace(/\band\b/ig, '&&')
	              .replace(/,/g, '||')
	              .replace(/\(/g, '(document.documentElement.offsetWidth')
	          )

	          try {
	            // first test if it's valid function
	            mediaTest()
	            node.mediaTest = mediaTest
	            node.mediaEnabled = mediaTest()
	            mediaStore.push(node)
	          } catch(e) {}
	        }
	      }
	    }

	    var selText = node.selTextPart
	    var cssText = getBodyCss(node)

	    // it's normal css rule
	    if (cssText.join('')) {
	      if (!atomGroupRule(node)) {
	        addNormalRule(node, selText, cssText)
	      }
	      store && store.push(selText ? selText + ' {' + cssText.join('') + '}' : cssText)
	    }

	    for (var c in children) {
	      // empty key will pending proceed
	      if (c === '') node.postArr.push(children[c])
	      else walk(children[c], store)
	    }

	    if (isGroup) {
	      // if it's @page, @keyframes
	      if (atomGroupRule(node) && validParent(node)) {
	        addNormalRule(node, node.groupText, store)
	        store = null
	      }
	    }

	    // media rules need a stand alone block
	    var postArr = node.postArr
	    delete node.postArr
	    postArr.map(function (v) {
	      walk(v, store)
	    })
	  }

	  return {
	    post: function (result) {
	      result.cssdom = dom
	      if (!result.diff) {
	        // it's first time render
	        walk(result.root)
	      } else {
	        // it's not first time, patch the diff result to CSSOM
	        var diff = result.diff

	        // node added
	        if (diff.added) diff.added.forEach(function (node) {
	          walk(node)
	        })

	        // node removed
	        if (diff.removed) diff.removed.forEach(function (node) {
	          // also remove all child group & sel
	          node.selChild && node.selChild.forEach(removeNode)
	          removeNode(node)
	        })

	        // node changed, find which part should be patched
	        if (diff.changed) diff.changed.forEach(function (node) {
	          var om = node.omRule
	          var diff = node.diff

	          if (!om) om = addNormalRule(node, node.selTextPart, getBodyCss(node))

	          // added have same action as changed, can be merged... just for clarity
	          diff.added && diff.added.forEach(function (v) {
	            var prefixV = prefixProp(v)
	            prefixV && om && om.forEach(function (rule) {
	              try{
	                rule.style[prefixV] = node.prop[v][0]
	              }catch(e){}
	            })
	          })

	          diff.changed && diff.changed.forEach(function (v) {
	            var prefixV = prefixProp(v)
	            prefixV && om && om.forEach(function (rule) {
	              try{
	                rule.style[prefixV] = node.prop[v][0]
	              }catch(e){}
	            })
	          })

	          diff.removed && diff.removed.forEach(function (v) {
	            var prefixV = prefixProp(v)
	            prefixV && om && om.forEach(function (rule) {
	              try{
	                rule.style.removeProperty
	                  ? rule.style.removeProperty(prefixV)
	                  : rule.style.removeAttribute(prefixV)
	              }catch(e){}
	            })
	          })
	        })
	      }

	      return result
	    }
	  }
	}

	var reClass = /:global\s*\(((?:\s*\.[A-Za-z0-9_-]+\s*)+)\)|(\.)([!A-Za-z0-9_-]+)/g

	function cssobj_plugin_selector_localize(prefix, localNames) {

	  prefix = prefix!=='' ? prefix || random() : ''

	  localNames = localNames || {}

	  var replacer = function (match, global, dot, name) {
	    if (global) {
	      return global
	    }
	    if (name[0] === '!') {
	      return dot + name.substr(1)
	    }

	    return dot + (name in localNames
	                  ? localNames[name]
	                  : prefix + name)
	  }

	  var mapSel = function(str, isClassList) {
	    return str.replace(reClass, replacer)
	  }

	  var mapClass = function(str) {
	    return mapSel((' '+str).replace(/\s+\.?/g, '.')).replace(/\./g, ' ')
	  }

	  return {
	    selector: function localizeName (sel, node, result) {
	      // don't touch at rule's selText
	      // it's copied from parent, which already localized
	      if(node.at) return sel
	      if(!result.mapSel) result.mapSel = mapSel, result.mapClass = mapClass
	      return mapSel(sel)
	    }
	  }
	}

	function cssobj(obj, option, initData) {
	  option = option||{}
	  option.plugins = option.plugins||{}

	  var local = option.local
	  option.local = !local
	    ? {prefix:''}
	  : local && typeof local==='object' ? local : {}

	  arrayKV(option, 'plugins', cssobj_plugin_post_cssom(option.cssom))
	  arrayKV(option, 'plugins', cssobj_plugin_selector_localize(option.local.prefix, option.local.localNames))

	  return cssobj$1(option)(obj, initData)
	}

	module.exports = cssobj;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

	var m = _interopDefault(__webpack_require__(8));

	var type = {}.toString

	function isObject(object) {
		return type.call(object) === "[object Object]"
	}

	function isString(object) {
		return type.call(object) === "[object String]"
	}

	function bindM (cssStore, M) {
	  M = M || m
	  if (!M) throw new Error('cannot find mithril, make sure you have `m` available in this scope.')

	  var mapClass = function (attrs) {
	    if(!isObject(attrs)) return
	    var classAttr = 'class' in attrs ? 'class' : 'className'
	    var classObj = attrs[classAttr]
	    if (classObj)
	      attrs[classAttr] = cssStore.mapClass(classObj)
	  }

	  var c = function (tag, pairs) {
	    var args = []

	    for (var i = 1, length = arguments.length; i < length; i++) {
	      args[i - 1] = arguments[i]
	    }

	    if(isObject(tag)) return M.apply(null, [tag].concat(args))

			if (!isString(tag)) {
				throw new Error("selector in m(selector, attrs, children) should " +
					"be a string")
			}

	    mapClass(pairs)
	    return M.apply( null, [cssStore.mapSel(tag)].concat(args) )
	  }

	  c.old = M

	  for(var i in M) {
	    c[i] = M[i]
	  }

	  c.result = cssStore

	  return c
	}

	module.exports = bindM;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {;(function (global, factory) { // eslint-disable-line
		"use strict"
		/* eslint-disable no-undef */
		var m = factory(global)
		if (typeof module === "object" && module != null && module.exports) {
			module.exports = m
		} else if (true) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function () { return m }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
		} else {
			global.m = m
		}
		/* eslint-enable no-undef */
	})(typeof window !== "undefined" ? window : this, function (global, undefined) { // eslint-disable-line
		"use strict"

		m.version = function () {
			return "v0.2.5"
		}

		var hasOwn = {}.hasOwnProperty
		var type = {}.toString

		function isFunction(object) {
			return typeof object === "function"
		}

		function isObject(object) {
			return type.call(object) === "[object Object]"
		}

		function isString(object) {
			return type.call(object) === "[object String]"
		}

		var isArray = Array.isArray || function (object) {
			return type.call(object) === "[object Array]"
		}

		function noop() {}

		var voidElements = {
			AREA: 1,
			BASE: 1,
			BR: 1,
			COL: 1,
			COMMAND: 1,
			EMBED: 1,
			HR: 1,
			IMG: 1,
			INPUT: 1,
			KEYGEN: 1,
			LINK: 1,
			META: 1,
			PARAM: 1,
			SOURCE: 1,
			TRACK: 1,
			WBR: 1
		}

		// caching commonly used variables
		var $document, $location, $requestAnimationFrame, $cancelAnimationFrame

		// self invoking function needed because of the way mocks work
		function initialize(mock) {
			$document = mock.document
			$location = mock.location
			$cancelAnimationFrame = mock.cancelAnimationFrame || mock.clearTimeout
			$requestAnimationFrame = mock.requestAnimationFrame || mock.setTimeout
		}

		// testing API
		m.deps = function (mock) {
			initialize(global = mock || window)
			return global
		}

		m.deps(global)

		/**
		 * @typedef {String} Tag
		 * A string that looks like -> div.classname#id[param=one][param2=two]
		 * Which describes a DOM node
		 */

		function parseTagAttrs(cell, tag) {
			var classes = []
			var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g
			var match

			while ((match = parser.exec(tag))) {
				if (match[1] === "" && match[2]) {
					cell.tag = match[2]
				} else if (match[1] === "#") {
					cell.attrs.id = match[2]
				} else if (match[1] === ".") {
					classes.push(match[2])
				} else if (match[3][0] === "[") {
					var pair = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/.exec(match[3])
					cell.attrs[pair[1]] = pair[3] || ""
				}
			}

			return classes
		}

		function getVirtualChildren(args, hasAttrs) {
			var children = hasAttrs ? args.slice(1) : args

			if (children.length === 1 && isArray(children[0])) {
				return children[0]
			} else {
				return children
			}
		}

		function assignAttrs(target, attrs, classes) {
			var classAttr = "class" in attrs ? "class" : "className"

			for (var attrName in attrs) {
				if (hasOwn.call(attrs, attrName)) {
					if (attrName === classAttr &&
							attrs[attrName] != null &&
							attrs[attrName] !== "") {
						classes.push(attrs[attrName])
						// create key in correct iteration order
						target[attrName] = ""
					} else {
						target[attrName] = attrs[attrName]
					}
				}
			}

			if (classes.length) target[classAttr] = classes.join(" ")
		}

		/**
		 *
		 * @param {Tag} The DOM node tag
		 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
		 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array,
		 *                      or splat (optional)
		 */
		function m(tag, pairs) {
			var args = []

			for (var i = 1, length = arguments.length; i < length; i++) {
				args[i - 1] = arguments[i]
			}

			if (isObject(tag)) return parameterize(tag, args)

			if (!isString(tag)) {
				throw new Error("selector in m(selector, attrs, children) should " +
					"be a string")
			}

			var hasAttrs = pairs != null && isObject(pairs) &&
				!("tag" in pairs || "view" in pairs || "subtree" in pairs)

			var attrs = hasAttrs ? pairs : {}
			var cell = {
				tag: "div",
				attrs: {},
				children: getVirtualChildren(args, hasAttrs)
			}

			assignAttrs(cell.attrs, attrs, parseTagAttrs(cell, tag))
			return cell
		}

		function forEach(list, f) {
			for (var i = 0; i < list.length && !f(list[i], i++);) {
				// function called in condition
			}
		}

		function forKeys(list, f) {
			forEach(list, function (attrs, i) {
				return (attrs = attrs && attrs.attrs) &&
					attrs.key != null &&
					f(attrs, i)
			})
		}
		// This function was causing deopts in Chrome.
		function dataToString(data) {
			// data.toString() might throw or return null if data is the return
			// value of Console.log in some versions of Firefox (behavior depends on
			// version)
			try {
				if (data != null && data.toString() != null) return data
			} catch (e) {
				// silently ignore errors
			}
			return ""
		}

		// This function was causing deopts in Chrome.
		function injectTextNode(parentElement, first, index, data) {
			try {
				insertNode(parentElement, first, index)
				first.nodeValue = data
			} catch (e) {
				// IE erroneously throws error when appending an empty text node
				// after a null
			}
		}

		function flatten(list) {
			// recursively flatten array
			for (var i = 0; i < list.length; i++) {
				if (isArray(list[i])) {
					list = list.concat.apply([], list)
					// check current index again and flatten until there are no more
					// nested arrays at that index
					i--
				}
			}
			return list
		}

		function insertNode(parentElement, node, index) {
			parentElement.insertBefore(node,
				parentElement.childNodes[index] || null)
		}

		var DELETION = 1
		var INSERTION = 2
		var MOVE = 3

		function handleKeysDiffer(data, existing, cached, parentElement) {
			forKeys(data, function (key, i) {
				existing[key = key.key] = existing[key] ? {
					action: MOVE,
					index: i,
					from: existing[key].index,
					element: cached.nodes[existing[key].index] ||
						$document.createElement("div")
				} : {action: INSERTION, index: i}
			})

			var actions = []
			for (var prop in existing) {
				if (hasOwn.call(existing, prop)) {
					actions.push(existing[prop])
				}
			}

			var changes = actions.sort(sortChanges)
			var newCached = new Array(cached.length)

			newCached.nodes = cached.nodes.slice()

			forEach(changes, function (change) {
				var index = change.index
				if (change.action === DELETION) {
					clear(cached[index].nodes, cached[index])
					newCached.splice(index, 1)
				}
				if (change.action === INSERTION) {
					var dummy = $document.createElement("div")
					dummy.key = data[index].attrs.key
					insertNode(parentElement, dummy, index)
					newCached.splice(index, 0, {
						attrs: {key: data[index].attrs.key},
						nodes: [dummy]
					})
					newCached.nodes[index] = dummy
				}

				if (change.action === MOVE) {
					var changeElement = change.element
					var maybeChanged = parentElement.childNodes[index]
					if (maybeChanged !== changeElement && changeElement !== null) {
						parentElement.insertBefore(changeElement,
							maybeChanged || null)
					}
					newCached[index] = cached[change.from]
					newCached.nodes[index] = changeElement
				}
			})

			return newCached
		}

		function diffKeys(data, cached, existing, parentElement) {
			var keysDiffer = data.length !== cached.length

			if (!keysDiffer) {
				forKeys(data, function (attrs, i) {
					var cachedCell = cached[i]
					return keysDiffer = cachedCell &&
						cachedCell.attrs &&
						cachedCell.attrs.key !== attrs.key
				})
			}

			if (keysDiffer) {
				return handleKeysDiffer(data, existing, cached, parentElement)
			} else {
				return cached
			}
		}

		function diffArray(data, cached, nodes) {
			// diff the array itself

			// update the list of DOM nodes by collecting the nodes from each item
			forEach(data, function (_, i) {
				if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
			})
			// remove items from the end of the array if the new array is shorter
			// than the old one. if errors ever happen here, the issue is most
			// likely a bug in the construction of the `cached` data structure
			// somewhere earlier in the program
			forEach(cached.nodes, function (node, i) {
				if (node.parentNode != null && nodes.indexOf(node) < 0) {
					clear([node], [cached[i]])
				}
			})

			if (data.length < cached.length) cached.length = data.length
			cached.nodes = nodes
		}

		function buildArrayKeys(data) {
			var guid = 0
			forKeys(data, function () {
				forEach(data, function (attrs) {
					if ((attrs = attrs && attrs.attrs) && attrs.key == null) {
						attrs.key = "__mithril__" + guid++
					}
				})
				return 1
			})
		}

		function isDifferentEnough(data, cached, dataAttrKeys) {
			if (data.tag !== cached.tag) return true

			if (dataAttrKeys.sort().join() !==
					Object.keys(cached.attrs).sort().join()) {
				return true
			}

			if (data.attrs.id !== cached.attrs.id) {
				return true
			}

			if (data.attrs.key !== cached.attrs.key) {
				return true
			}

			if (m.redraw.strategy() === "all") {
				return !cached.configContext || cached.configContext.retain !== true
			}

			if (m.redraw.strategy() === "diff") {
				return cached.configContext && cached.configContext.retain === false
			}

			return false
		}

		function maybeRecreateObject(data, cached, dataAttrKeys) {
			// if an element is different enough from the one in cache, recreate it
			if (isDifferentEnough(data, cached, dataAttrKeys)) {
				if (cached.nodes.length) clear(cached.nodes)

				if (cached.configContext &&
						isFunction(cached.configContext.onunload)) {
					cached.configContext.onunload()
				}

				if (cached.controllers) {
					forEach(cached.controllers, function (controller) {
						if (controller.onunload) {
							controller.onunload({preventDefault: noop})
						}
					})
				}
			}
		}

		function getObjectNamespace(data, namespace) {
			if (data.attrs.xmlns) return data.attrs.xmlns
			if (data.tag === "svg") return "http://www.w3.org/2000/svg"
			if (data.tag === "math") return "http://www.w3.org/1998/Math/MathML"
			return namespace
		}

		var pendingRequests = 0
		m.startComputation = function () { pendingRequests++ }
		m.endComputation = function () {
			if (pendingRequests > 1) {
				pendingRequests--
			} else {
				pendingRequests = 0
				m.redraw()
			}
		}

		function unloadCachedControllers(cached, views, controllers) {
			if (controllers.length) {
				cached.views = views
				cached.controllers = controllers
				forEach(controllers, function (controller) {
					if (controller.onunload && controller.onunload.$old) {
						controller.onunload = controller.onunload.$old
					}

					if (pendingRequests && controller.onunload) {
						var onunload = controller.onunload
						controller.onunload = noop
						controller.onunload.$old = onunload
					}
				})
			}
		}

		function scheduleConfigsToBeCalled(configs, data, node, isNew, cached) {
			// schedule configs to be called. They are called after `build` finishes
			// running
			if (isFunction(data.attrs.config)) {
				var context = cached.configContext = cached.configContext || {}

				// bind
				configs.push(function () {
					return data.attrs.config.call(data, node, !isNew, context,
						cached)
				})
			}
		}

		function buildUpdatedNode(
			cached,
			data,
			editable,
			hasKeys,
			namespace,
			views,
			configs,
			controllers
		) {
			var node = cached.nodes[0]

			if (hasKeys) {
				setAttributes(node, data.tag, data.attrs, cached.attrs, namespace)
			}

			cached.children = build(
				node,
				data.tag,
				undefined,
				undefined,
				data.children,
				cached.children,
				false,
				0,
				data.attrs.contenteditable ? node : editable,
				namespace,
				configs
			)

			cached.nodes.intact = true

			if (controllers.length) {
				cached.views = views
				cached.controllers = controllers
			}

			return node
		}

		function handleNonexistentNodes(data, parentElement, index) {
			var nodes
			if (data.$trusted) {
				nodes = injectHTML(parentElement, index, data)
			} else {
				nodes = [$document.createTextNode(data)]
				if (!(parentElement.nodeName in voidElements)) {
					insertNode(parentElement, nodes[0], index)
				}
			}

			var cached

			if (typeof data === "string" ||
					typeof data === "number" ||
					typeof data === "boolean") {
				cached = new data.constructor(data)
			} else {
				cached = data
			}

			cached.nodes = nodes
			return cached
		}

		function reattachNodes(
			data,
			cached,
			parentElement,
			editable,
			index,
			parentTag
		) {
			var nodes = cached.nodes
			if (!editable || editable !== $document.activeElement) {
				if (data.$trusted) {
					clear(nodes, cached)
					nodes = injectHTML(parentElement, index, data)
				} else if (parentTag === "textarea") {
					// <textarea> uses `value` instead of `nodeValue`.
					parentElement.value = data
				} else if (editable) {
					// contenteditable nodes use `innerHTML` instead of `nodeValue`.
					editable.innerHTML = data
				} else {
					// was a trusted string
					if (nodes[0].nodeType === 1 || nodes.length > 1 ||
							(nodes[0].nodeValue.trim &&
								!nodes[0].nodeValue.trim())) {
						clear(cached.nodes, cached)
						nodes = [$document.createTextNode(data)]
					}

					injectTextNode(parentElement, nodes[0], index, data)
				}
			}
			cached = new data.constructor(data)
			cached.nodes = nodes
			return cached
		}

		function handleTextNode(
			cached,
			data,
			index,
			parentElement,
			shouldReattach,
			editable,
			parentTag
		) {
			if (!cached.nodes.length) {
				return handleNonexistentNodes(data, parentElement, index)
			} else if (cached.valueOf() !== data.valueOf() || shouldReattach) {
				return reattachNodes(data, cached, parentElement, editable, index,
					parentTag)
			} else {
				return (cached.nodes.intact = true, cached)
			}
		}

		function getSubArrayCount(item) {
			if (item.$trusted) {
				// fix offset of next element if item was a trusted string w/ more
				// than one html element
				// the first clause in the regexp matches elements
				// the second clause (after the pipe) matches text nodes
				var match = item.match(/<[^\/]|\>\s*[^<]/g)
				if (match != null) return match.length
			} else if (isArray(item)) {
				return item.length
			}
			return 1
		}

		function buildArray(
			data,
			cached,
			parentElement,
			index,
			parentTag,
			shouldReattach,
			editable,
			namespace,
			configs
		) {
			data = flatten(data)
			var nodes = []
			var intact = cached.length === data.length
			var subArrayCount = 0

			// keys algorithm: sort elements without recreating them if keys are
			// present
			//
			// 1) create a map of all existing keys, and mark all for deletion
			// 2) add new keys to map and mark them for addition
			// 3) if key exists in new list, change action from deletion to a move
			// 4) for each key, handle its corresponding action as marked in
			//    previous steps

			var existing = {}
			var shouldMaintainIdentities = false

			forKeys(cached, function (attrs, i) {
				shouldMaintainIdentities = true
				existing[cached[i].attrs.key] = {action: DELETION, index: i}
			})

			buildArrayKeys(data)
			if (shouldMaintainIdentities) {
				cached = diffKeys(data, cached, existing, parentElement)
			}
			// end key algorithm

			var cacheCount = 0
			// faster explicitly written
			for (var i = 0, len = data.length; i < len; i++) {
				// diff each item in the array
				var item = build(
					parentElement,
					parentTag,
					cached,
					index,
					data[i],
					cached[cacheCount],
					shouldReattach,
					index + subArrayCount || subArrayCount,
					editable,
					namespace,
					configs)

				if (item !== undefined) {
					intact = intact && item.nodes.intact
					subArrayCount += getSubArrayCount(item)
					cached[cacheCount++] = item
				}
			}

			if (!intact) diffArray(data, cached, nodes)
			return cached
		}

		function makeCache(data, cached, index, parentIndex, parentCache) {
			if (cached != null) {
				if (type.call(cached) === type.call(data)) return cached

				if (parentCache && parentCache.nodes) {
					var offset = index - parentIndex
					var end = offset + (isArray(data) ? data : cached.nodes).length
					clear(
						parentCache.nodes.slice(offset, end),
						parentCache.slice(offset, end))
				} else if (cached.nodes) {
					clear(cached.nodes, cached)
				}
			}

			cached = new data.constructor()
			// if constructor creates a virtual dom element, use a blank object as
			// the base cached node instead of copying the virtual el (#277)
			if (cached.tag) cached = {}
			cached.nodes = []
			return cached
		}

		function constructNode(data, namespace) {
			if (data.attrs.is) {
				if (namespace == null) {
					return $document.createElement(data.tag, data.attrs.is)
				} else {
					return $document.createElementNS(namespace, data.tag,
						data.attrs.is)
				}
			} else if (namespace == null) {
				return $document.createElement(data.tag)
			} else {
				return $document.createElementNS(namespace, data.tag)
			}
		}

		function constructAttrs(data, node, namespace, hasKeys) {
			if (hasKeys) {
				return setAttributes(node, data.tag, data.attrs, {}, namespace)
			} else {
				return data.attrs
			}
		}

		function constructChildren(
			data,
			node,
			cached,
			editable,
			namespace,
			configs
		) {
			if (data.children != null && data.children.length > 0) {
				return build(
					node,
					data.tag,
					undefined,
					undefined,
					data.children,
					cached.children,
					true,
					0,
					data.attrs.contenteditable ? node : editable,
					namespace,
					configs)
			} else {
				return data.children
			}
		}

		function reconstructCached(
			data,
			attrs,
			children,
			node,
			namespace,
			views,
			controllers
		) {
			var cached = {
				tag: data.tag,
				attrs: attrs,
				children: children,
				nodes: [node]
			}

			unloadCachedControllers(cached, views, controllers)

			if (cached.children && !cached.children.nodes) {
				cached.children.nodes = []
			}

			// edge case: setting value on <select> doesn't work before children
			// exist, so set it again after children have been created
			if (data.tag === "select" && "value" in data.attrs) {
				setAttributes(node, data.tag, {value: data.attrs.value}, {},
					namespace)
			}

			return cached
		}

		function getController(views, view, cachedControllers, controller) {
			var controllerIndex

			if (m.redraw.strategy() === "diff" && views) {
				controllerIndex = views.indexOf(view)
			} else {
				controllerIndex = -1
			}

			if (controllerIndex > -1) {
				return cachedControllers[controllerIndex]
			} else if (isFunction(controller)) {
				return new controller()
			} else {
				return {}
			}
		}

		var unloaders = []

		function updateLists(views, controllers, view, controller) {
			if (controller.onunload != null &&
					unloaders.map(function (u) { return u.handler })
						.indexOf(controller.onunload) < 0) {
				unloaders.push({
					controller: controller,
					handler: controller.onunload
				})
			}

			views.push(view)
			controllers.push(controller)
		}

		var forcing = false
		function checkView(
			data,
			view,
			cached,
			cachedControllers,
			controllers,
			views
		) {
			var controller = getController(
				cached.views,
				view,
				cachedControllers,
				data.controller)

			var key = data && data.attrs && data.attrs.key

			if (pendingRequests === 0 ||
					forcing ||
					cachedControllers &&
						cachedControllers.indexOf(controller) > -1) {
				data = data.view(controller)
			} else {
				data = {tag: "placeholder"}
			}

			if (data.subtree === "retain") return data
			data.attrs = data.attrs || {}
			data.attrs.key = key
			updateLists(views, controllers, view, controller)
			return data
		}

		function markViews(data, cached, views, controllers) {
			var cachedControllers = cached && cached.controllers

			while (data.view != null) {
				data = checkView(
					data,
					data.view.$original || data.view,
					cached,
					cachedControllers,
					controllers,
					views)
			}

			return data
		}

		function buildObject( // eslint-disable-line max-statements
			data,
			cached,
			editable,
			parentElement,
			index,
			shouldReattach,
			namespace,
			configs
		) {
			var views = []
			var controllers = []

			data = markViews(data, cached, views, controllers)

			if (data.subtree === "retain") return cached

			if (!data.tag && controllers.length) {
				throw new Error("Component template must return a virtual " +
					"element, not an array, string, etc.")
			}

			data.attrs = data.attrs || {}
			cached.attrs = cached.attrs || {}

			var dataAttrKeys = Object.keys(data.attrs)
			var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)

			maybeRecreateObject(data, cached, dataAttrKeys)

			if (!isString(data.tag)) return

			var isNew = cached.nodes.length === 0

			namespace = getObjectNamespace(data, namespace)

			var node
			if (isNew) {
				node = constructNode(data, namespace)
				// set attributes first, then create children
				var attrs = constructAttrs(data, node, namespace, hasKeys)

				// add the node to its parent before attaching children to it
				insertNode(parentElement, node, index)

				var children = constructChildren(data, node, cached, editable,
					namespace, configs)

				cached = reconstructCached(
					data,
					attrs,
					children,
					node,
					namespace,
					views,
					controllers)
			} else {
				node = buildUpdatedNode(
					cached,
					data,
					editable,
					hasKeys,
					namespace,
					views,
					configs,
					controllers)
			}

			if (!isNew && shouldReattach === true && node != null) {
				insertNode(parentElement, node, index)
			}

			// The configs are called after `build` finishes running
			scheduleConfigsToBeCalled(configs, data, node, isNew, cached)

			return cached
		}

		function build(
			parentElement,
			parentTag,
			parentCache,
			parentIndex,
			data,
			cached,
			shouldReattach,
			index,
			editable,
			namespace,
			configs
		) {
			/*
			 * `build` is a recursive function that manages creation/diffing/removal
			 * of DOM elements based on comparison between `data` and `cached` the
			 * diff algorithm can be summarized as this:
			 *
			 * 1 - compare `data` and `cached`
			 * 2 - if they are different, copy `data` to `cached` and update the DOM
			 *     based on what the difference is
			 * 3 - recursively apply this algorithm for every array and for the
			 *     children of every virtual element
			 *
			 * The `cached` data structure is essentially the same as the previous
			 * redraw's `data` data structure, with a few additions:
			 * - `cached` always has a property called `nodes`, which is a list of
			 *    DOM elements that correspond to the data represented by the
			 *    respective virtual element
			 * - in order to support attaching `nodes` as a property of `cached`,
			 *    `cached` is *always* a non-primitive object, i.e. if the data was
			 *    a string, then cached is a String instance. If data was `null` or
			 *    `undefined`, cached is `new String("")`
			 * - `cached also has a `configContext` property, which is the state
			 *    storage object exposed by config(element, isInitialized, context)
			 * - when `cached` is an Object, it represents a virtual element; when
			 *    it's an Array, it represents a list of elements; when it's a
			 *    String, Number or Boolean, it represents a text node
			 *
			 * `parentElement` is a DOM element used for W3C DOM API calls
			 * `parentTag` is only used for handling a corner case for textarea
			 * values
			 * `parentCache` is used to remove nodes in some multi-node cases
			 * `parentIndex` and `index` are used to figure out the offset of nodes.
			 * They're artifacts from before arrays started being flattened and are
			 * likely refactorable
			 * `data` and `cached` are, respectively, the new and old nodes being
			 * diffed
			 * `shouldReattach` is a flag indicating whether a parent node was
			 * recreated (if so, and if this node is reused, then this node must
			 * reattach itself to the new parent)
			 * `editable` is a flag that indicates whether an ancestor is
			 * contenteditable
			 * `namespace` indicates the closest HTML namespace as it cascades down
			 * from an ancestor
			 * `configs` is a list of config functions to run after the topmost
			 * `build` call finishes running
			 *
			 * there's logic that relies on the assumption that null and undefined
			 * data are equivalent to empty strings
			 * - this prevents lifecycle surprises from procedural helpers that mix
			 *   implicit and explicit return statements (e.g.
			 *   function foo() {if (cond) return m("div")}
			 * - it simplifies diffing code
			 */
			data = dataToString(data)
			if (data.subtree === "retain") return cached
			cached = makeCache(data, cached, index, parentIndex, parentCache)

			if (isArray(data)) {
				return buildArray(
					data,
					cached,
					parentElement,
					index,
					parentTag,
					shouldReattach,
					editable,
					namespace,
					configs)
			} else if (data != null && isObject(data)) {
				return buildObject(
					data,
					cached,
					editable,
					parentElement,
					index,
					shouldReattach,
					namespace,
					configs)
			} else if (!isFunction(data)) {
				return handleTextNode(
					cached,
					data,
					index,
					parentElement,
					shouldReattach,
					editable,
					parentTag)
			} else {
				return cached
			}
		}

		function sortChanges(a, b) {
			return a.action - b.action || a.index - b.index
		}

		function copyStyleAttrs(node, dataAttr, cachedAttr) {
			for (var rule in dataAttr) {
				if (hasOwn.call(dataAttr, rule)) {
					if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) {
						node.style[rule] = dataAttr[rule]
					}
				}
			}

			for (rule in cachedAttr) {
				if (hasOwn.call(cachedAttr, rule)) {
					if (!hasOwn.call(dataAttr, rule)) node.style[rule] = ""
				}
			}
		}

		var shouldUseSetAttribute = {
			list: 1,
			style: 1,
			form: 1,
			type: 1,
			width: 1,
			height: 1
		}

		function setSingleAttr(
			node,
			attrName,
			dataAttr,
			cachedAttr,
			tag,
			namespace
		) {
			if (attrName === "config" || attrName === "key") {
				// `config` isn't a real attribute, so ignore it
				return true
			} else if (isFunction(dataAttr) && attrName.slice(0, 2) === "on") {
				// hook event handlers to the auto-redrawing system
				node[attrName] = autoredraw(dataAttr, node)
			} else if (attrName === "style" && dataAttr != null &&
					isObject(dataAttr)) {
				// handle `style: {...}`
				copyStyleAttrs(node, dataAttr, cachedAttr)
			} else if (namespace != null) {
				// handle SVG
				if (attrName === "href") {
					node.setAttributeNS("http://www.w3.org/1999/xlink",
						"href", dataAttr)
				} else {
					node.setAttribute(
						attrName === "className" ? "class" : attrName,
						dataAttr)
				}
			} else if (attrName in node && !shouldUseSetAttribute[attrName]) {
				// handle cases that are properties (but ignore cases where we
				// should use setAttribute instead)
				//
				// - list and form are typically used as strings, but are DOM
				//   element references in js
				//
				// - when using CSS selectors (e.g. `m("[style='']")`), style is
				//   used as a string, but it's an object in js
				//
				// #348 don't set the value if not needed - otherwise, cursor
				// placement breaks in Chrome
				try {
					if (tag !== "input" || node[attrName] !== dataAttr) {
						node[attrName] = dataAttr
					}
				} catch (e) {
					node.setAttribute(attrName, dataAttr)
				}
			}
			else node.setAttribute(attrName, dataAttr)
		}

		function trySetAttr(
			node,
			attrName,
			dataAttr,
			cachedAttr,
			cachedAttrs,
			tag,
			namespace
		) {
			if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr) || ($document.activeElement === node)) {
				cachedAttrs[attrName] = dataAttr
				try {
					return setSingleAttr(
						node,
						attrName,
						dataAttr,
						cachedAttr,
						tag,
						namespace)
				} catch (e) {
					// swallow IE's invalid argument errors to mimic HTML's
					// fallback-to-doing-nothing-on-invalid-attributes behavior
					if (e.message.indexOf("Invalid argument") < 0) throw e
				}
			} else if (attrName === "value" && tag === "input" &&
					node.value !== dataAttr) {
				// #348 dataAttr may not be a string, so use loose comparison
				node.value = dataAttr
			}
		}

		function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
			for (var attrName in dataAttrs) {
				if (hasOwn.call(dataAttrs, attrName)) {
					if (trySetAttr(
							node,
							attrName,
							dataAttrs[attrName],
							cachedAttrs[attrName],
							cachedAttrs,
							tag,
							namespace)) {
						continue
					}
				}
			}
			return cachedAttrs
		}

		function clear(nodes, cached) {
			for (var i = nodes.length - 1; i > -1; i--) {
				if (nodes[i] && nodes[i].parentNode) {
					try {
						nodes[i].parentNode.removeChild(nodes[i])
					} catch (e) {
						/* eslint-disable max-len */
						// ignore if this fails due to order of events (see
						// http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
						/* eslint-enable max-len */
					}
					cached = [].concat(cached)
					if (cached[i]) unload(cached[i])
				}
			}
			// release memory if nodes is an array. This check should fail if nodes
			// is a NodeList (see loop above)
			if (nodes.length) {
				nodes.length = 0
			}
		}

		function unload(cached) {
			if (cached.configContext && isFunction(cached.configContext.onunload)) {
				cached.configContext.onunload()
				cached.configContext.onunload = null
			}
			if (cached.controllers) {
				forEach(cached.controllers, function (controller) {
					if (isFunction(controller.onunload)) {
						controller.onunload({preventDefault: noop})
					}
				})
			}
			if (cached.children) {
				if (isArray(cached.children)) forEach(cached.children, unload)
				else if (cached.children.tag) unload(cached.children)
			}
		}

		function appendTextFragment(parentElement, data) {
			try {
				parentElement.appendChild(
					$document.createRange().createContextualFragment(data))
			} catch (e) {
				parentElement.insertAdjacentHTML("beforeend", data)
				replaceScriptNodes(parentElement)
			}
		}

		// Replace script tags inside given DOM element with executable ones.
		// Will also check children recursively and replace any found script
		// tags in same manner.
		function replaceScriptNodes(node) {
			if (node.tagName === "SCRIPT") {
				node.parentNode.replaceChild(buildExecutableNode(node), node)
			} else {
				var children = node.childNodes
				if (children && children.length) {
					for (var i = 0; i < children.length; i++) {
						replaceScriptNodes(children[i])
					}
				}
			}

			return node
		}

		// Replace script element with one whose contents are executable.
		function buildExecutableNode(node){
			var scriptEl = document.createElement("script")
			var attrs = node.attributes

			for (var i = 0; i < attrs.length; i++) {
				scriptEl.setAttribute(attrs[i].name, attrs[i].value)
			}

			scriptEl.text = node.innerHTML
			return scriptEl
		}

		function injectHTML(parentElement, index, data) {
			var nextSibling = parentElement.childNodes[index]
			if (nextSibling) {
				var isElement = nextSibling.nodeType !== 1
				var placeholder = $document.createElement("span")
				if (isElement) {
					parentElement.insertBefore(placeholder, nextSibling || null)
					placeholder.insertAdjacentHTML("beforebegin", data)
					parentElement.removeChild(placeholder)
				} else {
					nextSibling.insertAdjacentHTML("beforebegin", data)
				}
			} else {
				appendTextFragment(parentElement, data)
			}

			var nodes = []

			while (parentElement.childNodes[index] !== nextSibling) {
				nodes.push(parentElement.childNodes[index])
				index++
			}

			return nodes
		}

		function autoredraw(callback, object) {
			return function (e) {
				e = e || event
				m.redraw.strategy("diff")
				m.startComputation()
				try {
					return callback.call(object, e)
				} finally {
					endFirstComputation()
				}
			}
		}

		var html
		var documentNode = {
			appendChild: function (node) {
				if (html === undefined) html = $document.createElement("html")
				if ($document.documentElement &&
						$document.documentElement !== node) {
					$document.replaceChild(node, $document.documentElement)
				} else {
					$document.appendChild(node)
				}

				this.childNodes = $document.childNodes
			},

			insertBefore: function (node) {
				this.appendChild(node)
			},

			childNodes: []
		}

		var nodeCache = []
		var cellCache = {}

		m.render = function (root, cell, forceRecreation) {
			if (!root) {
				throw new Error("Ensure the DOM element being passed to " +
					"m.route/m.mount/m.render is not undefined.")
			}
			var configs = []
			var id = getCellCacheKey(root)
			var isDocumentRoot = root === $document
			var node

			if (isDocumentRoot || root === $document.documentElement) {
				node = documentNode
			} else {
				node = root
			}

			if (isDocumentRoot && cell.tag !== "html") {
				cell = {tag: "html", attrs: {}, children: cell}
			}

			if (cellCache[id] === undefined) clear(node.childNodes)
			if (forceRecreation === true) reset(root)

			cellCache[id] = build(
				node,
				null,
				undefined,
				undefined,
				cell,
				cellCache[id],
				false,
				0,
				null,
				undefined,
				configs)

			forEach(configs, function (config) { config() })
		}

		function getCellCacheKey(element) {
			var index = nodeCache.indexOf(element)
			return index < 0 ? nodeCache.push(element) - 1 : index
		}

		m.trust = function (value) {
			value = new String(value) // eslint-disable-line no-new-wrappers
			value.$trusted = true
			return value
		}

		function gettersetter(store) {
			function prop() {
				if (arguments.length) store = arguments[0]
				return store
			}

			prop.toJSON = function () {
				return store
			}

			return prop
		}

		m.prop = function (store) {
			if ((store != null && (isObject(store) || isFunction(store)) || ((typeof Promise !== "undefined") && (store instanceof Promise))) &&
					isFunction(store.then)) {
				return propify(store)
			}

			return gettersetter(store)
		}

		var roots = []
		var components = []
		var controllers = []
		var lastRedrawId = null
		var lastRedrawCallTime = 0
		var computePreRedrawHook = null
		var computePostRedrawHook = null
		var topComponent
		var FRAME_BUDGET = 16 // 60 frames per second = 1 call per 16 ms

		function parameterize(component, args) {
			function controller() {
				/* eslint-disable no-invalid-this */
				return (component.controller || noop).apply(this, args) || this
				/* eslint-enable no-invalid-this */
			}

			if (component.controller) {
				controller.prototype = component.controller.prototype
			}

			function view(ctrl) {
				var currentArgs = [ctrl].concat(args)
				for (var i = 1; i < arguments.length; i++) {
					currentArgs.push(arguments[i])
				}

				return component.view.apply(component, currentArgs)
			}

			view.$original = component.view
			var output = {controller: controller, view: view}
			if (args[0] && args[0].key != null) output.attrs = {key: args[0].key}
			return output
		}

		m.component = function (component) {
			var args = new Array(arguments.length - 1)

			for (var i = 1; i < arguments.length; i++) {
				args[i - 1] = arguments[i]
			}

			return parameterize(component, args)
		}

		function checkPrevented(component, root, index, isPrevented) {
			if (!isPrevented) {
				m.redraw.strategy("all")
				m.startComputation()
				roots[index] = root
				var currentComponent

				if (component) {
					currentComponent = topComponent = component
				} else {
					currentComponent = topComponent = component = {controller: noop}
				}

				var controller = new (component.controller || noop)()

				// controllers may call m.mount recursively (via m.route redirects,
				// for example)
				// this conditional ensures only the last recursive m.mount call is
				// applied
				if (currentComponent === topComponent) {
					controllers[index] = controller
					components[index] = component
				}
				endFirstComputation()
				if (component === null) {
					removeRootElement(root, index)
				}
				return controllers[index]
			} else if (component == null) {
				removeRootElement(root, index)
			}
		}

		m.mount = m.module = function (root, component) {
			if (!root) {
				throw new Error("Please ensure the DOM element exists before " +
					"rendering a template into it.")
			}

			var index = roots.indexOf(root)
			if (index < 0) index = roots.length

			var isPrevented = false
			var event = {
				preventDefault: function () {
					isPrevented = true
					computePreRedrawHook = computePostRedrawHook = null
				}
			}

			forEach(unloaders, function (unloader) {
				unloader.handler.call(unloader.controller, event)
				unloader.controller.onunload = null
			})

			if (isPrevented) {
				forEach(unloaders, function (unloader) {
					unloader.controller.onunload = unloader.handler
				})
			} else {
				unloaders = []
			}

			if (controllers[index] && isFunction(controllers[index].onunload)) {
				controllers[index].onunload(event)
			}

			return checkPrevented(component, root, index, isPrevented)
		}

		function removeRootElement(root, index) {
			roots.splice(index, 1)
			controllers.splice(index, 1)
			components.splice(index, 1)
			reset(root)
			nodeCache.splice(getCellCacheKey(root), 1)
		}

		var redrawing = false
		m.redraw = function (force) {
			if (redrawing) return
			redrawing = true
			if (force) forcing = true

			try {
				// lastRedrawId is a positive number if a second redraw is requested
				// before the next animation frame
				// lastRedrawId is null if it's the first redraw and not an event
				// handler
				if (lastRedrawId && !force) {
					// when setTimeout: only reschedule redraw if time between now
					// and previous redraw is bigger than a frame, otherwise keep
					// currently scheduled timeout
					// when rAF: always reschedule redraw
					if ($requestAnimationFrame === global.requestAnimationFrame ||
							new Date() - lastRedrawCallTime > FRAME_BUDGET) {
						if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId)
						lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
					}
				} else {
					redraw()
					lastRedrawId = $requestAnimationFrame(function () {
						lastRedrawId = null
					}, FRAME_BUDGET)
				}
			} finally {
				redrawing = forcing = false
			}
		}

		m.redraw.strategy = m.prop()
		function redraw() {
			if (computePreRedrawHook) {
				computePreRedrawHook()
				computePreRedrawHook = null
			}
			forEach(roots, function (root, i) {
				var component = components[i]
				if (controllers[i]) {
					var args = [controllers[i]]
					m.render(root,
						component.view ? component.view(controllers[i], args) : "")
				}
			})
			// after rendering within a routed context, we need to scroll back to
			// the top, and fetch the document title for history.pushState
			if (computePostRedrawHook) {
				computePostRedrawHook()
				computePostRedrawHook = null
			}
			lastRedrawId = null
			lastRedrawCallTime = new Date()
			m.redraw.strategy("diff")
		}

		function endFirstComputation() {
			if (m.redraw.strategy() === "none") {
				pendingRequests--
				m.redraw.strategy("diff")
			} else {
				m.endComputation()
			}
		}

		m.withAttr = function (prop, withAttrCallback, callbackThis) {
			return function (e) {
				e = e || window.event
				/* eslint-disable no-invalid-this */
				var currentTarget = e.currentTarget || this
				var _this = callbackThis || this
				/* eslint-enable no-invalid-this */
				var target = prop in currentTarget ?
					currentTarget[prop] :
					currentTarget.getAttribute(prop)
				withAttrCallback.call(_this, target)
			}
		}

		// routing
		var modes = {pathname: "", hash: "#", search: "?"}
		var redirect = noop
		var isDefaultRoute = false
		var routeParams, currentRoute

		m.route = function (root, arg1, arg2, vdom) { // eslint-disable-line
			// m.route()
			if (arguments.length === 0) return currentRoute
			// m.route(el, defaultRoute, routes)
			if (arguments.length === 3 && isString(arg1)) {
				redirect = function (source) {
					var path = currentRoute = normalizeRoute(source)
					if (!routeByValue(root, arg2, path)) {
						if (isDefaultRoute) {
							throw new Error("Ensure the default route matches " +
								"one of the routes defined in m.route")
						}

						isDefaultRoute = true
						m.route(arg1, true)
						isDefaultRoute = false
					}
				}

				var listener = m.route.mode === "hash" ?
					"onhashchange" :
					"onpopstate"

				global[listener] = function () {
					var path = $location[m.route.mode]
					if (m.route.mode === "pathname") path += $location.search
					if (currentRoute !== normalizeRoute(path)) redirect(path)
				}

				computePreRedrawHook = setScroll
				global[listener]()

				return
			}

			// config: m.route
			if (root.addEventListener || root.attachEvent) {
				var base = m.route.mode !== "pathname" ? $location.pathname : ""
				root.href = base + modes[m.route.mode] + vdom.attrs.href
				if (root.addEventListener) {
					root.removeEventListener("click", routeUnobtrusive)
					root.addEventListener("click", routeUnobtrusive)
				} else {
					root.detachEvent("onclick", routeUnobtrusive)
					root.attachEvent("onclick", routeUnobtrusive)
				}

				return
			}
			// m.route(route, params, shouldReplaceHistoryEntry)
			if (isString(root)) {
				var oldRoute = currentRoute
				currentRoute = root

				var args = arg1 || {}
				var queryIndex = currentRoute.indexOf("?")
				var params

				if (queryIndex > -1) {
					params = parseQueryString(currentRoute.slice(queryIndex + 1))
				} else {
					params = {}
				}

				for (var i in args) {
					if (hasOwn.call(args, i)) {
						params[i] = args[i]
					}
				}

				var querystring = buildQueryString(params)
				var currentPath

				if (queryIndex > -1) {
					currentPath = currentRoute.slice(0, queryIndex)
				} else {
					currentPath = currentRoute
				}

				if (querystring) {
					currentRoute = currentPath +
						(currentPath.indexOf("?") === -1 ? "?" : "&") +
						querystring
				}

				var replaceHistory =
					(arguments.length === 3 ? arg2 : arg1) === true ||
					oldRoute === root

				if (global.history.pushState) {
					var method = replaceHistory ? "replaceState" : "pushState"
					computePreRedrawHook = setScroll
					computePostRedrawHook = function () {
						try {
							global.history[method](null, $document.title,
								modes[m.route.mode] + currentRoute)
						} catch (err) {
							// In the event of a pushState or replaceState failure,
							// fallback to a standard redirect. This is specifically
							// to address a Safari security error when attempting to
							// call pushState more than 100 times.
							$location[m.route.mode] = currentRoute
						}
					}
					redirect(modes[m.route.mode] + currentRoute)
				} else {
					$location[m.route.mode] = currentRoute
					redirect(modes[m.route.mode] + currentRoute)
				}
			}
		}

		m.route.param = function (key) {
			if (!routeParams) {
				throw new Error("You must call m.route(element, defaultRoute, " +
					"routes) before calling m.route.param()")
			}

			if (!key) {
				return routeParams
			}

			return routeParams[key]
		}

		m.route.mode = "search"

		function normalizeRoute(route) {
			return route.slice(modes[m.route.mode].length)
		}

		function routeByValue(root, router, path) {
			routeParams = {}

			var queryStart = path.indexOf("?")
			if (queryStart !== -1) {
				routeParams = parseQueryString(
					path.substr(queryStart + 1, path.length))
				path = path.substr(0, queryStart)
			}

			// Get all routes and check if there's
			// an exact match for the current path
			var keys = Object.keys(router)
			var index = keys.indexOf(path)

			if (index !== -1){
				m.mount(root, router[keys [index]])
				return true
			}

			for (var route in router) {
				if (hasOwn.call(router, route)) {
					if (route === path) {
						m.mount(root, router[route])
						return true
					}

					var matcher = new RegExp("^" + route
						.replace(/:[^\/]+?\.{3}/g, "(.*?)")
						.replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

					if (matcher.test(path)) {
						/* eslint-disable no-loop-func */
						path.replace(matcher, function () {
							var keys = route.match(/:[^\/]+/g) || []
							var values = [].slice.call(arguments, 1, -2)
							forEach(keys, function (key, i) {
								routeParams[key.replace(/:|\./g, "")] =
									decodeURIComponent(values[i])
							})
							m.mount(root, router[route])
						})
						/* eslint-enable no-loop-func */
						return true
					}
				}
			}
		}

		function routeUnobtrusive(e) {
			e = e || event
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return

			if (e.preventDefault) {
				e.preventDefault()
			} else {
				e.returnValue = false
			}

			var currentTarget = e.currentTarget || e.srcElement
			var args

			if (m.route.mode === "pathname" && currentTarget.search) {
				args = parseQueryString(currentTarget.search.slice(1))
			} else {
				args = {}
			}

			while (currentTarget && !/a/i.test(currentTarget.nodeName)) {
				currentTarget = currentTarget.parentNode
			}

			// clear pendingRequests because we want an immediate route change
			pendingRequests = 0
			m.route(currentTarget[m.route.mode]
				.slice(modes[m.route.mode].length), args)
		}

		function setScroll() {
			if (m.route.mode !== "hash" && $location.hash) {
				$location.hash = $location.hash
			} else {
				global.scrollTo(0, 0)
			}
		}

		function buildQueryString(object, prefix) {
			var duplicates = {}
			var str = []

			for (var prop in object) {
				if (hasOwn.call(object, prop)) {
					var key = prefix ? prefix + "[" + prop + "]" : prop
					var value = object[prop]

					if (value === null) {
						str.push(encodeURIComponent(key))
					} else if (isObject(value)) {
						str.push(buildQueryString(value, key))
					} else if (isArray(value)) {
						var keys = []
						duplicates[key] = duplicates[key] || {}
						/* eslint-disable no-loop-func */
						forEach(value, function (item) {
							/* eslint-enable no-loop-func */
							if (!duplicates[key][item]) {
								duplicates[key][item] = true
								keys.push(encodeURIComponent(key) + "=" +
									encodeURIComponent(item))
							}
						})
						str.push(keys.join("&"))
					} else if (value !== undefined) {
						str.push(encodeURIComponent(key) + "=" +
							encodeURIComponent(value))
					}
				}
			}

			return str.join("&")
		}

		function parseQueryString(str) {
			if (str === "" || str == null) return {}
			if (str.charAt(0) === "?") str = str.slice(1)

			var pairs = str.split("&")
			var params = {}

			forEach(pairs, function (string) {
				var pair = string.split("=")
				var key = decodeURIComponent(pair[0])
				var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
				if (params[key] != null) {
					if (!isArray(params[key])) params[key] = [params[key]]
					params[key].push(value)
				}
				else params[key] = value
			})

			return params
		}

		m.route.buildQueryString = buildQueryString
		m.route.parseQueryString = parseQueryString

		function reset(root) {
			var cacheKey = getCellCacheKey(root)
			clear(root.childNodes, cellCache[cacheKey])
			cellCache[cacheKey] = undefined
		}

		m.deferred = function () {
			var deferred = new Deferred()
			deferred.promise = propify(deferred.promise)
			return deferred
		}

		function propify(promise, initialValue) {
			var prop = m.prop(initialValue)
			promise.then(prop)
			prop.then = function (resolve, reject) {
				return propify(promise.then(resolve, reject), initialValue)
			}

			prop.catch = prop.then.bind(null, null)
			return prop
		}
		// Promiz.mithril.js | Zolmeister | MIT
		// a modified version of Promiz.js, which does not conform to Promises/A+
		// for two reasons:
		//
		// 1) `then` callbacks are called synchronously (because setTimeout is too
		//    slow, and the setImmediate polyfill is too big
		//
		// 2) throwing subclasses of Error cause the error to be bubbled up instead
		//    of triggering rejection (because the spec does not account for the
		//    important use case of default browser error handling, i.e. message w/
		//    line number)

		var RESOLVING = 1
		var REJECTING = 2
		var RESOLVED = 3
		var REJECTED = 4

		function Deferred(onSuccess, onFailure) {
			var self = this
			var state = 0
			var promiseValue = 0
			var next = []

			self.promise = {}

			self.resolve = function (value) {
				if (!state) {
					promiseValue = value
					state = RESOLVING

					fire()
				}

				return self
			}

			self.reject = function (value) {
				if (!state) {
					promiseValue = value
					state = REJECTING

					fire()
				}

				return self
			}

			self.promise.then = function (onSuccess, onFailure) {
				var deferred = new Deferred(onSuccess, onFailure)

				if (state === RESOLVED) {
					deferred.resolve(promiseValue)
				} else if (state === REJECTED) {
					deferred.reject(promiseValue)
				} else {
					next.push(deferred)
				}

				return deferred.promise
			}

			function finish(type) {
				state = type || REJECTED
				next.map(function (deferred) {
					if (state === RESOLVED) {
						deferred.resolve(promiseValue)
					} else {
						deferred.reject(promiseValue)
					}
				})
			}

			function thennable(then, success, failure, notThennable) {
				if (((promiseValue != null && isObject(promiseValue)) ||
						isFunction(promiseValue)) && isFunction(then)) {
					try {
						// count protects against abuse calls from spec checker
						var count = 0
						then.call(promiseValue, function (value) {
							if (count++) return
							promiseValue = value
							success()
						}, function (value) {
							if (count++) return
							promiseValue = value
							failure()
						})
					} catch (e) {
						m.deferred.onerror(e)
						promiseValue = e
						failure()
					}
				} else {
					notThennable()
				}
			}

			function fire() {
				// check if it's a thenable
				var then
				try {
					then = promiseValue && promiseValue.then
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					state = REJECTING
					return fire()
				}

				if (state === REJECTING) {
					m.deferred.onerror(promiseValue)
				}

				thennable(then, function () {
					state = RESOLVING
					fire()
				}, function () {
					state = REJECTING
					fire()
				}, function () {
					try {
						if (state === RESOLVING && isFunction(onSuccess)) {
							promiseValue = onSuccess(promiseValue)
						} else if (state === REJECTING && isFunction(onFailure)) {
							promiseValue = onFailure(promiseValue)
							state = RESOLVING
						}
					} catch (e) {
						m.deferred.onerror(e)
						promiseValue = e
						return finish()
					}

					if (promiseValue === self) {
						promiseValue = TypeError()
						finish()
					} else {
						thennable(then, function () {
							finish(RESOLVED)
						}, finish, function () {
							finish(state === RESOLVING && RESOLVED)
						})
					}
				})
			}
		}

		m.deferred.onerror = function (e) {
			if (type.call(e) === "[object Error]" &&
					!/ Error/.test(e.constructor.toString())) {
				pendingRequests = 0
				throw e
			}
		}

		m.sync = function (args) {
			var deferred = m.deferred()
			var outstanding = args.length
			var results = []
			var method = "resolve"

			function synchronizer(pos, resolved) {
				return function (value) {
					results[pos] = value
					if (!resolved) method = "reject"
					if (--outstanding === 0) {
						deferred.promise(results)
						deferred[method](results)
					}
					return value
				}
			}

			if (args.length > 0) {
				forEach(args, function (arg, i) {
					arg.then(synchronizer(i, true), synchronizer(i, false))
				})
			} else {
				deferred.resolve([])
			}

			return deferred.promise
		}

		function identity(value) { return value }

		function handleJsonp(options) {
			var callbackKey = options.callbackName || "mithril_callback_" +
				new Date().getTime() + "_" +
				(Math.round(Math.random() * 1e16)).toString(36)

			var script = $document.createElement("script")

			global[callbackKey] = function (resp) {
				script.parentNode.removeChild(script)
				options.onload({
					type: "load",
					target: {
						responseText: resp
					}
				})
				global[callbackKey] = undefined
			}

			script.onerror = function () {
				script.parentNode.removeChild(script)

				options.onerror({
					type: "error",
					target: {
						status: 500,
						responseText: JSON.stringify({
							error: "Error making jsonp request"
						})
					}
				})
				global[callbackKey] = undefined

				return false
			}

			script.onload = function () {
				return false
			}

			script.src = options.url +
				(options.url.indexOf("?") > 0 ? "&" : "?") +
				(options.callbackKey ? options.callbackKey : "callback") +
				"=" + callbackKey +
				"&" + buildQueryString(options.data || {})

			$document.body.appendChild(script)
		}

		function createXhr(options) {
			var xhr = new global.XMLHttpRequest()
			xhr.open(options.method, options.url, true, options.user,
				options.password)

			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if (xhr.status >= 200 && xhr.status < 300) {
						options.onload({type: "load", target: xhr})
					} else {
						options.onerror({type: "error", target: xhr})
					}
				}
			}

			if (options.serialize === JSON.stringify &&
					options.data &&
					options.method !== "GET") {
				xhr.setRequestHeader("Content-Type",
					"application/json; charset=utf-8")
			}

			if (options.deserialize === JSON.parse) {
				xhr.setRequestHeader("Accept", "application/json, text/*")
			}

			if (isFunction(options.config)) {
				var maybeXhr = options.config(xhr, options)
				if (maybeXhr != null) xhr = maybeXhr
			}

			var data = options.method === "GET" || !options.data ? "" : options.data

			if (data && !isString(data) && data.constructor !== global.FormData) {
				throw new Error("Request data should be either be a string or " +
					"FormData. Check the `serialize` option in `m.request`")
			}

			xhr.send(data)
			return xhr
		}

		function ajax(options) {
			if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
				return handleJsonp(options)
			} else {
				return createXhr(options)
			}
		}

		function bindData(options, data, serialize) {
			if (options.method === "GET" && options.dataType !== "jsonp") {
				var prefix = options.url.indexOf("?") < 0 ? "?" : "&"
				var querystring = buildQueryString(data)
				options.url += (querystring ? prefix + querystring : "")
			} else {
				options.data = serialize(data)
			}
		}

		function parameterizeUrl(url, data) {
			if (data) {
				url = url.replace(/:[a-z]\w+/gi, function (token){
					var key = token.slice(1)
					var value = data[key] || token
					delete data[key]
					return value
				})
			}
			return url
		}

		m.request = function (options) {
			if (options.background !== true) m.startComputation()
			var deferred = new Deferred()
			var isJSONP = options.dataType &&
				options.dataType.toLowerCase() === "jsonp"

			var serialize, deserialize, extract

			if (isJSONP) {
				serialize = options.serialize =
				deserialize = options.deserialize = identity

				extract = function (jsonp) { return jsonp.responseText }
			} else {
				serialize = options.serialize = options.serialize || JSON.stringify

				deserialize = options.deserialize =
					options.deserialize || JSON.parse
				extract = options.extract || function (xhr) {
					if (xhr.responseText.length || deserialize !== JSON.parse) {
						return xhr.responseText
					} else {
						return null
					}
				}
			}

			options.method = (options.method || "GET").toUpperCase()
			options.url = parameterizeUrl(options.url, options.data)
			bindData(options, options.data, serialize)
			options.onload = options.onerror = function (ev) {
				try {
					ev = ev || event
					var response = deserialize(extract(ev.target, options))
					if (ev.type === "load") {
						if (options.unwrapSuccess) {
							response = options.unwrapSuccess(response, ev.target)
						}

						if (isArray(response) && options.type) {
							forEach(response, function (res, i) {
								response[i] = new options.type(res)
							})
						} else if (options.type) {
							response = new options.type(response)
						}

						deferred.resolve(response)
					} else {
						if (options.unwrapError) {
							response = options.unwrapError(response, ev.target)
						}

						deferred.reject(response)
					}
				} catch (e) {
					deferred.reject(e)
					m.deferred.onerror(e)
				} finally {
					if (options.background !== true) m.endComputation()
				}
			}

			ajax(options)
			deferred.promise = propify(deferred.promise, options.initialValue)
			return deferred.promise
		}

		return m
	}); // eslint-disable-line

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(9)(module)))

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 10 */
/***/ function(module, exports) {

	'use strict';

	function format(fmt) {
	  var re = /(%?)(%([jds]))/g,
	      args = Array.prototype.slice.call(arguments, 1);
	  if (args.length) {
	    fmt = fmt.replace(re, function (match, escaped, ptn, flag) {
	      var arg = args.shift();
	      switch (flag) {
	        case 's':
	          arg = '' + arg;
	          break;
	        case 'd':
	          arg = Number(arg);
	          break;
	        case 'j':
	          arg = JSON.stringify(arg);
	          break;
	      }
	      if (!escaped) {
	        return arg;
	      }
	      args.unshift(arg);
	      return match;
	    });
	  }

	  // arguments remain after formatting
	  if (args.length) {
	    fmt += ' ' + args.join(' ');
	  }

	  // update escaped %% values
	  fmt = fmt.replace(/%{2,2}/g, '%');

	  return '' + fmt;
	}

	module.exports = format;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _cssobj = __webpack_require__(6);

	var _cssobj2 = _interopRequireDefault(_cssobj);

	var _cssobjMithril = __webpack_require__(7);

	var _cssobjMithril2 = _interopRequireDefault(_cssobjMithril);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/**
	 * @fileOverview Display test images for ptest.
	 * @global Mousetrap.js, mithril.js
	 * @name test-image.js
	 * @author Micheal Yang
	 * @license MIT
	 */

	var PTEST_PATH = '/ptestfolder/';

	var style = {
	  '.test-image-con': {
	    textAlign: 'left'
	  },
	  'menu.top': {
	    background: '#ccc',
	    'a, span': {
	      marginLeft: '10px'
	    },
	    'span.current': {
	      color: 'red'
	    }
	  },
	  '.imageBox': {
	    position: 'relative',
	    '.info': {
	      position: 'absolute',
	      right: '10px',
	      top: '10px',
	      zIndex: 999
	    },
	    '.image': {
	      position: 'absolute'
	    }
	  },
	  '.hide': {
	    display: 'none'
	  }
	};

	var result = (0, _cssobj2.default)(style, { local: true });
	var m = (0, _cssobjMithril2.default)(result);

	var gallary = {
	  controller: function controller(arg) {
	    var ctrl = this;
	    var group = 0;
	    var index = 0;

	    var data = arg.data || testdata;
	    var folder = data.folder;
	    var test = data.test;
	    var a = data.a;
	    var images = m.request({ method: 'GET', url: [PTEST_PATH, 'testimage'].join(''), data: { folder: folder, test: test } }).then(function (f) {
	      var found = f.findIndex(function (v) {
	        return v.a == a;
	      });
	      if (found > -1) group = found;
	      return f;
	    });

	    ctrl.cycleVisible = function (diff) {
	      var obj = images()[group];
	      var keys = Object.keys(obj);
	      index += diff || 1;
	      index = (index + keys.length) % keys.length;
	      m.redraw(true);
	    };

	    ctrl.getImageList = function () {
	      return images().map(function (v, i) {
	        return m('span', { class: group == i ? 'current' : '', onclick: function onclick(e) {
	            return group = i;
	          } }, v.a);
	      });
	    };

	    ctrl.getInfoTag = function (keys, index) {
	      if (keys[index] == 'last') return m('a[href=javascript:;]', { onmousedown: function onmousedown(e) {
	          e.preventDefault();
	          e.stopPropagation();
	          alert('Apply this test image?\nWARNING: original test image will be lost!!!');
	        } }, 'last');else return keys[index];
	    };

	    ctrl.getImageTag = function () {
	      var obj = images()[group];
	      var keys = Object.keys(obj);
	      return [m('.info', ctrl.getInfoTag(keys, index)), keys.map(function (v, i) {
	        return m('.image', { class: index !== i ? '  :global(hide)   hide  ' : '' }, m('img', { src: PTEST_PATH + folder + '/' + obj[v] }));
	      })];
	    };

	    ctrl.onunload = function (e) {
	      /** tested bug below: preventdefault will trigger 2 unloaded??? */
	      // e.preventDefault()
	      console.log('unloaded', e);
	      Mousetrap.unbind(keyNumber);
	    };

	    var keyNumber = ['1', '2', '3', '4'];
	    /** Bind to short cut to switch images */
	    Mousetrap.unbind(keyNumber);
	    Mousetrap.bind(keyNumber, function (e, key) {
	      e.preventDefault();
	      index = parseInt(key) - 1;
	      m.redraw(true);
	    });
	  },
	  view: function view(ctrl, arg) {
	    return m('.test-image-con', [m('menu.top', [m('a[href=#]', { onclick: function onclick(e) {
	        return arg.onclose && arg.onclose();
	      } }, 'close'), ctrl.getImageList()]), m('.imageBox', { onmousedown: function onmousedown(e) {
	        return ctrl.cycleVisible(detectRightButton() ? -1 : 1);
	      } }, ctrl.getImageTag())]);
	  }
	};

	// module.exports = gallary
	exports.default = gallary;


	var testdata = { 'test': 'test1465218335247', 'folder': 'ptest_data', 'a': 'test1465218335247/1465218058523.png', 'b': 'test1465218335247/1465218058523.png_test.png', 'diff': 'test1465218335247/1465218058523.png_diff.png' };

	//
	// helper functions

	function detectRightButton(e) {
	  var rightclick;
	  if (!e) var e = window.event;
	  if (e.which) rightclick = e.which == 3;else if (e.button) rightclick = e.button == 2;
	  return rightclick;
	}

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _cssobj = __webpack_require__(6);

	var _cssobj2 = _interopRequireDefault(_cssobj);

	var _cssobjMithril = __webpack_require__(7);

	var _cssobjMithril2 = _interopRequireDefault(_cssobjMithril);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// for assert popup detain info

	var style = (0, _cssobj2.default)({
	  '.page': {}
	});

	var m = (0, _cssobjMithril2.default)(style);

	var assertPopup = {
	  controller: function controller(arg) {
	    var ctrl = this;
	    ctrl.getResult = function () {
	      return m('div', arg.data);
	    };
	  },
	  view: function view(ctrl, arg) {
	    return m('.test-assert-con', [m('menu.top', [m('a[href=#]', { onclick: function onclick(e) {
	        return arg.onclose && arg.onclose();
	      } }, 'close')]), m('.infoBox', ctrl.getResult())]);
	  }
	};

	// module.exports = assertPopup
	exports.default = assertPopup;

/***/ },
/* 13 */
/***/ function(module, exports) {

	'use strict';

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

	function _getWindowSize() {
	  if (window.innerWidth) {
	    return [window.innerWidth, window.innerHeight];
	  } else if (document.documentElement && document.documentElement.clientHeight) {
	    return [document.documentElement.clientWidth, document.documentElement.clientHeight];
	  } else if (document.body) {
	    return [document.body.clientWidth, document.body.clientHeight];
	  }
	  return 0;
	}

	var overlay = {
	  controller: function controller(arg) {
	    var root = arg.root;
	    var ctrl = this;
	    root.classList.add('overlay-root');
	    root.style.position = 'fixed';
	    root.style.display = 'block';
	    root.style.left = 0;
	    root.style.top = 0;
	    root.style.zIndex = 99999;
	    var onresize = function onresize(e) {
	      ctrl.width = _getWindowSize()[0];
	      ctrl.height = _getWindowSize()[1];
	      root.style.width = ctrl.width + 'px';
	      root.style.height = ctrl.height + 'px';
	      m.redraw();
	    };
	    window.addEventListener('resize', onresize);
	    onresize();
	    ctrl.hide = ctrl.close = function (ret) {
	      closeOverlay(root, ret);
	    };
	  },
	  view: function view(ctrl, arg) {
	    var popup = arg.popup;
	    popup = popup || {};
	    popup.style = popup.style || {};

	    /* below line for debug purpose */
	    // popup.style.border = '1px solid red'

	    return [m('.overlay-bg', {
	      config: function config(e) {
	        ctrl.root = e.parentElement;
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
	    }), m('table.overlay', {
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
	    }, m('tr', m('td', {
	      'align': 'center',
	      'valign': 'middle',
	      'style': {
	        'position': 'relative'
	        // 'vertical-align': 'middle'
	      }
	    }, [m('div.overlay-content', {
	      // onclick: function (e) {
	      //   ctrl.closed = true
	      // },
	      style: popup.style
	    }, popup.com ? m.component(popup.com, ctrl) : popup.text || m.trust(popup.html))])))];
	  }
	};

	function clearRoot(root) {
	  m.mount(root, null);
	  root.classList.remove('overlay-root');
	  root.style.display = 'none';
	}

	function closeOverlay(root, ret) {
	  if (!root) {
	    return;
	  }
	  root = typeof root === 'string' ? document.querySelector(root) : root.closest('.overlay-root');
	  if (root) {
	    clearRoot(root);
	    var onclose = root.overlayStack.pop();
	    if (onclose) {
	      onclose.call(this, ret);
	    }
	  }
	}
	function popupOverlay(root, popup) {
	  if (arguments.length == 1) popup = root, root = null;
	  if (!root) {
	    root = document.createElement('div');
	    root.className = 'temp-popup';
	    document.body.appendChild(root);
	  }
	  root = typeof root === 'string' ? document.querySelector(root) : root;
	  if (root) {
	    root.overlayStack = root.overlayStack || [];
	    if (typeof popup.onclose === 'function') root.overlayStack.push(popup.onclose);
	    return m.mount(root, m.component(overlay, { root: root, popup: popup }));
	  } else {
	    throw Error('no root found');
	  }
	}

	// export function
	var moverlay = { open: popupOverlay, show: popupOverlay, close: closeOverlay, hide: closeOverlay };

	module.exports = moverlay;

/***/ },
/* 14 */
/***/ function(module, exports) {

	'use strict';

	// better type check
	var is = function (t, v) { return {}.toString.call(v).slice(8, -1) === t }
	var own = function (o, k) { return {}.hasOwnProperty.call(o, k) }

	function isIterable (v) {
	  return is('Object', v) || is('Array', v) || is('Map', v)
	}

	function isPrimitive (val) {
	  return !/obj|func/.test(typeof val) || !val
	}

	function deepIt (a, b, callback, path) {
	  path = path || []
	  if (isPrimitive(b)) return a
	  for ( var key in b) {
	    if (!own(b, key)) continue
	    callback(a, b, key, path, key in a)
	    if (isIterable(b[key]) && isIterable(a[key])) {
	      deepIt(a[key], b[key], callback, path.concat(key))
	    }
	  }
	  return a
	}

	function get(obj, p, errNotFound) {
	  var n = obj
	  for(var i = 0, len = p.length; i < len; i++) {
	    if(!isIterable(n) || !(p[i] in n))
	      return errNotFound ? new Error('NotFound') : undefined
	    n = n[p[i]]
	  }
	  return n
	}

	function extend () {
	  var arg = arguments, last
	  for(var i=arg.length; i--;) {
	    last = deepIt(arg[i], last, function (a, b, key, path) {
	      a[key] = b[key]
	    })
	  }
	  return last
	}

	function merge () {
	  var arg = arguments, last
	  for(var i=arg.length; i--;) {
	    last = deepIt(arg[i], last, function (a, b, key, path, inA) {
	      if(!inA || isPrimitive(b[key])) a[key] = b[key]
	    })
	  }
	  return last
	}

	/** Usage: _exlucde(obj, {x:{y:2, z:3} } ) will delete x.y,x.z on obj
	 *  when isSet, will set value to a instead of delete
	 */
	// _exclude( {a:1,b:{d:{ c:2} } }, { b:{d:{ c:1} } } )
	function exclude (x, y, isSet) {
	  return deepIt(x, y, function (a, b, key) {
	    if (isPrimitive(b[key])) {
	      isSet
	        ? (key in a ? a[key] = b[key] : '')
	      : (b[key] ? delete a[key] : '')
	    }
	  })
	}

	function pick(obj, props) {
	  var o={}
	  return deepIt(o, props, function(a,b,key,path){
	    var c = get(obj,path.concat(key))
	    if(!b[key]) return
	    if(!isPrimitive(c)) a[key] = is('Array', c) ? [] : {}
	    if(isPrimitive(b[key])) a[key] = c
	  })
	}

	function pick2(obj, props) {
	  props=props||{}
	  var o={}
	  return deepIt(o, obj, function(a,b,key,path){
	    var c = get(props,path.concat(key))
	    if(c && isPrimitive(c)) return
	    if(!isPrimitive(b[key])) a[key] = is('Array', b[key]) ? [] : {}
	    else a[key]= b[key]
	  })
	}

	function defaults(obj, option) {
	  return deepIt(obj, option, function(a,b,key){
	    if(!(key in a)) a[key]=b[key]
	  })
	}

	exports.is = is;
	exports.own = own;
	exports.isIterable = isIterable;
	exports.isPrimitive = isPrimitive;
	exports.deepIt = deepIt;
	exports.get = get;
	exports.extend = extend;
	exports.assign = extend;
	exports.merge = merge;
	exports.exclude = exclude;
	exports.pick = pick;
	exports.pick2 = pick2;
	exports.defaults = defaults;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var each = __webpack_require__(16);
	module.exports = api;


	/**
	 * Convenience wrapper around the api.
	 * Calls `.get` when called with an `object` and a `pointer`.
	 * Calls `.set` when also called with `value`.
	 * If only supplied `object`, returns a partially applied function, mapped to the object.
	 *
	 * @param {Object} obj
	 * @param {String|Array} pointer
	 * @param value
	 * @returns {*}
	 */

	function api (obj, pointer, value) {
	    // .set()
	    if (arguments.length === 3) {
	        return api.set(obj, pointer, value);
	    }
	    // .get()
	    if (arguments.length === 2) {
	        return api.get(obj, pointer);
	    }
	    // Return a partially applied function on `obj`.
	    var wrapped = api.bind(api, obj);

	    // Support for oo style
	    for (var name in api) {
	        if (api.hasOwnProperty(name)) {
	            wrapped[name] = api[name].bind(wrapped, obj);
	        }
	    }
	    return wrapped;
	}


	/**
	 * Lookup a json pointer in an object
	 *
	 * @param {Object} obj
	 * @param {String|Array} pointer
	 * @returns {*}
	 */
	api.get = function get (obj, pointer) {
	    var refTokens = Array.isArray(pointer) ? pointer : api.parse(pointer);

	    for (var i = 0; i < refTokens.length; ++i) {
	        var tok = refTokens[i];
	        if (!(typeof obj == 'object' && tok in obj)) {
	            throw new Error('Invalid reference token: ' + tok);
	        }
	        obj = obj[tok];
	    }
	    return obj;
	};

	/**
	 * Sets a value on an object
	 *
	 * @param {Object} obj
	 * @param {String|Array} pointer
	 * @param value
	 */
	api.set = function set (obj, pointer, value) {
	    var refTokens = Array.isArray(pointer) ? pointer : api.parse(pointer),
	      nextTok = refTokens[0];

	    for (var i = 0; i < refTokens.length - 1; ++i) {
	        var tok = refTokens[i];
	        if (tok === '-' && Array.isArray(obj)) {
	          tok = obj.length;
	        }
	        nextTok = refTokens[i + 1];

	        if (!(tok in obj)) {
	            if (nextTok.match(/^(\d+|-)$/)) {
	                obj[tok] = [];
	            } else {
	                obj[tok] = {};
	            }
	        }
	        obj = obj[tok];
	    }
	    if (nextTok === '-' && Array.isArray(obj)) {
	      nextTok = obj.length;
	    }
	    obj[nextTok] = value;
	    return this;
	};

	/**
	 * Removes an attribute
	 *
	 * @param {Object} obj
	 * @param {String|Array} pointer
	 */
	api.remove = function (obj, pointer) {
	    var refTokens = Array.isArray(pointer) ? pointer : api.parse(pointer);
	    var finalToken = refTokens[refTokens.length -1];
	    if (finalToken === undefined) {
	        throw new Error('Invalid JSON pointer for remove: "' + pointer + '"');
	    }
	    delete api.get(obj, refTokens.slice(0, -1))[finalToken];
	};

	/**
	 * Returns a (pointer -> value) dictionary for an object
	 *
	 * @param obj
	 * @param {function} descend
	 * @returns {}
	 */
	api.dict = function dict (obj, descend) {
	    var results = {};
	    api.walk(obj, function (value, pointer) {
	        results[pointer] = value;
	    }, descend);
	    return results;
	};

	/**
	 * Iterates over an object
	 * Iterator: function (value, pointer) {}
	 *
	 * @param obj
	 * @param {function} iterator
	 * @param {function} descend
	 */
	api.walk = function walk (obj, iterator, descend) {
	    var refTokens = [];

	    descend = descend || function (value) {
	        var type = Object.prototype.toString.call(value);
	        return type === '[object Object]' || type === '[object Array]';
	    };

	    (function next (cur) {
	        each(cur, function (value, key) {
	            refTokens.push(String(key));
	            if (descend(value)) {
	                next(value);
	            } else {
	                iterator(value, api.compile(refTokens));
	            }
	            refTokens.pop();
	        });
	    }(obj));
	};

	/**
	 * Tests if an object has a value for a json pointer
	 *
	 * @param obj
	 * @param pointer
	 * @returns {boolean}
	 */
	api.has = function has (obj, pointer) {
	    try {
	        api.get(obj, pointer);
	    } catch (e) {
	        return false;
	    }
	    return true;
	};

	/**
	 * Escapes a reference token
	 *
	 * @param str
	 * @returns {string}
	 */
	api.escape = function escape (str) {
	    return str.toString().replace(/~/g, '~0').replace(/\//g, '~1');
	};

	/**
	 * Unescapes a reference token
	 *
	 * @param str
	 * @returns {string}
	 */
	api.unescape = function unescape (str) {
	    return str.replace(/~1/g, '/').replace(/~0/g, '~');
	};

	/**
	 * Converts a json pointer into a array of reference tokens
	 *
	 * @param pointer
	 * @returns {Array}
	 */
	api.parse = function parse (pointer) {
	    if (pointer === '') { return []; }
	    if (pointer.charAt(0) !== '/') { throw new Error('Invalid JSON pointer: ' + pointer); }
	    return pointer.substring(1).split(/\//).map(api.unescape);
	};

	/**
	 * Builds a json pointer from a array of reference tokens
	 *
	 * @param refTokens
	 * @returns {string}
	 */
	api.compile = function compile (refTokens) {
	    if (refTokens.length === 0) { return ''; }
	    return '/' + refTokens.map(api.escape).join('/');
	};


/***/ },
/* 16 */
/***/ function(module, exports) {

	
	var hasOwn = Object.prototype.hasOwnProperty;
	var toString = Object.prototype.toString;

	module.exports = function forEach (obj, fn, ctx) {
	    if (toString.call(fn) !== '[object Function]') {
	        throw new TypeError('iterator must be a function');
	    }
	    var l = obj.length;
	    if (l === +l) {
	        for (var i = 0; i < l; i++) {
	            fn.call(ctx, obj[i], i, obj);
	        }
	    } else {
	        for (var k in obj) {
	            if (hasOwn.call(obj, k)) {
	                fn.call(ctx, obj[k], k, obj);
	            }
	        }
	    }
	};



/***/ }
/******/ ]);