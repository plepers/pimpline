var brunchPlugins = require('./brunch');

Object.keys(brunchPlugins).forEach(function(key) {
  exports[key] = brunchPlugins[key];
});

['concat', 'copy', 'list', 'read', 'watch', 'write'].forEach(function(item) {
  exports[item] = require('./' + item);
});
