var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var fs = require('fs');

var read = function(config, inputs) {
  console.log('read');
  var filterer = config.read.filterer;
  var filter = typeof filterer === 'function';
  var isValid = function(input) {
    return filter ? filterer(input) : true;
  };

  var files = inputs
    .filter(function(input) {
      return input.stats.isFile();
    })
    .map(function(input) {
      if (!isValid(input)) return input;
      return wrap(fs.readFile, input.path, 'utf8').then(function(buffer) {
        input.data = buffer;
        return input;
      });
    });

  return when.all(files);
};

module.exports = read;
