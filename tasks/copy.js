var sysPath = require('path');
var mkdirp = require('mkdirp');
var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;

var getAssetDirectory = function(path, convention) {
  var splitted = path.split(sysPath.sep);
  return splitted
    .map(function(part, index) {
      var previous = index === 0 ? '' : splitted[index - 1] + sysPath.sep;
      var current = part;
      return previous + current;
    })
    .filter(function(path) {
      return convention({path: path});
    })[0];
};

var copy = function(config, inputs) {
  console.log('copy');

  var destinationDirectory = config.copy.destination;
  var filterer = config.copy.filterer;
  var filter = typeof filterer === 'function';
  var isValid = function(input) {
    return filter ? filterer(input) : true;
  };

  return when.all(inputs.map(function(input) {
    if (!isValid(input)) return input;

    var subPath = getAssetDirectory(input.path, filterer);
    var destination = sysPath.join(destinationDirectory, subPath);

    return touch(destination).then(function() {
      var deferred = when.defer();

      fs.createReadStream(input.path)
        .pipe(fs.createWriteStream(destination))
        .on('close', function(error) {
          if (error) return deferred.reject(error);
          deferred.resolve(input);
        });

      return deferred.promise;
    });
  }));
};

module.exports = copy;
