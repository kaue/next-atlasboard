var fs = require('fs'),
    path = require('path');

module.exports = function(configFilePath) {

  if (!configFilePath){
    configFilePath = path.join(process.cwd(), "/config/atlasboard.json");
  }
  var config, valid;
  var exists = fs.existsSync(configFilePath);
  if (exists){
    try{
      config = JSON.parse(fs.readFileSync(configFilePath));
      valid = true;
    }
    catch(e){
      console.error(e);
    }
  }

  return {
    exists: function (key){
      return exists;
    },

    valid: function (key){
      return !!valid;
    },

    get: function (key){
      if (config){
        return config[key];
      }
      return null;
    }
  }
}