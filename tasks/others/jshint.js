var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var jshint = require('jshint').JSHINT;

var formatError = function(input, error) {
  var evidence;
  if (error.evidence) {
    evidence = '\n\n' + error.evidence + '\n';
  } else {
    evidence = '\n';
  }
  return error.reason + ' ' + (error.id + ' ' || '') + 'in file ' + input.path + ' @ ' + error.line + ':' + error.character;
};

var jshintTask = function(config, inputs) {
  console.log('jshintTask');

  return when(inputs.map(function(input) {
    if (!/\.js$/.test(input.path)) return input;

    var success = jshint(input.data, {node: true, eqnull: true});
    if (!success) {
      throw new Error(jshint.errors
        .filter(function(error) {return error != null;})
        .map(formatError.bind(null, input))
        .join('\n'));
    }
    return input;
  }));
};

module.exports = jshintTask;
