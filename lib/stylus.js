var fs = require('fs');
var path = require('path');
var stylus = require('stylus');
var nib = require('nib');
var configManager = require('./config-manager');

exports = module.exports = (function () {

  var themingConfig = configManager('theming');

  var localTheme = path.join(process.cwd(), 'themes', themingConfig.theme || 'default', 'variables.styl');
  var atlasboardTheme = path.join(__dirname, '../assets', 'stylesheets', 'variables.styl');

  function getStylusObject(str) {
    var stylObj = stylus(str);
    stylObj.import(atlasboardTheme); // import Atlasboard core stylus variables

    if (fs.existsSync(localTheme)) { // import local theme
      stylObj.import(localTheme);
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