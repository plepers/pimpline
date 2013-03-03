var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var uglify = require('uglify-js');

var minify = function(config, inputs) {
  console.log('minify');
  return when.all(inputs.map(function(input) {
    if (!/\.js$/.test(input.path)) return input;
    console.log(input.path);

    try {
      input.data = uglify.minify(input.data, {fromString: true}).code;
    } catch (error) {
      throw new Error('UglifyJS minifier failed on ' + input.path + ': ' + error);
    }

    return input;
  }));
};

module.exports = minify;
