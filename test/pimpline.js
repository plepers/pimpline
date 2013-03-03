'use strict';

var glob = require('glob');
var when = require('when');
var nodeWhen = require('when/node/function');
var wrap = nodeWhen.call;
var fs = require('fs');

var getStats = function(path) {
  return wrap(fs.stat, path).then(function(stats) {
    return {path: path, stats: stats};
  });
};

var touch = function(path) {
  var deferred = when.defer();
  var parentPath = sysPath.dirname(path);

  fs.exists(parentPath, function(exists) {
    if (exists) return deferred.resolve();
    mkdirp(parentPath, function(error) {
      if (error) return deferred.reject(error);
      deferred.resolve();
    });
  });

  return deferred.promise;
};

// inputs is unused.
var list = function(config, inputs) {
  console.log('list');
  var filterer = config.list.filterer;
  var filter = typeof filterer === 'function';
  var isValid = function(input) {
    return filter ? filterer(input) : true;
  };

  return wrap(glob, config.list.locations)
    .then(function(files) {
      return when.all(files.map(getStats));
    })
    .then(function(inputs) {
      return inputs.filter(isValid);
    });
};

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

var sysPath = require('path');
var mkdirp = require('mkdirp');

var getAssetDirectory = function(path, convention) {
  var splitted = path.split(sysPath.sep);
  return splitted.map(function(part, index) {
    var previous = index === 0 ? '' : splitted[index - 1] + sysPath.sep;
    var current = part;
    return previous + current;
  }).filter(function(path) {
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

var jshint = require('jshint').JSHINT;

var jshintTask = function(config, inputs) {
  console.log('jshintTask');

  var formatError = function(input, error) {
    var evidence;
    if (error.evidence) {
      evidence = '\n\n' + error.evidence + '\n';
    } else {
      evidence = '\n';
    }
    return error.reason + ' ' + (error.id + ' ' || '') + 'in file ' + input.path + ' @ ' + error.line + ':' + error.character;
  };

  var lintInput = function(input) {
    if (!/\.js$/.test(input.path)) return input;

    var success = jshint(input.data, {node: true, eqnull: true});
    if (!success) {
      throw new Error(jshint.errors
        .filter(function(error) {return error != null;})
        .map(formatError.bind(null, input))
        .join('\n'));
    }
    return input;
  };

  return when(inputs.map(lintInput));
};

var concat = function(config, inputs) {
  console.log('concat');
  var groups = config.concat.groups;
  var outputs = Object.keys(groups).map(function(destination) {
    var params = groups[destination];
    return {
      path: destination,
      data: inputs.filter(params.filterer).map(function(input) {
        return input.data;
      }).join('\n')
    };
  });

  return when(outputs);
};

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

var write = function(config, inputs) {
  console.log('write');
  return when.all(inputs.map(function(input) {
    return touch(input.path).then(function() {
      return wrap(fs.writeFile, input.path, input.data);
    }).then(function() {
      return input;
    });
  }));
};

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

module.exports = {
  list: list, read: read, copy: copy, jshint: jshintTask,
  concat: concat, minify: minify, write: write, watch: watch
};
