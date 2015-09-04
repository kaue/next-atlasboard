var fs = require('fs');
var path = require('path');
var stylus = require('stylus');
var nib = require('nib');
var configManager = require('./config-manager');
var pathResolver = require('./path-resolver');

exports = module.exports = (function () {

  var themingConfig = configManager('theming');

  var localTheme = pathResolver.fromLocalWallboard('themes', themingConfig.theme || 'default', 'variables.styl');
  var atlasboardTheme = pathResolver.fromAtlasboard('../themes', themingConfig.theme || 'default', 'variables.styl');

  var defaultTheme = pathResolver.fromAtlasboard('../assets', 'stylesheets', 'variables.styl');

  function getStylusObject(str) {
    var stylObj = stylus(str);
    stylObj.import(defaultTheme); // import default core stylus variables

    if (fs.existsSync(localTheme)) { // try importing local theme first
      stylObj.import(localTheme);
    } else if (fs.existsSync(atlasboardTheme)) { // try importing from atlasboard's theme folder
      stylObj.import(atlasboardTheme);
    }
    return stylObj;
  }

  return {

    /**
     * Returns stylus middleware configured to use Atlasboard themes
     * @param options
     * @returns {*}
     */

    getMiddleware: function (options) {
      return stylus.middleware({
        src: options.src,
        dest: options.dest,

        compile: function (str, filePath) {
          var stylObj = getStylusObject(str);
          stylObj.set('filename', filePath)
              .set('warn', false)
              .set('compress', true)
              .use(nib());

          return stylObj;
        }
      });
    },

    /**
     * Process widget stylus
     * @param str
     * @param cb
     */

    getWidgetCSS: function (str, cb) {
      getStylusObject(str).render(cb);
    }
  };

})();