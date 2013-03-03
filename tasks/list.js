var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;

var glob = require('glob');
var fs = require('fs');

var getStats = function(path) {
  return wrap(fs.stat, path).then(function(stats) {
    return {path: path, stats: stats};
  });
};

var touch = function(path) {
  var deferred = when.defer();
  var parentPath = sysPath.dirname(path);

  fs.exists(parentPath, function(exists) {
    if (exists) return deferred.resolve();
    mkdirp(parentPath, function(error) {
      if (error) return deferred.reject(error);
      deferred.resolve();
    });
  });

  return deferred.promise;
};

// inputs is unused.
var list = function(config, inputs) {
  console.log('list');
  var filterer = config.list.filterer;
  var filter = typeof filterer === 'function';
  var isValid = function(input) {
    return filter ? filterer(input) : true;
  };

  return wrap(glob, config.list.locations)
    .then(function(files) {
      return when.all(files.map(getStats));
    })
    .then(function(inputs) {
      return inputs.filter(isValid);
    });
};

module.exports = list;
