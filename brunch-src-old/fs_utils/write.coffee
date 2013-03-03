'use strict'

async = require 'async'
sysPath = require 'path'
GeneratedFile = require './generated_file'

exports.formatError = (error, path) ->
  "#{error.brunchType} of '#{path}' failed. #{error.toString().slice(7)}"

getPaths = (sourceFile, joinConfig) ->
  sourceFileJoinConfig = joinConfig[sourceFile.type + 's'] or {}
  Object.keys(sourceFileJoinConfig).filter (generatedFilePath) ->
    checker = sourceFileJoinConfig[generatedFilePath]
    checker sourceFile.path

getFiles = (fileList, config, joinConfig, minifiers) ->
  map = {}

  fileList.files.forEach (file) ->
    paths = getPaths file, joinConfig
    paths.forEach (path) ->
      map[path] ?= []
      map[path].push file

  Object.keys(map).map (generatedFilePath) ->
    sourceFiles = map[generatedFilePath]
    fullPath = sysPath.join config.paths.public, generatedFilePath
    new GeneratedFile fullPath, sourceFiles, config, minifiers

changedSince = (startTime) -> (generatedFile) ->
  generatedFile.sourceFiles.some (sourceFile) ->
    sourceFile.cache.compilationTime >= startTime

gatherErrors = (generatedFiles) ->
  errors = []
  generatedFiles
    .forEach (generatedFile) ->
      generatedFile.sourceFiles
        .filter (sourceFile) ->
          sourceFile.cache.error?
        .forEach (sourceFile) ->
          cache = sourceFile.cache
          errors.push exports.formatError cache.error, sourceFile.path

  if errors.length > 0
    errors
  else
    null

module.exports = write = (fileList, config, joinConfig, minifiers, startTime, callback) ->
  files = getFiles fileList, config, joinConfig, minifiers
  changed = files.filter(changedSince startTime)
  error = gatherErrors files
  return callback error if error?
  async.forEach changed, ((file, next) -> file.write next), (error) ->
    return callback error if error?
    callback null, changed
