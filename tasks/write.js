var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var fs = require('fs');
var mkdirp = require('mkdirp');

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

var write = function(config, inputs) {
  console.log('write');
  return when.all(inputs.map(function(input) {
    return touch(input.path)
      .then(function() {
        return wrap(fs.writeFile, input.path, input.data);
      })
      .then(function() {
        return input;
      });
  }));
};

module.exports = write;
