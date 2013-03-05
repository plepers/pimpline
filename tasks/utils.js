var utils = exports;

var pathMatchesPlugin = exports.pathMatchesPlugin = function(path, plugin) {
  var pattern;
  if (plugin.pattern) {
    pattern = plugin.pattern;
  } else if (plugin.extension) {
    pattern = RegExp('\\.' + plugin.extension);
  } else {
    pattern = /$.^/; // Match nothing.
  }
  return pattern.test(path);
};

var functionExists = exports.functionExists = function(name, object) {
  return typeof object[name] === 'function';
};

var getMethods = exports.getMethods = function(list, name) {
  return list
    .filter(function(item) {
      return typeof item[name] === 'function';
    })
    .map(function(item) {
      return item[name].bind(item);
    });
};

var itemsMatchingPath = exports.itemsMatchingPath = function(list, path) {
  return list.filter(function(item) {
    return utils.pathMatchesPlugin(path, item);
  });
};
