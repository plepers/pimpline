var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var chokidar = require('chokidar');

function debounce(func, wait, immediate) {
  var args,
      result,
      thisArg,
      timeoutId;

  function delayed() {
    timeoutId = null;
    if (!immediate) {
      result = func.apply(thisArg, args);
    }
  }
  return function() {
    var isImmediate = immediate && !timeoutId;
    args = arguments;
    thisArg = this;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(delayed, wait);

    if (isImmediate) {
      result = func.apply(thisArg, args);
    }
    return result;
  };
}

var watch = function(config, inputs) {
  var deferred = when.defer();
  if (inputs == null) inputs = [];
  var watched = [];

  var wherePath = function(path) {
    for (var i = 0, length = watched.length; i < length; i++) {
      if (watched[i].path === path) return i;
    }
  };

  var tasks = config.watch.tasks;
  var executing = false;
  var initial;
  var log = function($1) {
    console.log(1488, '2139213918', $1);
  };

  // Execute tasks.
  var execute = debounce(function() {
    console.log('watch#execute');
    // if (executing) initial.reject();
    executing = true;
    initial = when(watched);
    tasks.forEach(function(task) {
      var nextTask = module.exports[task].bind(null, config);
      initial = initial.then(nextTask);
    });
    initial.then(function() {
      executing = false;
    }, log);
  }, 100);

  list(config).then(function(listInputs) {
    var paths = listInputs
      .filter(function(input) {
        return input.stats.isFile();
      })
      .map(function(input) {return input.path;});

    chokidar
      .watch(paths, {persistent: true})
      .on('add', function(path, stats) {
        watched.push({
          path: path, stats: stats,
          changedAt: Date.now()
        });
        execute();
      })
      .on('change', function(path, stats) {
        var current = watched[wherePath(path)];
        current.changedAt = Date.now();
        current.stats = stats;
        execute();
      })
      .on('remove', function(path) {
        delete watched[wherePath(path)];
        execute();
      })
      .on('error', function(error) {
        if (executing) initial.cancel();
        throw new Error(error);
      });
  });

  return deferred.promise;
};

module.exports = watch;
