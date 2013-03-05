var brunchPlugins = require('./brunch');

var run = function() {

  var config;

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
