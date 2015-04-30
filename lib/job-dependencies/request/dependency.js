var projectPackageJson = require('../../../package.json');
var request = require('request');

module.exports = function (jobWorker, io, globalConfig){
  return request.defaults({
    jar: true,
    headers: {
      'User-Agent': 'AtlasBoard/' + projectPackageJson.version
    }
  });
};
