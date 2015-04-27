var path = require('path');
var fs = require('fs');

exports = module.exports = (function(){

  return {

    /**
     * Resolve the appropriate template location based on the template name.
     * If the template exists in the wallboard directory, it will return that.
     * Otherwise it will return the default one from the Atlasboard directory.
     * @param {string} fileName
     * @param {function} cb
     */
    resolveTemplateLocation : function(fileName, cb) {
      var localWallboardLocation = path.join(process.cwd(), "templates", fileName);
      var defaultAtlasboardLocation = path.join(__dirname, "../templates", fileName);
      if (fs.existsSync(localWallboardLocation)) {
        cb(null, localWallboardLocation);
      }
      else {
        cb(null, defaultAtlasboardLocation);
      }
    }
  }

})();