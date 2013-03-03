# pimpline

Task.js-compilant incremental async pipeline for node.js.

Currently only a prototype, WIP.

## Workflow

```coffeescript
# “Input” is a simple object. Minimal example: {path: 'a.js'}.
list()          # List inputs. Returns {path: '...', stats: file-stats}.
  .then(read)   # Read inputs. Adds data prop to input. => {path, stats, data}
  .then(copy)   # Copy inputs. Passes data to next input unchanged.
  .then(jshint) # JSHint inputs. Stops pipeline if needed.
  .then(uglify) # Minify inputs. Changes `data` in-place.
  .then(concat) # Concatenate inputs with config, sort. Generates new inputs.
  .then(write)  # Write the inputs.
```

## Code

See `test` directory. Launch with `coffee launch.coffee`.

Config example:

```coffeescript
exports.list =
  locations: '{app,test,vendor}'

exports.read =
  filterer: (input) ->
    not /assets/.test input.path

exports.copy =
  destination: 'public'
  filterer: (input) ->
    /assets/.test input.path

exports.concat =
  groups:
    'javascripts/app.js':
      filterer: (input) ->
        /\.js$/.test(input.path) and /^app/.test input.path

    'javascripts/vendor.js':
      filterer: (input) ->
        /\.js$/.test(input.path) and /^app/.test input.path

      order:
        before: [
          'vendor/scripts/console-polyfill.js'
          'vendor/scripts/jquery-1.9.1.js'
          'vendor/scripts/underscore-1.4.4.js'
          'vendor/scripts/backbone-0.9.10.js'
        ]
        after: [
          'test/vendor/scripts/test-helper.js'
        ]

    'test/javascripts/test.js':
      filterer: (input) ->
        /\.js$/.test(input.path) and /^test[\\/](?!vendor)/.test input.path

    'test/javascripts/test-vendor.js':
      filterer: (input) ->
        /\.js$/.test(input.path) and /^test[\\/](?=vendor)/.test input.path

    'stylesheets/app.css':
      filterer: (input) ->
        /\.css$/.test(input.path) and /^(app|vendor)/.test input.path

      order:
        after: ['vendor/styles/helpers.css']

    'test/stylesheets/test.css':
      filterer: (input) ->
        /\.css$/.test(input.path) and /^test/.test input.path

exports.tasks =
  build: [
    'copy'
    'read'
    'lint'
    'compile'
    'wrap'
    'concat'
    'minify'
    'write'
  ]
```


## License

The MIT License (MIT)

Copyright (c) 2013 Paul Miller (http://paulmillr.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
