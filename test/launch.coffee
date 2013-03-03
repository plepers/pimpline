pimpline = require './pimpline'
_when = require 'when'

exports.tasks =
  build: ['read', 'copy', 'jshint', 'concat', 'minify', 'write']
  watch: ['watch']

exports.list =
  locations: '*'
  filterer: (input) -> input.path.indexOf('node_modules') is -1

exports.read =
  filterer: (input) -> yes# /\.json$/.test input.path

exports.copy =
  destination: 'public'
  filterer: (input) -> /\.zasd$/.test input.path

exports.concat =
  groups:
    'public/js.js':
      filterer: (input) ->
        /\.js$/.test(input.path)

exports.watch =
  tasks: exports.tasks.build
  locations: '*'

pimpline.watch(exports, (_) -> console.log _; _when _)
