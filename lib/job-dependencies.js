module.exports.loadJobDependencies = function (jobWorker, io, config){

  var dependencies = { //decouple dependencies so the jobs are testeable
    request : require('request'),
    logger: require('./logger')(jobWorker, io)
  };

  if (jobWorker.config.globalAuth.hipchat) { //TODO: hipchat initialization should happen just once
    dependencies.hipchat = require('./hipchat').create({api_key : jobWorker.config.globalAuth.hipchat.token });
  }

  return dependencies;
};