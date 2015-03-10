"use strict";

var fs = require("fs");
var traverse = require("traverse");

var generalLogger = require('./logger')();

var envVarRegex = /\$\{([^}]+)\}/;

module.exports = function(file) {
  var globalAuth = {};
  try {
    globalAuth = JSON.parse(fs.readFileSync(file));

    traverse(globalAuth).forEach(function(val) {
      if ("string" === typeof val) {
        var match, modified;
        while ((match = envVarRegex.exec(val)) !== null) {
          var envName = match[1];
          var envVal = process.env[envName];
          if (envVal === undefined) {
            generalLogger.warn("-- Authentication file referenced var ${" + envName + "}, which was not present in environment");
            envVal = "";
          }
          val = val.substring(0, match.index) + envVal + val.substring(match.index + match[0].length);
          modified = true;
        }

        if (modified === true) {
          this.update(val);
        }
      }
    });
  }
  catch(e){
    generalLogger.warn("-- Authentication file not found in " + file + 
        ". You may want to create your own. You can also define the place where the credential file will be located " +
        " by editing the general configuration property 'authentication-file-path' -- ");
  }

  return globalAuth;
};
