module.exports = function (jobWorker, io, globalConfig){
  return require('request').defaults({jar: true});
};
