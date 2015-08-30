var fs = require('fs');
var path = require('path');
var extend = require('xtend');

exports = module.exports = function (configFileName) {

  function readConfigIfExists (path) {
    if (fs.existsSync(path)) {
      return require(path);
    }
    return {};
  }

  if (!path.extname(configFileName)) {
    configFileName = configFileName + '.js';
  }

  var localConfigFilePath = path.join(process.cwd(), 'config', configFileName);
  var atlasboardConfigFilePath = path.join(__dirname, '../config/', configFileName);

  return extend(readConfigIfExists(atlasboardConfigFilePath),
                readConfigIfExists(localConfigFilePath));
};