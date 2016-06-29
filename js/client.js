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

	var _testImage = __webpack_require__(14);

	var _testImage2 = _interopRequireDefault(_testImage);

	var _overlay = __webpack_require__(15);

	var _overlay2 = _interopRequireDefault(_overlay);

	var _jsonPointer = __webpack_require__(17);

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
	              _overlay2.default.show('#testimage', { com: m.component(_testImage2.default, { data: msg.error, onclose: function onclose() {
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
	  if (!arg.retain) hideSetup();
	  var path = JSON.stringify(arg.path);
	  if (arg.action == 'add') {
	    if (confirm('Confirm to begin record new test for path:\n\n    ' + path + '\n    ' + arg.folder)) startStopRec(null, arg);
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
	  Mousetrap.bind('ctrl+s', function (e) {
	    e.preventDefault();
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
	    $(window).on(v, function (evt) {
	      if (stage !== RECORDING && stage !== null) return;
	      var e = evt.originalEvent;
	      var isKey = /key/.test(e.type);
	      if (isKey) e.preventDefault();
	      // if (!isKey && e.target.id!=='phantom') return
	      var modifier = 0;
	      if (e.shiftKey) modifier |= MODIFIER.shift;
	      if (e.altKey) modifier |= MODIFIER.alt;
	      if (e.ctrlKey) modifier |= MODIFIER.ctrl;
	      if (e.metaKey) modifier |= MODIFIER.meta;
	      var evtData = { type: e.type, which: e.which, modifier: modifier };
	      if (isKey) {
	        evtData.keyName = e.key || e.keyIdentifier;
	        // console.log(e,  e.key||e.keyIdentifier, e.keyIdentifier )
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

	var treeHelper = _interopRequireWildcard(_treeHelper);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
	  if (node._leaf) return [node];else if (!node.children) return [];else return treeHelper.deepFindKV(node.children, function (v) {
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

	        data = result;
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
	      if (treeHelper.deepFindKV(data, function (v) {
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
	      var path = treeHelper.getArrayPath(data, v._path).texts;
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

	    function getText(v) {
	      var text = v.desc || '';
	      var node = v.name ? [m('span.name', '[' + v.name + ']'), getAction(v), m('br'), text] : [text, getAction(v)];
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
	          sel.parent = newParent._path.length > 1 ? treeHelper.getArrayPath(data, newParent._path.slice(0, -1)).obj : null;
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
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	;(function (root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // define(['jquery'], factory)
	  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
	      module.exports = factory(); // factory(require('jquery'))
	    } else {
	        root.treeHelper = factory(); // should return obj in factory
	      }
	})(undefined, function () {
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
	  return {
	    fromSimple: convertSimpleData,
	    getArrayPath: getArrayPath,
	    deepFindKV: deepFindKV
	  };
	});

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _cssobjMithril = __webpack_require__(6);

	var _cssobjMithril2 = _interopRequireDefault(_cssobjMithril);

	var _cssobjPluginPostStylize = __webpack_require__(9);

	var _cssobjPluginPostStylize2 = _interopRequireDefault(_cssobjPluginPostStylize);

	var _util = __webpack_require__(10);

	var _util2 = _interopRequireDefault(_util);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var mc = (0, _cssobjMithril2.default)(m, {
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
	}, { post: [(0, _cssobjPluginPostStylize2.default)()] }); /**
	                                                           * @fileOverview Render html view from ptest-runner reporter
	                                                           * @requires ptest-runner output JSON format file/response
	                                                           * @name ptest-resu@lt.js
	                                                           * @author Micheal Yang
	                                                           * @license MIT
	                                                           */

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
	    return mc('.footerContent', { class: ctrl.getClass() }, [_util2.default.format('total:%s, success:%s, fail:%s', ctrl.total, ctrl.success, ctrl.fail), arg.result ? mc('a.button[href=#]', { onclick: function onclick(e) {
	        return arg.onclose && arg.onclose();
	      } }, 'close') : []]);
	  }
	};

	var testItem = {
	  view: function view(ctrl, arg) {
	    return mc('.testItem', [mc('span', arg.test.msg), mc('span', arg.test.submsg || ''), mc('span', arg.test.status || '?'), arg.test.error ? mc('a[href=#]', { onclick: function onclick() {
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
	    return mc('.runner-result', [ctrl.result ? mc('menu.top', [mc('a[href=#]', { onclick: function onclick(e) {
	        return arg.onclose && arg.onclose();
	      } }, 'close')]) : [], mc('h3', { style: { margin: '1em 0 0 1em' } }, 'Result for ptest-runner'), mc('.reporter', ctrl.data.map(function (v, i) {
	      return mc('.item', {
	        class: mc.css().map[v.status],
	        style: {
	          marginLeft: v.level * 1 + 'em'
	        }
	      }, v.test ? m(testItem, Object.assign({}, arg, { test: v })) : mc('strong', v.msg + (v.result ? ' ' + v.result : '')));
	    })), mc('.footer', m(footer, Object.assign({}, arg, {
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

	module.exports = reporter;

	//
	// helper functions

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	!function (root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(8)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // define(['jquery'], factory)
	  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined') {
	      module.exports = factory(require('cssobj'), require('extend_exclude')); // factory(require('jquery'))
	    } else {
	        root.cssobj_m = factory(cssobj, extend_exclude); // should return obj in factory
	      }
	}(undefined, function (cssobj, util) {
	  var hasOwn = {}.hasOwnProperty;
	  var type = {}.toString;
	  var OBJECT = type.call({});

	  function isObject(object) {
	    return type.call(object) === OBJECT;
	  }

	  function bindM(M, objStore, optionStore) {
	    M = M || m;
	    if (!M) throw new Error('cannot find mithril, make sure you have `m` available in this scope.');

	    objStore = objStore || {};
	    optionStore = optionStore || {};

	    var cssStore = cssobj(objStore, optionStore);

	    var c = function c(tag, pairs) {
	      var args = [];

	      for (var i = 1, length = arguments.length; i < length; i++) {
	        args[i - 1] = arguments[i];
	      }

	      if (isObject(tag)) {
	        var classAttr = 'class' in tag.attrs ? 'class' : 'className';
	        var classObj = tag.attrs && tag.attrs[classAttr];
	        if (classObj) tag.attrs[classAttr] = classObj.split(/ +/).map(function (c) {
	          return cssStore.map[c] || c;
	        }).join(' ');
	        return M.apply(null, tag);
	      }

	      var hasAttrs = pairs != null && isObject(pairs) && !('tag' in pairs || 'view' in pairs || 'subtree' in pairs);

	      var attrs = hasAttrs ? pairs : {};
	      var cell = {
	        tag: 'div',
	        attrs: {}
	      };

	      assignAttrs(cell.attrs, attrs, parseTagAttrs(cell, tag, cssStore), cssStore);
	      // console.log(hasAttrs, cell, args)

	      return M.apply(null, [cell.tag, cell.attrs].concat(hasAttrs ? args.slice(1) : args));
	    };

	    c.option = function () {
	      return optionStore;
	    };
	    c.obj = function () {
	      return objStore;
	    };
	    c.css = function (obj, option) {
	      if (option) optionStore = option;
	      if (obj) {
	        objStore = obj;
	        cssStore = cssobj(objStore, optionStore);
	        M.redraw();
	      }
	      return cssStore;
	    };
	    c.add = function (obj) {
	      cssStore = cssobj(util._extend(objStore, obj), optionStore);
	      M.redraw();
	      return cssStore;
	    };
	    c.remove = function (obj) {
	      cssStore = cssobj(util._exclude(objStore, obj), optionStore);
	      M.redraw();
	      return cssStore;
	    };

	    return c;
	  }

	  //
	  /** helper functions **/

	  function getStyle(cssStore, cls) {
	    var globalRe = /:global\(([^)]+)\)/i;
	    var classes = cls.split(/\s+/);
	    return classes.map(function (v) {
	      var match = v.match(globalRe);
	      if (match) return match.pop();else return cssStore.map[v] || v;
	    }).join(' ');
	  }

	  // get from mithril.js, which not exposed

	  function parseTagAttrs(cell, tag, cssStore) {
	    var classes = [];
	    var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g;
	    var match;

	    while (match = parser.exec(tag)) {
	      if (match[1] === '' && match[2]) {
	        cell.tag = match[2];
	      } else if (match[1] === '#') {
	        cell.attrs.id = match[2];
	      } else if (match[1] === '.') {
	        classes.push(getStyle(cssStore, match[2]));
	      } else if (match[3][0] === '[') {
	        var pair = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/.exec(match[3]);
	        cell.attrs[pair[1]] = pair[3] || '';
	      }
	    }

	    return classes;
	  }

	  function assignAttrs(target, attrs, classes, cssStore) {
	    var classAttr = 'class' in attrs ? 'class' : 'className';

	    for (var attrName in attrs) {
	      if (hasOwn.call(attrs, attrName)) {
	        if (attrName === classAttr && attrs[attrName] != null && attrs[attrName] !== '') {
	          classes.push(getStyle(cssStore, attrs[attrName]));
	          // create key in correct iteration order
	          target[attrName] = '';
	        } else {
	          target[attrName] = attrs[attrName];
	        }
	      }
	    }

	    if (classes.length) target[classAttr] = classes.join(' ');
	  }

	  // module exports
	  return bindM;
	});

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	!function (root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(8)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // define(['jquery'], factory)
	  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined') {
	      module.exports = factory(require('extend_exclude')); // factory(require('jquery'))
	    } else {
	        root.cssobj = factory(extend_exclude); // should return obj in factory
	      }
	}(undefined, function (util) {
	  'use strict';

	  // better type check

	  var type = {}.toString;
	  var own = {}.hasOwnProperty;
	  var OBJECT = type.call({});
	  var ARRAY = type.call([]);

	  function isPrimitive(val) {
	    return (typeof val === 'undefined' ? 'undefined' : _typeof(val)) !== 'object' || !val;
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
	  function convertSimpleData(d, options, prop, path) {
	    path = path || [];
	    if (isPrimitive(d)) {
	      // {abc:123} is shortcut for {abc:{"": [123]}}
	      return [util._extend({ name: d, _leaf: true }, prop && prop(d, path))];
	    }
	    if (type.call(d) === ARRAY) {
	      return d;
	      // return d.map(function (v, i) {
	      //   return convertSimpleData(v, prop, path.concat(i))
	      // })
	    }
	    if (type.call(d) === OBJECT) {
	      var node = [];
	      var propArray = [];
	      for (var k in d) {
	        var child = convertSimpleData(d[k], options, prop, path.concat({ name: k, value: d[k] }));
	        // node.push(util._extend({name: k, children:child }, prop && prop(k, path)))
	        if (child.length && child[0]._leaf) propArray.push(k.replace(/_/g, '-').replace(/[A-Z]/g, cam2Dash) + ':' + child[0].name);
	      }
	      if (path.length) objKV(store, getSelector(path, options), propArray);
	      return node;
	    }
	    return [];
	  }

	  var propStart = '{\n';
	  var propEnd = '\n}';
	  var reClass = /:global\s*\(\s*((?:\.[-\w]+\s*)+)\s*\)|(\.)([!-\w]+)/g;
	  var reComma = /\s*,\s*/;

	  var store = {};
	  var localNames = {};

	  var count = 0;
	  var random = function random() {
	    count++;
	    return '_' + Math.floor(Math.random() * Math.pow(2, 32)).toString(36) + count + '_';
	  };

	  function propFormatter(propArray) {
	    return propArray.map(function (v) {
	      return '\t' + v;
	    }).join(';\n');
	  }

	  function getSelector(path, options) {
	    var replacer = function replacer(match, global, dot, name) {
	      if (global) {
	        return global;
	      }
	      if (name[0] === '!') {
	        return dot + name.substr(1);
	      }
	      if (!localNames[name]) localNames[name] = options.local ? (options.prefix = options.prefix || random(), options.prefix + name) : name;
	      return dot + localNames[name].match(/\S+$/);
	    };

	    var localize = function localize(name) {
	      return name.replace(reClass, replacer);
	    };

	    var item,
	        parent = '';
	    for (var i = 0, len = path.length; i < len; i++) {
	      item = path[i];
	      if (!item.selector) {
	        item.selector = item.name.split(reComma).map(function (v) {
	          return parent.split(reComma).map(function (p) {
	            return v.match(/^&|[^\\]&/) ? v.replace(/&/, p) : p.split(' ').concat(v.replace(/\\&/g, '&')).join(' ');
	          }).join(', ');
	        }).join(', ').replace(/^\s+/, '');
	      }
	      parent = item.selector;
	    }
	    return localize(parent);
	  }

	  function getCSS() {
	    return Object.keys(store).map(function (k) {
	      return k + ' ' + propStart + propFormatter(store[k]) + propEnd;
	    }).join('\n');
	  }

	  function cam2Dash(c) {
	    return '-' + c.toLowerCase();
	  }

	  function objKV(obj, k, v) {
	    return obj[k] = v;
	  }

	  var obj = {
	    'ul.menu': {
	      background_color: 'red',
	      borderRadius: '2px',
	      'li.item, li.cc': {
	        '&:before, .link': {
	          ".foo[title*='\\&'], :global(.xy)": { color: 'blue' },
	          color: 'red'
	        },
	        'html:global(.ie8) &': { color: 'purple' },
	        font_size: '12px'
	      }
	    }
	  };

	  function safeSelector(name) {
	    if (name) return '_'.concat(name).replace(/^_+/, '_').replace(/[^-\w]/g, '');
	  }

	  var defaultOption = { local: true };
	  function cssobj(obj, options) {
	    options = options || {};

	    // set default options
	    util._deepIt(options, defaultOption, function (a, b, key) {
	      if (!(key in a)) a[key] = b[key];
	    });

	    // ensure it's valid selector name
	    options.prefix = safeSelector(options.prefix);

	    convertSimpleData(obj, options);
	    var result = { css: getCSS(), map: localNames, options: options };
	    localNames = {};
	    store = {};
	    if (options.post) options.post.forEach(function (f) {
	      f(result);
	    });
	    return result;
	  }

	  // window.a = cssobj(obj, window.a? window.a.options : {})
	  // console.log(a.css)

	  // module exports
	  return cssobj;
	});

/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var type = {}.toString;
	var own = {}.hasOwnProperty;
	var OBJECT = type.call({});

	function _deepIt(a, b, callback) {
	  if (a == null || b == null) {
	    return a;
	  }
	  for (var key in b) {
	    if (!own.call(b, key)) continue;
	    if (type.call(b[key]) == OBJECT) {
	      if (type.call(a[key]) != OBJECT) {
	        callback(a, b, key);
	      } else {
	        a[key] = _deepIt(a[key], b[key], callback);
	      }
	    } else {
	      callback(a, b, key);
	    }
	  }
	  return a;
	}

	function _extend() {
	  var arg = arguments,
	      last;
	  for (var i = arg.length; i--;) {
	    last = _deepIt(arg[i], last, function (a, b, key) {
	      a[key] = b[key];
	    });
	  }
	  return last;
	}

	/*Usage: _exlucde(obj, {x:{y:1, z:1} }, [null] ) will delete x.y,x.z on obj, or set to newVal if present */
	// _exclude( {a:1,b:{d:{ c:2} } }, { b:{d:{ c:1} } } )
	function _exclude(x, y, newVal) {
	  var args = arguments;
	  return _deepIt(x, y, function (a, b, key) {
	    if (_typeof(b[key]) !== 'object' && b[key]) {
	      args.length == 3 ? a[key] = newVal : delete a[key];
	    } else {
	      a[key] = b[key];
	    }
	  });
	}

	var extend_exclude = {
	  _deepIt: _deepIt,
	  _extend: _extend,
	  _exclude: _exclude
	};

	module.exports = extend_exclude;

/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * @fileOverview cssobj plugin for apply style into browser head
	 * @name cssobj-plugin-post-stylize.js • src
	 * @author James Yang [jamesyang999@gmail.com]
	 * @license MIT
	 * @usage
	cssobj(obj, {
	  post:[cssobj_plugin_post_stylize({name:'gaga', attrs: {media: 'screen'}})]
	})
	 */

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	function escapeHTML(str) {
	  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
	}

	function stylize(element, sheet) {
	  if (element.cachedCSS === sheet) return;
	  element.cachedCSS = sheet;
	  if (element.styleSheet) {
	    element.styleSheet.cssText = sheet;
	  } else {
	    // empty all style when re-apply new style
	    while (element.firstChild) {
	      element.removeChild(element.firstChild);
	    }element.appendChild(document.createTextNode(sheet));
	  }
	  return element;
	}

	function addStyleToHead(option) {
	  option = option || {};
	  if (!option.name) option.name = +new Date() + '_';
	  return function (sheet) {
	    var id = 'style_cssobj_' + escapeHTML(option.name);
	    var styleDom = document.getElementById(id);
	    if (!styleDom) {
	      var el = document.createElement('style');
	      document.head.appendChild(el);
	      styleDom = el;
	    }
	    styleDom.setAttribute('id', id);
	    styleDom.setAttribute('type', 'text/css');
	    if (option && (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option.attrs) for (var i in option.attrs) {
	      styleDom.setAttribute(i, option.attrs[i]);
	    }
	    return stylize(styleDom, sheet.css);
	  };
	}

	module.exports = addStyleToHead;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var formatRegExp = /%[sdj%]/g;
	exports.format = function (f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function (x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s':
	        return String(args[i++]);
	      case '%d':
	        return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};

	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function (fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function () {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (process.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};

	var debugs = {};
	var debugEnviron;
	exports.debuglog = function (set) {
	  if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function () {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function () {};
	    }
	  }
	  return debugs[set];
	};

	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;

	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold': [1, 22],
	  'italic': [3, 23],
	  'underline': [4, 24],
	  'inverse': [7, 27],
	  'white': [37, 39],
	  'grey': [90, 39],
	  'black': [30, 39],
	  'blue': [34, 39],
	  'cyan': [36, 39],
	  'green': [32, 39],
	  'magenta': [35, 39],
	  'red': [31, 39],
	  'yellow': [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};

	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str + '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}

	function stylizeNoColor(str, styleType) {
	  return str;
	}

	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function (val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}

	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect && value && isFunction(value.inspect) &&
	  // Filter out the util module, it's inspect function is special
	  value.inspect !== exports.inspect &&
	  // Also filter out any prototype objects using the circular check.
	  !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '',
	      array = false,
	      braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function (key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}

	function formatPrimitive(ctx, value) {
	  if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value)) return ctx.stylize('' + value, 'number');
	  if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value)) return ctx.stylize('null', 'null');
	}

	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}

	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function (key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
	    }
	  });
	  return output;
	}

	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function (line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function (line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}

	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function (prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}

	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol' || // ES6 symbol
	  typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = __webpack_require__(12);

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}

	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}

	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}

	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function () {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};

	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(13);

	exports._extend = function (origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(11)))

/***/ },
/* 11 */
/***/ function(module, exports) {

	'use strict';

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while (len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () {
	    return '/';
	};
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function () {
	    return 0;
	};

/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	module.exports = function isBuffer(arg) {
	  return arg && (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
	};

/***/ },
/* 13 */
/***/ function(module, exports) {

	'use strict';

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor;
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor;
	    var TempCtor = function TempCtor() {};
	    TempCtor.prototype = superCtor.prototype;
	    ctor.prototype = new TempCtor();
	    ctor.prototype.constructor = ctor;
	  };
	}

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _cssobjMithril = __webpack_require__(6);

	var _cssobjMithril2 = _interopRequireDefault(_cssobjMithril);

	var _cssobjPluginPostStylize = __webpack_require__(9);

	var _cssobjPluginPostStylize2 = _interopRequireDefault(_cssobjPluginPostStylize);

	var _util = __webpack_require__(10);

	var _util2 = _interopRequireDefault(_util);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var PTEST_PATH = '/ptestfolder/'; /**
	                                   * @fileOverview Display test images for ptest.
	                                   * @global Mousetrap.js, mithril.js
	                                   * @name test-image.js
	                                   * @author Micheal Yang
	                                   * @license MIT
	                                   */

	var style = {
	  '.test-image-con': {
	    text_align: 'left'
	  },
	  'menu.top': {
	    background: '#ccc',
	    'a, span': {
	      margin_left: '10px'
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
	      z_index: 999
	    },
	    '.image': {
	      position: 'absolute'
	    }
	  },
	  '.hide': {
	    display: 'none'
	  }
	};
	var mc = (0, _cssobjMithril2.default)(m, style, { post: [(0, _cssobjPluginPostStylize2.default)()] });

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
	        return mc('span', { class: group == i ? 'current' : '', onclick: function onclick(e) {
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
	      return [mc('.info', ctrl.getInfoTag(keys, index)), keys.map(function (v, i) {
	        return mc('.image', { class: index !== i ? '  :global(hide)   hide  ' : '' }, mc('img', { src: PTEST_PATH + folder + '/' + obj[v] }));
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
	    return mc('.test-image-con', [mc('menu.top', [mc('a[href=#]', { onclick: function onclick(e) {
	        return arg.onclose && arg.onclose();
	      } }, 'close'), ctrl.getImageList()]), mc('.imageBox', { onmousedown: function onmousedown(e) {
	        return ctrl.cycleVisible(detectRightButton() ? -1 : 1);
	      } }, ctrl.getImageTag())]);
	  }
	};

	module.exports = gallary;

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
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (_global, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // define(['jquery'], factory)
	  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
	      module.exports = factory(); // factory(require('jquery'))
	    } else {
	        _global.mOverlay = factory(); // should return obj in factory
	      }
	})(undefined, function () {
	  'use strict';

	  var debounce = __webpack_require__(16);

	  /**
	   * @fileOverview Popup toolkit using mithril
	   * @name overlay.js
	   * @author micheal.yang
	   * @license MIT
	   */

	  // require js/broswerutil.js file

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
	      window.addEventListener('resize', debounce(onresize, 200));
	      onresize();
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

	        }
	      }), /* below try to fix IE8 render problem, but not work:(  */
	      // backgroundColor: '#000000',
	      // filter: 'none !important',
	      // filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=50)',
	      // filter: 'alpha(opacity=50)',
	      // 'zoom':1
	      m('table.overlay', {
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
	        }
	      }, // 'vertical-align': 'middle'
	      [m('div.overlay-content', {
	        onclick: function onclick(e) {
	          ctrl.close = true;
	        },
	        key: ctrl.height,
	        style: Object.assign(popup.style || {}, { height: ctrl.height + 'px' })
	      }, popup.com ? m.component(popup.com, ctrl) : popup.text || m.trust(popup.html))])))];
	    }
	  };

	  function clearRoot(root) {
	    m.mount(root, null);
	    root.classList.remove('overlay-root');
	    root.style.display = 'none';
	  }

	  function closeOverlay(root, ret) {
	    if (!root) return;
	    root = typeof root == 'string' ? document.querySelector(root) : root.closest('.overlay-root');
	    if (root) {
	      clearRoot(root);
	      var callback = root.overlayStack.pop();
	      if (callback) callback.call(this, ret);
	    }
	  }
	  function popupOverlay(root, popup) {
	    // if (arguments.length < 2) popup = root, root = null
	    if (!root) return;
	    root = typeof root == 'string' ? document.querySelector(root) : root;
	    if (root) {
	      root.overlayStack = root.overlayStack || [];
	      root.overlayStack.push(popup.onclose);
	      m.mount(root, m.component(overlay, { root: root, popup: popup }));
	    }
	  }

	  // export function

	  return { open: popupOverlay, show: popupOverlay, close: closeOverlay, hide: closeOverlay };
	});

/***/ },
/* 16 */
/***/ function(module, exports) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	/**
	 * lodash 4.0.6 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */

	/** Used as the `TypeError` message for "Functions" methods. */
	var FUNC_ERROR_TEXT = 'Expected a function';

	/** Used as references for various `Number` constants. */
	var NAN = 0 / 0;

	/** `Object#toString` result references. */
	var funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    symbolTag = '[object Symbol]';

	/** Used to match leading and trailing whitespace. */
	var reTrim = /^\s+|\s+$/g;

	/** Used to detect bad signed hexadecimal string values. */
	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

	/** Used to detect binary string values. */
	var reIsBinary = /^0b[01]+$/i;

	/** Used to detect octal string values. */
	var reIsOctal = /^0o[0-7]+$/i;

	/** Built-in method references without a dependency on `root`. */
	var freeParseInt = parseInt;

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max,
	    nativeMin = Math.min;

	/**
	 * Gets the timestamp of the number of milliseconds that have elapsed since
	 * the Unix epoch (1 January 1970 00:00:00 UTC).
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @type {Function}
	 * @category Date
	 * @returns {number} Returns the timestamp.
	 * @example
	 *
	 * _.defer(function(stamp) {
	 *   console.log(_.now() - stamp);
	 * }, _.now());
	 * // => Logs the number of milliseconds it took for the deferred function to be invoked.
	 */
	var now = Date.now;

	/**
	 * Creates a debounced function that delays invoking `func` until after `wait`
	 * milliseconds have elapsed since the last time the debounced function was
	 * invoked. The debounced function comes with a `cancel` method to cancel
	 * delayed `func` invocations and a `flush` method to immediately invoke them.
	 * Provide an options object to indicate whether `func` should be invoked on
	 * the leading and/or trailing edge of the `wait` timeout. The `func` is invoked
	 * with the last arguments provided to the debounced function. Subsequent calls
	 * to the debounced function return the result of the last `func` invocation.
	 *
	 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
	 * on the trailing edge of the timeout only if the debounced function is
	 * invoked more than once during the `wait` timeout.
	 *
	 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
	 * for details over the differences between `_.debounce` and `_.throttle`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to debounce.
	 * @param {number} [wait=0] The number of milliseconds to delay.
	 * @param {Object} [options={}] The options object.
	 * @param {boolean} [options.leading=false]
	 *  Specify invoking on the leading edge of the timeout.
	 * @param {number} [options.maxWait]
	 *  The maximum time `func` is allowed to be delayed before it's invoked.
	 * @param {boolean} [options.trailing=true]
	 *  Specify invoking on the trailing edge of the timeout.
	 * @returns {Function} Returns the new debounced function.
	 * @example
	 *
	 * // Avoid costly calculations while the window size is in flux.
	 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
	 *
	 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
	 * jQuery(element).on('click', _.debounce(sendMail, 300, {
	 *   'leading': true,
	 *   'trailing': false
	 * }));
	 *
	 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
	 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
	 * var source = new EventSource('/stream');
	 * jQuery(source).on('message', debounced);
	 *
	 * // Cancel the trailing debounced invocation.
	 * jQuery(window).on('popstate', debounced.cancel);
	 */
	function debounce(func, wait, options) {
	  var lastArgs,
	      lastThis,
	      maxWait,
	      result,
	      timerId,
	      lastCallTime = 0,
	      lastInvokeTime = 0,
	      leading = false,
	      maxing = false,
	      trailing = true;

	  if (typeof func != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  wait = toNumber(wait) || 0;
	  if (isObject(options)) {
	    leading = !!options.leading;
	    maxing = 'maxWait' in options;
	    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
	    trailing = 'trailing' in options ? !!options.trailing : trailing;
	  }

	  function invokeFunc(time) {
	    var args = lastArgs,
	        thisArg = lastThis;

	    lastArgs = lastThis = undefined;
	    lastInvokeTime = time;
	    result = func.apply(thisArg, args);
	    return result;
	  }

	  function leadingEdge(time) {
	    // Reset any `maxWait` timer.
	    lastInvokeTime = time;
	    // Start the timer for the trailing edge.
	    timerId = setTimeout(timerExpired, wait);
	    // Invoke the leading edge.
	    return leading ? invokeFunc(time) : result;
	  }

	  function remainingWait(time) {
	    var timeSinceLastCall = time - lastCallTime,
	        timeSinceLastInvoke = time - lastInvokeTime,
	        result = wait - timeSinceLastCall;

	    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
	  }

	  function shouldInvoke(time) {
	    var timeSinceLastCall = time - lastCallTime,
	        timeSinceLastInvoke = time - lastInvokeTime;

	    // Either this is the first call, activity has stopped and we're at the
	    // trailing edge, the system time has gone backwards and we're treating
	    // it as the trailing edge, or we've hit the `maxWait` limit.
	    return !lastCallTime || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
	  }

	  function timerExpired() {
	    var time = now();
	    if (shouldInvoke(time)) {
	      return trailingEdge(time);
	    }
	    // Restart the timer.
	    timerId = setTimeout(timerExpired, remainingWait(time));
	  }

	  function trailingEdge(time) {
	    clearTimeout(timerId);
	    timerId = undefined;

	    // Only invoke if we have `lastArgs` which means `func` has been
	    // debounced at least once.
	    if (trailing && lastArgs) {
	      return invokeFunc(time);
	    }
	    lastArgs = lastThis = undefined;
	    return result;
	  }

	  function cancel() {
	    if (timerId !== undefined) {
	      clearTimeout(timerId);
	    }
	    lastCallTime = lastInvokeTime = 0;
	    lastArgs = lastThis = timerId = undefined;
	  }

	  function flush() {
	    return timerId === undefined ? result : trailingEdge(now());
	  }

	  function debounced() {
	    var time = now(),
	        isInvoking = shouldInvoke(time);

	    lastArgs = arguments;
	    lastThis = this;
	    lastCallTime = time;

	    if (isInvoking) {
	      if (timerId === undefined) {
	        return leadingEdge(lastCallTime);
	      }
	      if (maxing) {
	        // Handle invocations in a tight loop.
	        clearTimeout(timerId);
	        timerId = setTimeout(timerExpired, wait);
	        return invokeFunc(lastCallTime);
	      }
	    }
	    if (timerId === undefined) {
	      timerId = setTimeout(timerExpired, wait);
	    }
	    return result;
	  }
	  debounced.cancel = cancel;
	  debounced.flush = flush;
	  return debounced;
	}

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified,
	 *  else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8 which returns 'object' for typed array and weak map constructors,
	  // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
	  return !!value && (type == 'object' || type == 'function');
	}

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
	}

	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified,
	 *  else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
	  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
	}

	/**
	 * Converts `value` to a number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {number} Returns the number.
	 * @example
	 *
	 * _.toNumber(3);
	 * // => 3
	 *
	 * _.toNumber(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toNumber(Infinity);
	 * // => Infinity
	 *
	 * _.toNumber('3');
	 * // => 3
	 */
	function toNumber(value) {
	  if (typeof value == 'number') {
	    return value;
	  }
	  if (isSymbol(value)) {
	    return NAN;
	  }
	  if (isObject(value)) {
	    var other = isFunction(value.valueOf) ? value.valueOf() : value;
	    value = isObject(other) ? other + '' : other;
	  }
	  if (typeof value != 'string') {
	    return value === 0 ? value : +value;
	  }
	  value = value.replace(reTrim, '');
	  var isBinary = reIsBinary.test(value);
	  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
	}

	module.exports = debounce;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var each = __webpack_require__(18);
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

	function api(obj, pointer, value) {
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
	api.get = function get(obj, pointer) {
	    var refTokens = Array.isArray(pointer) ? pointer : api.parse(pointer);

	    for (var i = 0; i < refTokens.length; ++i) {
	        var tok = refTokens[i];
	        if (!((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) == 'object' && tok in obj)) {
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
	api.set = function set(obj, pointer, value) {
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
	    var finalToken = refTokens[refTokens.length - 1];
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
	api.dict = function dict(obj, descend) {
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
	api.walk = function walk(obj, iterator, descend) {
	    var refTokens = [];

	    descend = descend || function (value) {
	        var type = Object.prototype.toString.call(value);
	        return type === '[object Object]' || type === '[object Array]';
	    };

	    (function next(cur) {
	        each(cur, function (value, key) {
	            refTokens.push(String(key));
	            if (descend(value)) {
	                next(value);
	            } else {
	                iterator(value, api.compile(refTokens));
	            }
	            refTokens.pop();
	        });
	    })(obj);
	};

	/**
	 * Tests if an object has a value for a json pointer
	 *
	 * @param obj
	 * @param pointer
	 * @returns {boolean}
	 */
	api.has = function has(obj, pointer) {
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
	api.escape = function escape(str) {
	    return str.toString().replace(/~/g, '~0').replace(/\//g, '~1');
	};

	/**
	 * Unescapes a reference token
	 *
	 * @param str
	 * @returns {string}
	 */
	api.unescape = function unescape(str) {
	    return str.replace(/~1/g, '/').replace(/~0/g, '~');
	};

	/**
	 * Converts a json pointer into a array of reference tokens
	 *
	 * @param pointer
	 * @returns {Array}
	 */
	api.parse = function parse(pointer) {
	    if (pointer === '') {
	        return [];
	    }
	    if (pointer.charAt(0) !== '/') {
	        throw new Error('Invalid JSON pointer: ' + pointer);
	    }
	    return pointer.substring(1).split(/\//).map(api.unescape);
	};

	/**
	 * Builds a json pointer from a array of reference tokens
	 *
	 * @param refTokens
	 * @returns {string}
	 */
	api.compile = function compile(refTokens) {
	    if (refTokens.length === 0) {
	        return '';
	    }
	    return '/' + refTokens.map(api.escape).join('/');
	};

/***/ },
/* 18 */
/***/ function(module, exports) {

	'use strict';

	var hasOwn = Object.prototype.hasOwnProperty;
	var toString = Object.prototype.toString;

	module.exports = function forEach(obj, fn, ctx) {
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