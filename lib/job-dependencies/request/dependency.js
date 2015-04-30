module.exports = function (jobWorker, io, globalConfig){

  var projectPackageJson = require('../../../package.json');

  return require('request').defaults({
    jar: true,
    headers: {
      'User-Agent': 'AtlasBoard/' + projectPackageJson.version
    }
  });
};
