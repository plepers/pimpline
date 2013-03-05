var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var utils = require('./utils');

var lift = function(inputs, plugins, resolver) {
  return when.all(inputs.map(function(input) {
    var current = utils.itemsMatchingPath(plugins, input.path);
    if (current.length === 0) return input;
    return when.all(plugins.map(function(plugin) {
      var deferred = when.defer();
      plugin(input.data, input.path, function(error, result) {
        resolver(deferred, input, error, result);
      });
      return deferred.promise;
    }));
  }));
};

var lint = exports.lint = function(config, inputs) {
  var valid = utils.getMethods(plugins, 'lint');
  return lift(inputs, valid, function(deferred, input, error, result) {
    if (error) deferred.reject('Linting failed:' + error);
    deferred.resolve(input);
  });
};

var compile = exports.compile = function(config, inputs) {
  var valid = utils.getMethods(plugins, 'compile')[0];
  return lift(inputs, valid, function(deferred, input, error, result) {
    if (error) deferred.reject('Compilation failed:' + error);
    input.data = result;
    deferred.resolve(input);
  });
};

var optimize = exports.optimize = function(config, inputs) {
  var valid = utils.getMethods(plugins, 'optimize').concat(
    utils.getMethods(plugins, 'minify')
  );
  return lift(inputs, valid, function(deferred, input, error, result) {
    if (error) deferred.reject('Optimization failed:' + error);
    input.data = result;
    deferred.resolve(input);
  });
};

var onCompile = exports.onCompile = function(config, inputs) {
  var valid = utils.getMethods(plugins, 'onCompile');
  return lift(inputs, valid, function(deferred, input, error, result) {
    if (error) deferred.reject('onCompile failed:' + error);
    deferred.resolve(input);
  });
};
