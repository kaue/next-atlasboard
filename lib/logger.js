// facade for logger.
// use concrete implementation of logger here.

// var colors = require('colors');
// see this gist before enabling colors : https://gist.github.com/indexzero/1451296
var consoleLogger = require('tracer').colorConsole(
  {
    format : "   {{timestamp}} <{{title}}> {{message}}",
    dateformat : "HH:MM:ss.L"
    // filters : {
    //       log : colors.green,
    //       trace : colors.magenta,
    //       debug : colors.blue,
    //       info : colors.green,
    //       warn : colors.yellow,
    //       error : [ colors.red, colors.bold ]
    //   }
  });

function logToSocket(io, eventid, msg_type, text){
  if (io){
    io.emit(eventid, {type: msg_type, msg: text});
  }
}

module.exports = function (jobWorker, io){ //jobWorker and socket.io instance are optional

  var prefix = jobWorker ? ('[' + jobWorker.dashboard_name + '] [' + jobWorker.job_name + '] ') : '';

  return {
    log : function(msg){
      msg = prefix + msg;
      consoleLogger.info(msg);
      logToSocket(io, 'server', 'log', msg);
    },

    warn: function(msg){
      msg = prefix + msg;
      consoleLogger.warn(msg);
      logToSocket(io, 'server', 'warn', msg);
    },

    error: function (msg){
      msg = prefix + msg;
      consoleLogger.error(msg);
      logToSocket(io, 'server', 'error', msg);
    }
  };

};