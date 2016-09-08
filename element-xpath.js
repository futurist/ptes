// from https://github.com/AlexBinno/element-xpath

var ElementXPath = (function () {
  return function (element, options) {
    // default options
    var defaultOptions = {
      unique: true,
      startWithClosestId: false,
      directDescendant: false
    }
    for (var key in options) {
      defaultOptions[key] = options[key];
    }
    var options = defaultOptions;
    // make sure element is a single dom node
    if (element.nodeType != 1) {
      return null;
    }
    // array of individual element selectors
    var paths = [];
    // iterate through parent elements
    for (; element && element.nodeType == 1; element = element.parentNode) {
      // make sure element exists
      if (!element || !element.nodeType) {
        return null;
      }
      var tag = element.nodeName.toLowerCase();
      var selector = tag;
      var selectorAttrs = [];
      // option to make path unique
      if (options.unique === true) {
        var siblingIndex = 0;
        for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
          if (sibling.nodeType != 1) {
            continue;
          }
          // xpath indices are equivalent to css :nth-of-type() pseudo selector
          if (sibling.nodeName == element.nodeName) {
            siblingIndex++;
          }
        }
        if (tag != 'html') {
          selector += "[" + (siblingIndex + 1) + "]";
        }
      } else {
        // if element has an id, add them to selector
        if (element.id) {
          selectorAttrs.push("@id='" + element.id + "'");
        }
        // get classList
        var className = element.className;
        var classList = [];
        if (className !== '') {
          classList = className.split(/\s+/);
        }
        // if element has 1 or more classes, add them to selector
        if (classList.length >= 1) {
          for (var i = 0; i < classList.length; i++) {
            selectorAttrs.push("contains(concat(' ', @class, ' '), ' " + classList[i] + " ')");
          }
        }
        // if has attributes
        if (selectorAttrs.length >= 1) {
          selector += '[' + selectorAttrs.join(' and ') + ']';
        }
      }
      // add individual selector to paths array
      paths.splice(0, 0, selector);
      // option to make path start with the nearest element with an id
      if (options.startWithClosestId === true) {
        if (element.id) {
          break;
        }
      }
    }
    // turn paths array into string
    paths = paths.length ? paths.join(options.directDescendant || options.unique ? '/' : '//') : null;
    return paths;
  }
})();
