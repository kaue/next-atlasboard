module.exports.loadJobDependencies = function (jobWorker, io, config){

  var dependencies = { //decouple dependencies so the jobs are testeable
    request : require('request'),
    logger: require('./logger')(jobWorker, io)
  };

  if (config.get('hipchat').token) { //TODO: hipchat initialization should happen just once
    dependencies.hipchat = require('hipchat').create({api_key : config.hipchat.token});
  }

  return dependencies;
};