var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var _ = require('lodash');
var utils = require('./utils');

var lift = function(inputs, plugins, methodName, mutator) {
  if (mutator == null) mutator = Function.prototype.constructor;
  if (plugins.length === 0) return when(inputs);
  console.log('lift0', methodName, _.pluck(inputs, 'path'));
  return when.all(inputs.map(function(input) {
    console.log('lift', methodName, input.path);

    var current = utils.itemsMatchingPath(plugins, input.path);
    if (current.length === 0) {
      console.log('Invalid', input.path, _.pluck(plugins, 'extension'));
      return when(input);
    }
    return when.all(current.map(function(plugin) {
      // console.log('when.all', input.path);
      var method = plugin[methodName];
      var deferred = when.defer();
      method(input.data, input.path, function(error, result) {
        console.log('Resolving', input.path);
        if (error) return deferred.reject(methodName + ' failed: ' + error);
        mutator(input, plugin, result);
        deferred.resolve(input);
      });
      return deferred.promise;
    }));
  }));
};

var lint = exports.lint = function(config, inputs) {
  console.log('lint');
  var plugins = config.brunchPlugins;
  var valid = utils.getMethods(plugins, 'lint');
  return lift(inputs, valid, 'lint');
};

var compile = exports.compile = function(config, inputs) {
  var plugins = config.brunchPlugins;
  var valid = utils.getMethods(plugins, 'compile');
  console.log('compile', _.pluck(inputs, 'path'));
  return lift(inputs, valid, 'compile', function(input, plugin, result) {
    var extension = plugin.type === 'stylesheet' ? 'css' : 'js';
    var origPath = input.path;
    input.origPath = origPath;
    input.path = origPath.replace(/\.\w+$/, '.' + extension);
    input.data = result;
  });
};

var optimize = exports.optimize = function(config, inputs) {
  console.log('optimize');
  var plugins = config.brunchPlugins;
  var valid = utils.getMethods(plugins, 'optimize').concat(
    utils.getMethods(plugins, 'minify')
  );
  // todo: support minify.
  return lift(inputs, valid, 'optimize', function(input, plugin, result) {
    input.data = result;
  });
};

var onCompile = exports.onCompile = function(config, inputs) {
  console.log('onCompile');
  var plugins = config.brunchPlugins;
  var valid = utils.getMethods(plugins, 'onCompile');
  return lift(inputs, valid, 'onCompile');
};
