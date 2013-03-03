'use strict'

async = require 'async'
debug = require('debug')('brunch:source-file')
fs = require 'fs'
sysPath = require 'path'
logger = require 'loggy'

# A file that will be compiled by brunch.
module.exports = class SourceFile
  constructor: (@path, @compiler, @linters, @wrapper, @isHelper, @isVendor) ->
    debug "Initializing fs_utils.SourceFile: %s", JSON.stringify {
      @path, @isHelper, @isVendor
    }
    @type = @compiler.type
    @compilerName = @compiler.constructor.name

    # If current file is provided by brunch plugin, use fake path.
    if isHelper
      fileName = "brunch-#{@compilerName}-#{sysPath.basename @path}"
      @realPath = @path
      @path = sysPath.join 'vendor', 'scripts', fileName
    @cache = Object.seal {
      data: '', dependencies: [], compilationTime: null, error: null
    }
    Object.freeze this

  # Run all linters.
  _lint: (data, path, callback) ->
    if @linters.length is 0
      callback null
    else
      async.forEach @linters, (linter, callback) =>
        linter.lint data, path, callback
      , callback

  # Extract files that depend on current file.
  _getDependencies: (data, path, callback) ->
    if @compiler.getDependencies
      @compiler.getDependencies data, path, callback
    else
      callback null, []

  # Define a requirejs module in scripts & templates.
  # This allows brunch users to use `require 'module/name'` in browsers.
  #
  # path - path to file, contents of which will be wrapped.
  # source - file contents.
  #
  # Returns a wrapped string.
  _wrap: (data) ->
    if @type in ['javascript', 'template']
      @wrapper @path, data, (@isHelper or @isVendor)
    else
      data

  # Reads file and compiles it with compiler. Data is cached to `this.data`
  # in order to do compilation only if the file was changed.
  compile: (callback) ->
    callbackError = (type, stringOrError) =>
      string = if stringOrError instanceof Error
        stringOrError.toString().slice(7)
      else
        stringOrError
      error = new Error string
      error.brunchType = type
      @cache.error = error
      callback error

    realPath = if @isHelper then @realPath else @path
    fs.readFile realPath, (error, buffer) =>
      return callbackError 'Reading', error if error?
      fileContent = buffer.toString()
      @_lint fileContent, @path, (error) =>
        return callbackError 'Linting', error if error?
        @compiler.compile fileContent, @path, (error, result) =>
          return callbackError 'Compiling', error if error?
          @_getDependencies fileContent, @path, (error, dependencies) =>
            return callbackError 'Dependency parsing', error if error?
            @cache.dependencies = dependencies
            @cache.data = @_wrap result if result?
            @cache.compilationTime = Date.now()
            @cache.error = null
            callback null, @cache.data
