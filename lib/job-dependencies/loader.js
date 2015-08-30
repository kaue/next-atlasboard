var path = require('path');
var fs = require('fs');

module.exports.fillDependencies = function (jobWorker, deps) {

  jobWorker.dependencies = {};

  var dependencyFolders = fs.readdirSync(__dirname);
  for (var i = dependencyFolders.length - 1; i >= 0; i--) {
    var folderPath = path.join(__dirname, dependencyFolders[i]);
    var stat = fs.statSync(folderPath);
    if (stat.isDirectory()) {
      try {
        var depPath = path.join(folderPath, 'dependency.js');
        jobWorker.dependencies[dependencyFolders[i]] = require(depPath)(jobWorker, deps);
      }
      catch (e) {
        throw 'error resolving dependency ' + dependencyFolders[i] + '. ERROR:' + e;
      }
    }
  }

};