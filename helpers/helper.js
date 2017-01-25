//
/**************** CASPER JS FUNCTIONS ********************************/

var fs = require('fs')

var clientUtils = require('./clientutils.js').create({})


// from casper.js

// create new clientUtils instance
function initClientUtils(options) {
  page.evaluate(function() {
    _phantom.__utils__ = new _phantom.ClientUtils(__options)
  }.toString().replace('__options', JSON.stringify(options)))
}

function download(url, targetPath, method, data) {
  try {
    fs.write(targetPath, clientUtils.decode(callUtils("getBase64", url, method, data)), 'wb')
    console.log(format("Downloaded and saved resource in %s", targetPath))
  } catch (e) {
    console.log(format("Error while downloading %s to %s: %s", url, targetPath, e), "error")
  }

}

function callUtils (method) {
  'use strict'
  var args = [].slice.call(arguments, 1)
  var result = page.evaluate(function (method, args) {
    return _phantom.__utils__.__call(method, args)
  }, method, args)
  if (typeof (result)=='object' && result.__isCallError) {
    throw new Error(format('callUtils(%s) with args %s thrown an error: %s',
                            method, args, result.message))
  }
  return result
}

// from casper utils.js
/**
 * Formats a string with passed parameters. Ported from nodejs `util.format()`.
 *
 * @return String
 */
function format(f) {
    "use strict";
    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(/%[sdj%]/g, function _replace(x) {
        if (i >= len) return x;
        switch (x) {
        case '%s':
            return String(args[i++]);
        case '%d':
            return Number(args[i++]);
        case '%j':
            return JSON.stringify(args[i++]);
        case '%%':
            return '%';
        default:
            return x;
        }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
        if (x === null || typeof x !== 'object') {
            str += ' ' + x;
        } else {
            str += '[obj]';
        }
    }
    return str;
}

/************************ CASPER JS END *********************/


/**
 * Convert from blob, to regexp
 * repo: brianloveswords/urlglob
 * @param {string} blob pattern
 * @returns {regexp}
 */
function blob2regex (blob) {

  const safeLimitedGlob = '%LIMITED%' + Date.now() + '%'
  const safeGlob = '%GLOB%' + Date.now() + '%'
  const catchAll = '.*?'


  const regexp = '^' + blob

  // we want to store all "limited globs" so we don't escape
  // them with the rest of the regexp characters
        .replace(/\*\?/g, safeLimitedGlob)

  // excape all of the rest of the regexp chars
        .replace(/([()[{+.$^\\|?])/g, '\\$1')

    .replace(/\\[*]/g, safeGlob)
    .replace(/\*/g, catchAll)
    .replace(RegExp(safeGlob, 'g'), '*')
    .replace(RegExp(safeLimitedGlob, 'g'), '[^/]+')
    + '\\/?$'

  return new RegExp(regexp)
}

exports.initClientUtils = initClientUtils
exports.clientUtils = clientUtils
exports.format = format
exports.download = download
exports.callUtils = callUtils
exports.blob2regex = blob2regex

