'use strict'

debug = require('debug')('brunch:asset')
fs = require 'fs'
mkdirp = require 'mkdirp'
sysPath = require 'path'
logger = require '../logger'

# RegExp that would filter invalid files (dotfiles, emacs caches etc).
ignored = (path) ->
  /(^[.#]|(?:__|~)$)/.test sysPath.basename path

# Copy file.
#
# source      - String. Path to file that will be copied.
# destination - String. File system path that will be created etc.
# callback    - Function.
#
# Returns nothing.
copy = (source, destination, callback) ->
  return callback() if ignored source
  copy = (error) ->
    return callback error if error?
    input = fs.createReadStream source
    output = fs.createWriteStream destination
    request = input.pipe output
    request.on 'close', callback
  parentDir = sysPath.dirname(destination)
  fs.exists parentDir, (exists) ->
    if exists
      copy()
    else
      mkdirp parentDir, copy

# Get first parent directory that matches asset convention.
#
# Example:
#   getAssetDirectory 'app/assets/thing/thing2.html', /assets/
#   # => app/assets/
#
# Returns String.
getAssetDirectory = (path, convention) ->
  splitted = path.split(sysPath.sep)
  # Creates thing like this
  # 'app/', 'app/assets/', 'app/assets/thing/', 'app/assets/thing/thing2.html'
  splitted
    .map (part, index) ->
      previous = if index is 0 then '' else splitted[index - 1] + sysPath.sep
      current = part + sysPath.sep
      previous + current
    .filter(convention)[0]

# A static file that shall be copied to public directory.
module.exports = class Asset
  constructor: (@path, config) ->
    directory = getAssetDirectory @path, config._normalized.conventions.assets
    @relativePath = sysPath.relative directory, @path
    @destinationPath = sysPath.join config.paths.public, @relativePath
    debug "Initializing fs_utils.Asset %s", JSON.stringify {
      @path, directory, @relativePath, @destinationPath
    }
    @error = null
    Object.seal this

  # Copy file to public directory.
  copy: (callback) ->
    copy @path, @destinationPath, (error) =>
      if error?
        err = new Error error
        err.brunchType = 'Copying'
        @error = err
      else
        @error = null
      callback @error
