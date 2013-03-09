module.exports = {
  files: {
    javascripts: {
      joinTo: {
        'javascripts/app.js': /^app/,
        'javascripts/vendor.js': /^vendor/,
        'test/javascripts/test.js': /^test[\\/](?!vendor)/,
        'test/javascripts/test-vendor.js': /^test[\\/](?=vendor)/
      },
      order: {
        before: ['vendor/scripts/console-polyfill.js', 'vendor/scripts/jquery-1.9.1.js', 'vendor/scripts/underscore-1.4.4.js', 'vendor/scripts/backbone-0.9.10.js'],
        after: ['test/vendor/scripts/test-helper.js']
      }
    },
    stylesheets: {
      joinTo: {
        'stylesheets/app.css': /^(app|vendor)/,
        'test/stylesheets/test.css': /^test/
      },
      order: {
        after: ['vendor/styles/helpers.css']
      }
    },
    templates: {
      joinTo: 'javascripts/app.js'
    }
  }
};
