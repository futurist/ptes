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

	var _overlay = __webpack_require__(2);

	var _overlay2 = _interopRequireDefault(_overlay);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// import pointer from 'json-pointer'
	// window.pointer = pointer

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

	function startStopRec(e, title) {
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
	    sc(' startRec("' + btoa(title) + '", "' + currentName + '") ');
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
	    if (confirm('Confirm to begin record new test for path:\n\n    ' + path)) startStopRec(null, path);
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
	  Mousetrap.bind('ctrl+s', function (e) {
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
	  Mousetrap.bind('f4', function (e) {
	    if (!currentPath || stage !== RECORDING) return;
	    e.preventDefault();
	    sc(' snapKeyFrame("' + currentName + '") ');
	    keyframeCount++;
	  });
	  Mousetrap.bind('ctrl+r', function (e) {
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
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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
	var isValidName = function isValidName(name) {
	  return !INVALID_NAME_REGEXP.test(name);
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

	/**
	 * convert simple Object into tree data
	 *
	 format:
	 {"a":{"b":{"c":{"":["leaf 1"]}}},"abc":123, f:null}
	 *        1. every key is folder node; "":[] is leaf node
	 *        2. {abc:123} is shortcut for {abc:{"": [123]}}
	 *
	 * @param {object} d - simple object data
	 * @param {function|any} prop - function(key,val){} to return {object} to merge into current node(s)
	 * @param {number|any} recurse - recurse deep into level to apply prop()
	 * @returns {object} tree data object
	 */
	function convertSimpleData(d, prop, recurse) {
	  if (typeof recurse === 'undefined') recurse = 1e9;
	  if (recurse < 1) prop = null;
	  if (!d || (typeof d === 'undefined' ? 'undefined' : _typeof(d)) !== 'object') {
	    // {abc:123} is shortcut for {abc:{"": [123]}}
	    return [Object.assign({ text: d, _leaf: true }, prop && prop(d))];
	  }
	  if (type.call(d) === ARRAY) {
	    return d.map(function (v) {
	      return convertSimpleData(v, prop, --recurse);
	    });
	  }
	  if (type.call(d) === OBJECT) {
	    var node = [];
	    for (var k in d) {
	      if (k === '' && type.call(d[k]) === ARRAY) {
	        node.push.apply(node, d[k].map(function (v) {
	          return type.call(v) === OBJECT ? v : Object.assign({ text: v, _leaf: true }, prop && prop(v));
	        }));
	      } else {
	        node.push(Object.assign({ text: k, children: convertSimpleData(d[k], prop, --recurse) }, prop && prop(k, d[k])));
	      }
	    }
	    return node;
	  }
	  return [];
	}

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

	/**
	 * getArraypath - get object using path array, from data object
	 * @param {object} arr - root data object
	 *									     if array, get index as target
	 *                       if object, get index of object.children as target
	 * @param {array} path - path to obtain using index array [0,1,0]
	 * @returns {object} target object at path
	 */
	function getArrayPath(arr, path) {
	  var obj = arr;
	  var texts = [];
	  for (var i = 0; i < path.length; i++) {
	    obj = type.call(obj) === ARRAY ? obj[path[i]] : obj && obj.children && obj.children[path[i]];
	    texts.push(obj.text);
	  }
	  return { obj: obj, texts: texts };
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
	        data = convertSimpleData(result.ptest_data);
	        console.log(data);
	        m.redraw();
	      });
	    }
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

	    function getAction(v) {
	      if (!args.onclose) return;
	      var node = [];
	      var emptyNode = !v.children || v.children.length == 0;
	      var leafNode = !emptyNode && v.children && v.children[0]._leaf;
	      if (!leafNode && !emptyNode) return node;
	      if (!v._leaf) {
	        var _ret = function () {
	          var path = getArrayPath(data, v._path).texts;
	          node.push(m('a[href=#]', { class: 'action', onmousedown: function onmousedown(e) {
	              e.stopPropagation();
	              e.preventDefault();
	              if (emptyNode) {
	                args.onclose({ action: 'add', path: path });
	              } else {
	                args.onclose({ action: 'play', path: path, file: v.children[0].name, url: result.url });
	              }
	            } }, emptyNode ? 'add' : 'play'));
	          return {
	            v: node
	          };
	        }();

	        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	      }
	    }

	    function getText(v) {
	      var text = v.text || '';
	      var node = v.name ? [m('span.name', '[' + v.name + ']'), m('br'), text] : [text];
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
	      if (!parent) return;
	      var arr = parent.children = parent.children || [];
	      var oldStack = [arr[idx], parent.children, parent._close];
	      undoList.push(function () {
	        parent._close = oldStack.pop();
	        parent.children = oldStack.pop();
	        parent.children.splice(idx, 0, oldStack.pop());
	      });
	      arr.splice(idx, 1);
	      // if it's no child, remove +/- symbol in parent
	      if (parent && !arr.length) delete parent.children, delete parent._close;
	    }
	    function insertNode(node, parent, _idx, isAfter) {
	      return addNode(parent, _idx, isAfter, node);
	    }
	    function insertChildNode(node, v, isLast) {
	      return addChildNode(v, isLast, v._leaf, node);
	    }
	    function addNode(parent, _idx, isAfter, existsNode) {
	      if (!parent) return;
	      var arr = parent.children = parent.children || [];
	      var idx = isAfter ? _idx + 1 : _idx;
	      var insert = existsNode || { text: '', _edit: true };
	      arr.splice(idx, 0, insert);
	      selected = { node: arr[idx], idx: idx, parent: parent };
	      undoList.push(function () {
	        // cannot rely on stored index, coze it maybe changed, recalc again
	        var idx = parent.children.indexOf(insert);
	        parent.children.splice(idx, 1);
	      });
	      return selected;
	    }
	    function addChildNode(v, isLast, isLeaf, existsNode) {
	      if (v._leaf) return;
	      v.children = v.children || [];
	      var arr = v.children;
	      var idx = isLast ? v.children.length : 0;
	      var insert = existsNode || { text: '', _edit: true };
	      v._close = false;
	      if (isLeaf) insert._leaf = true;
	      v.children.splice(idx, 0, insert);
	      selected = { node: v.children[idx], idx: idx, parent: v };
	      undoList.push(function () {
	        // cannot rely on stored index, coze it maybe changed, recalc again
	        var idx = arr.indexOf(insert);
	        arr.splice(idx, 1);
	        if (!v.children.length) delete v.children, delete v._close;
	      });
	      return selected;
	    }
	    function getInput(v) {
	      if (v._leaf) {
	        return [m('div', v.name), m('textarea', {
	          config: function config(el) {
	            return el.focus();
	          },
	          oninput: function oninput(e) {
	            if (isValidName(this.value)) v.text = this.value;else showInvalidMsg(v);
	          },
	          onkeydown: function onkeydown(e) {
	            if (e.keyCode == 13 && e.ctrlKey && !v._invalid) {
	              return v._edit = false;
	            }
	            if (e.keyCode == 27) {
	              var undo = undoList.pop();
	              if (undo) undo();
	              v._edit = false;
	              m.redraw();
	            }
	          }
	        }, v.text)];
	      } else {
	        return m('input', {
	          config: function config(el) {
	            el.focus();
	          },
	          value: v.text,
	          oninput: function oninput(e) {
	            v.text = this.value;
	          },
	          onkeydown: function onkeydown(e) {
	            if (e.keyCode == 13) return v._edit = false;
	            if (e.keyCode == 27) {
	              var undo = undoList.pop();
	              if (undo) undo();
	              v._edit = false;
	              m.redraw();
	            }
	          }
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
	    function interTree(arr, parent, path) {
	      path = path || [];
	      return !arr ? [] : {
	        tag: 'ul', attrs: {}, children: arr.map(function (v, idx) {
	          v._path = path.concat(idx);
	          v = typeof v == 'string' ? { text: v } : v;
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
	                selected = { node: v, idx: idx, parent: parent };

	                // save parent _pos when select node
	                if (parent) parent._pos = idx;

	                if (isInputActive(e.target)) return;else if (v._edit && !v._invalid) {
	                  v._edit = false;
	                  return;
	                }

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
	                  else addNode(parent, idx);
	                  return;
	                }
	                // remove node
	                if (isDown && e.altKey) {
	                  deleteNode(parent, idx);
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
	                var oldVal = v.text;
	                undoList.push(function () {
	                  setTimeout(function (_) {
	                    v.text = oldVal;
	                    v._edit = false;
	                    m.redraw();
	                  });
	                });
	              }
	            }, v),
	            children: [v.children ? m('a', v._close ? '+ ' : '- ') : [], v._edit ? getInput(v) : m(v._leaf ? 'pre.leaf' : 'span.node', [getText(v), getAction(v)])].concat(v._close ? [] : interTree(v.children, v, path.concat(idx)))
	          };
	        })
	      };
	    }

	    ctrl.getDom = function (_) {
	      return interTree(data);
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
	          sel.parent = newParent._path.length > 1 ? getArrayPath(data, newParent._path.slice(0, -1)).obj : null;
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
	    function doUndo(e) {
	      if (isInputActive()) return;
	      var undo = undoList.pop();
	      if (undo) undo();
	      m.redraw(true);
	    }
	    function doMove(e) {
	      if (!selected.parent) return;
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
	      if (!target || !selected || !target.parent || !selected.parent) return;
	      if (selected.node === target.node) return;
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
	          undoList.push(function () {
	            undoList.pop()();
	            undoList.pop()();
	          });
	        }
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
	      window.addEventListener('resize', onresize);
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

/***/ }
/******/ ]);