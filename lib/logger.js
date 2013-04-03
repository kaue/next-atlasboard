// facade for logger.
// use concrete implementation of logger here.

var logger = require('tracer').colorConsole(
  {
    format : "{{timestamp}} <{{title}}> {{message}}",
    dateformat : "HH:MM:ss.L"
  });

function log_to_socket(io, eventid, msg_type, text){
  if (io){
    io.of("/log").emit(eventid, {type: msg_type, msg: text});
  }
}

module.exports = function (jobWorker, io){ //jobWorker and socket.io instance are optional

  var prefix = jobWorker ? ('[' + jobWorker.dashboard_name + '] [' + jobWorker.job_name + '] ') : '';
  
  return {
    log : function(msg){
      msg = prefix + msg;
      logger.log(msg);
      log_to_socket(io, 'server', 'log', msg);
    },
    warn: function(msg){
      msg = prefix + msg;
      logger.warn(msg);
      log_to_socket(io, 'server', 'warn', msg);
    },

    error: function (msg){
      msg = prefix + msg;
      logger.error(msg);
      log_to_socket(io, 'server', 'error', msg);
    }
  };

};