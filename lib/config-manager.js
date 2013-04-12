var fs = require('fs'),
    path = require('path'),
    extend = require('xtend'),
    helpers = require('./helpers');

module.exports = function(wallboardConfigFilePath, atlasboardConfigFilePath) {
  if (!wallboardConfigFilePath){
    wallboardConfigFilePath = path.join(process.cwd(), "/config/atlasboard.json");
  }

  if (!atlasboardConfigFilePath){
    atlasboardConfigFilePath = path.join(__dirname, "../config/defaultAtlasboard.json");
  }

  var config = extend(
    helpers.getJSONFromFile(atlasboardConfigFilePath), 
    helpers.getJSONFromFile(wallboardConfigFilePath)
  );

  return {
    get: function (key){
      if (config){
        return config[key];
      }
      return null;
    }
  }
}