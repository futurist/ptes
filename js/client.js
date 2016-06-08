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

	var _overlay = __webpack_require__(4);

	var _overlay2 = _interopRequireDefault(_overlay);

	var _jsonPointer = __webpack_require__(6);

	var _jsonPointer2 = _interopRequireDefault(_jsonPointer);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	window.pointer = _jsonPointer2.default;

	var RECORDING = 'STAGE_RECORDING',
	    PLAYING = 'STAGE_PLAYING',
	    CLIPPING = 'STAGE_CLIPPING',
	    SETUP = 'STAGE_SETUP';
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

	function sc(str) {
	  ws._send({ type: 'command', meta: 'server', data: str }, function (msg) {
	    if (msg.result !== undefined) console.log(msg.result);
	  });
	}
	function cc(str, isPhantom) {
	  ws._send({ type: 'command', meta: isPhantom ? 'phantom' : 'client', data: str }, function (msg) {
	    if (msg.result !== undefined) console.log(msg.result);
	  });
	}

	function startStopRec(e, title, folder) {
	  if (e) e.preventDefault();
	  // let title = ''
	  if (stage == null) {
	    if (!title) while (1) {
	      title = currentPath = window.prompt('which title', currentPath) || '';
	      if (!title) return;
	      if (INVALID_NAME_REGEXP.test(title)) alert('path name cannot contain ' + INVALID_NAME);else if (/\/$/.test(title)) alert('cannot end of /');else {
	        // title is string of json: ['a','b']
	        title = JSON.stringify(title.split('/'));
	        break;
	      }
	    } else currentPath = title;
	    // document.title = 'recording...'+title
	    flashTitle('RECORDING');
	    currentName = 'test' + +new Date();
	    sc(' startRec("' + folder + '", "' + btoa(encodeURIComponent(title)) + '", "' + currentName + '") ');
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
	  hideSetup();
	  var path = JSON.stringify(arg.path);
	  if (arg.action == 'add') {
	    if (confirm('Confirm to begin record new test for path:\n\n    ' + path + '\n    ' + arg.folder)) startStopRec(null, path, arg.folder);
	  }
	  if (arg.action == 'play') {
	    stage = PLAYING;
	    sc(' playTestFile("' + arg.file + '", "' + arg.url + '") ');
	    setTimeout(function (arg) {
	      // window.reload()
	    });
	  }
	};

	function hideSetup(arg) {
	  _overlay2.default.hide('#overlay');
	  stage = null;
	}

	function showSetup(arg) {
	  if (stage == RECORDING && !startStopRec()) return;
	  stage = SETUP;
	  _overlay2.default.show({ com: m.component(_mtree2.default, { url: '/config', onclose: oncloseSetup }) });
	}

	//
	// setup keyboard event

	function registerEvent() {
	  Mousetrap.bind('ctrl+p', function (e) {
	    e.preventDefault();
	  });
	  Mousetrap.bind('f4', function (e) {
	    e.preventDefault();
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
	    $('#phantom').on(v, function (evt) {
	      var e = evt.originalEvent;
	      var isKey = /key/.test(e.type);
	      if (isKey) e.preventDefault();
	      if (stage === PLAYING) return;
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

	var _treeHelper = __webpack_require__(8);

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

	    function oneAction(obj) {
	      return m('a[href=#]', { class: 'action', onmousedown: function onmousedown(e) {
	          e.stopPropagation();
	          e.preventDefault();
	          args.onclose(obj);
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
	        node.push({ action: 'add', text: 'Add', path: path, folder: folder });
	      } else {
	        node.push({ action: 'play', text: 'Play', path: path, file: v.name, folder: folder, url: url });
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
	     * @param {} parent node
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

	    function saveConfig() {
	      var d = cleanData(data);
	      m.request({ method: 'POST', url: '/config', data: d }).then(function (ret) {
	        if (!ret.error) alert('Save success.');
	      }, function (e) {
	        alert('save failed!!!!' + e.message);
	      });
	    }

	    function getMenu() {
	      return m('a.button[href=#]', {
	        onclick: function onclick(e) {
	          e.preventDefault();
	          saveConfig();
	        }
	      }, 'Save');
	    }
	    ctrl.getDom = function (_) {
	      return [m('.menu', getMenu()), interTree(data)];
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
	      if (!selected.parent) return;
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
	        undoManager.group(2);
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

	var __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

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
	                var group = command.group;
	                while (command.group === group) {
	                    console.log('undo', index, command);
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
	                var group = command.group;
	                while (command.group === group) {
	                    console.log('redo', index + 1, command);
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
	                idx = idx || index;
	                if (!step || step < 1) step = 1;
	                groupIndex++;
	                while (step-- && idx - step >= 0) {
	                    commands[idx - step].group = groupIndex;
	                }
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

	  var debounce = __webpack_require__(5);

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
	    if (arguments.length < 2) popup = root, root = null;
	    if (!root) root = '#overlay';
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
/* 5 */
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
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var each = __webpack_require__(7);
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
/* 7 */
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

/***/ },
/* 8 */
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
	  function deepFindKV(data, key, val, path) {
	    var i = 0,
	        found,
	        path = path || [];
	    for (; i < data.length; i++) {
	      if (new RegExp(val).test(data[i][key])) {
	        return { path: path, item: data[i] };
	      } else if (data[i].children) {
	        found = deepFindKV(data[i].children, key, val, path.concat(i));
	        if (found) {
	          return found;
	        }
	      }
	    }
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

/***/ }
/******/ ]);