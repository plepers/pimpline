'use strict';
var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var brunchPlugins = require('./brunch');

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

var transform = function(brunchConfig) {
  var config = {
    list: {
      locations: '{app,test,vendor}'
    },
    read: {
      filterer: function(input) {return !(/assets/.test(input.path));}
    },
    copy: {
      destination: 'public',
      filterer: function(input) {return /assets/.test(input.path);}
    },
    concat: {groups: createJoinConfig(brunchConfig.files)}
  };
  return config;
}

var run = function() {
  var brunchConfig = {
    files: {
      javascripts: {
        joinTo: {
          'javascripts/app.js': /^app/,
          'javascripts/vendor.js': /^vendor/,
          'test/javascripts/test.js': /^test[\\/](?!vendor)/,
          'test/javascripts/test-vendor.js': /^test[\\/](?=vendor)/
        },
        order: {
          before: ['vendor/scripts/console-polyfill.js', 'vendor/scripts/jquery-1.9.1.js', 'vendor/scripts/underscore-1.4.4.js', 'vendor/scripts/backbone-0.9.10.js'],
          after: ['test/vendor/scripts/test-helper.js']
        }
      },
      stylesheets: {
        joinTo: {
          'stylesheets/app.css': /^(app|vendor)/,
          'test/stylesheets/test.css': /^test/
        },
        order: {
          after: ['vendor/styles/helpers.css']
        }
      },
      templates: {
        joinTo: 'javascripts/app.js'
      }
    }
  };

  var config = transform(brunchConfig);

  var bound = {};
  Object.keys(brunchPlugins).forEach(function(name) {
    bound[name] = brunchPlugins[name].bind(null, config);
  });

  bound.list()
    .then(bound.read)
    .then(bound.lint)
    .then(bound.compile)
    .then(bound.concat)
    .then(bound.optimize)
    .then(bound.write)
    .then(bound.onCompile);
};

run();
