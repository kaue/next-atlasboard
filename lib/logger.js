//facade for logger.
//use concrete implementation of logger here.

//var logger = require('tracer').colorConsole();

var logger = require('tracer').colorConsole(
  {
      format : "{{timestamp}} <{{title}}> {{message}}",
      dateformat : "HH:MM:ss.L"
  });


module.exports = {
  log : function(msg){
    logger.log(msg);
  },
  warn: function(msg){
    logger.warn(msg);
  },

  error: function (msg){
    logger.error(msg);
  }
};