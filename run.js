'use strict';
var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var _ = require('lodash');
var sysPath = require('path');
var tasks = require('./tasks');

var normalizeChecker = function(item) {
  switch (toString.call(item)) {
    case '[object RegExp]':
      return function(string) {
        return item.test(string);
      };
    case '[object Function]':
      return item;
    default:
      throw new Error("Normalizing item is invalid. Use RegExp or Function.");
  }
};

var createJoinConfig = function(configFiles) {
  var listToObj = function(acc, pair) {
    acc[pair[0]] = pair[1];
    return acc;
  };

  var types = Object.keys(configFiles);
  var result = {};
  types
    .map(function(type) {
      return configFiles[type].joinTo;
    })
    .map(function(joinTo) {
      var object;
      if (typeof joinTo === 'string') {
        object = {};
        object[joinTo] = /.+/;
        return object;
      } else {
        return joinTo;
      }
    })
    .map(function(joinTo, index) {
      var name = types[index];
      var re = (name === 'stylesheets') ? /\.css/ : /\.js$/;
      Object.keys(joinTo).map(function(generatedFilePath) {
        var current = {};
        current.filterer = function(input) {
          return re.test(input.path) && normalizeChecker(joinTo[generatedFilePath])(input.path);
        };
        current.order = configFiles[name].order;
        result[generatedFilePath] = current;
      });
    });
  return Object.freeze(result);
};

var getPlugins = function(path, brunchConfig) {
  var rootPath = sysPath.resolve(path);
  var nodeModules = rootPath + '/' + 'node_modules';
  var json;
  try {
    json = require(sysPath.join(rootPath, 'package.json'));
  } catch(err) {
    throw new Error('Current directory is not brunch application root path, as it does not contain package.json: ' + err);
  }
  var dependencies = Object.keys(
    _.extend(json.devDependencies || {}, json.dependencies || {})
  );
  return dependencies
    .filter(function(dependency) {
      return dependency !== 'brunch' && dependency.indexOf('brunch') !== -1;
    })
    .map(function(dependency) {
      return require(nodeModules + '/' + dependency);
    })
    .filter(function(plugin) {
      return plugin.prototype && plugin.prototype.brunchPlugin;
    })
    .map(function(plugin) {
      return new plugin(brunchConfig);
    });
};

var DIR = '/Users/paul/Development/test/a';

var transform = function(brunchConfig) {
  var config = {
    list: {
      locations: DIR + '/{app,test,vendor}/**/*'
    },
    read: {
      filterer: function(input) {return !(/assets/.test(input.path));}
    },
    copy: {
      destination: 'public',
      filterer: function(input) {return /assets/.test(input.path);}
    },
    concat: {groups: createJoinConfig(brunchConfig.files)},
    brunchPlugins: getPlugins(DIR, brunchConfig)
  };
  return config;
};

var run = function() {
  var brunchConfig = require('./config');
  var config = transform(brunchConfig);
  var bound = {};
  var log = function(stuff) {
    console.log(stuff);
    return when(stuff);
  };
  Object.keys(tasks).forEach(function(name) {
    bound[name] = tasks[name].bind(null, config);
  });

  bound.list()
    .then(bound.read)
    .then(bound.lint)
    .then(bound.compile, log)
    .then(bound.concat)
    .then(bound.optimize)
    .then(bound.onCompile);
};

run();
