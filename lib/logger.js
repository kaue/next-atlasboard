var tracer = require('tracer');
var path = require('path');
var extend = require("xtend");
var defaultLoggerConfig = require('../config/logger.js');

/**
 * Get configuration file from local wallboard installation
 * @returns {config}
 */

function getLocalConfiguration() {
  var localConfig = path.join(process.cwd(), "config", 'logger.js');
  try {
    return require(localConfig);
  } catch (e) {
    return {};
  }
}

var config = extend(defaultLoggerConfig, getLocalConfiguration());

module.exports = function (jobWorker, io) { //jobWorker and socket.io instance are optional

  var prefix = jobWorker ? ('[dashboard: ' + jobWorker.dashboard_name + '] [job: ' + jobWorker.job_name + '] ') : '[undefined worker]';

  config.transport = function (data) {
    var logText = prefix + ' ' + data.output;
    console.log(logText);
    if (io) {
      io.emit('server', {type: data.level, msg: logText});
    }
  };

  return tracer.colorConsole(config);
};