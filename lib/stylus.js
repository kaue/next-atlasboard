var fs = require('fs');
var path = require('path');
var stylus = require('stylus');
var nib = require('nib');

exports = module.exports = (function () {

  var LOCAL_THEME = path.join(process.cwd(), 'themes', 'default', 'variables.styl');
  var ATLASBOARD_THEME = path.join(__dirname, '../assets', 'stylesheets', 'variables.styl');

  function getStylusObject(str) {
    var stylObj = stylus(str);
    stylObj.import(ATLASBOARD_THEME); // import Atlasboard core stylus variables

    if (fs.existsSync(LOCAL_THEME)) { // import local theme
      stylObj.import(LOCAL_THEME);
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
  }

})();