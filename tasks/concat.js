var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;

var sortAlphabetically, sortByAfter, sortByBefore, sortByVendor;

var sortAlphabetically = function(a, b) {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
};

var sortByVendor = function(config, a, b) {
  var aIsVendor = config.vendorConvention(a);
  var bIsVendor = config.vendorConvention(b);
  if (aIsVendor && !bIsVendor) {
    return -1;
  } else if (!aIsVendor && bIsVendor) {
    return 1;
  } else {
    return sortAlphabetically(a, b);
  }
};

var sortByAfter = function(config, a, b) {
  var hasA, hasB, indexOfA, indexOfB, _ref;
  indexOfA = config.after.indexOf(a);
  indexOfB = config.after.indexOf(b);
  _ref = [indexOfA !== -1, indexOfB !== -1], hasA = _ref[0], hasB = _ref[1];
  if (hasA && !hasB) {
    return 1;
  } else if (!hasA && hasB) {
    return -1;
  } else if (hasA && hasB) {
    return indexOfA - indexOfB;
  } else {
    return sortByVendor(config, a, b);
  }
};

var sortByBefore = function(config, a, b) {
  var hasA, hasB, indexOfA, indexOfB, _ref;
  indexOfA = config.before.indexOf(a);
  indexOfB = config.before.indexOf(b);
  _ref = [indexOfA !== -1, indexOfB !== -1], hasA = _ref[0], hasB = _ref[1];
  if (hasA && !hasB) {
    return -1;
  } else if (!hasA && hasB) {
    return 1;
  } else if (hasA && hasB) {
    return indexOfA - indexOfB;
  } else {
    return sortByAfter(config, a, b);
  }
};

var sortByConfig = function(files, config) {
  var cfg, _ref, _ref1, _ref2;
  if (toString.call(config) === '[object Object]') {
    cfg = {
      before: (_ref = config.before) != null ? _ref : [],
      after: (_ref1 = config.after) != null ? _ref1 : [],
      vendorConvention: (_ref2 = config.vendorConvention) != null ? _ref2 : function() {
        return false;
      }
    };
    return files.slice().sort(function(a, b) {
      return sortByBefore(cfg, a, b);
    });
  } else {
    return files;
  }
};

var sort = function(inputs, order) {
  return sortByConfig(inputs, order);
};

var concat = function(config, inputs) {
  console.log('concat');
  var groups = config.concat.groups;
  var outputs = Object.keys(groups).map(function(destination) {
    var params = groups[destination];
    var matched = inputs.filter(params.filterer);
    var sorted = sort(matched, params.order);
    var data = sorted.map(function(input) {return input.data;}).join('\n');
    return {path: destination, data: data};
  });

  return when(outputs);
};

module.exports = concat;
