var tracer = require('tracer');
var configManager = require('./config-manager');

var config = configManager('logging');

module.exports = function (jobWorker, io) { //jobWorker and socket.io instance are optional

  var prefix = jobWorker ? ('[dashboard: ' + jobWorker.dashboard_name + '] [job: ' + jobWorker.job_name + '] ') : '';

  config.transport = function (data) {
    var logText = prefix + data.output;
    console.log(logText);
    if (io) {
      io.emit('server', {type: data.level, msg: logText});
    }
  };

  return tracer.colorConsole(config);
};