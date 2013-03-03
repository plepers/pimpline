var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;

var concat = function(config, inputs) {
  console.log('concat');
  var groups = config.concat.groups;
  var outputs = Object.keys(groups).map(function(destination) {
    var params = groups[destination];
    var data = inputs
      .filter(params.filterer)
      .map(function(input) {
        return input.data;
      })
      .join('\n');

    return {path: destination, data: data};
  });

  return when(outputs);
};

module.exports = concat;
