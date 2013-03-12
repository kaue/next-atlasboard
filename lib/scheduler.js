var logger = require('./logger');

module.exports = function() {
  var scheduler = {
    domain: require('domain').create(),

    initialize: function() {
      this.domain.on("error", function(error) {
        console.error(error.stack);
      });
    },

    schedule: function(job_worker, widgets, dependencies) {
      var thiz = this;
      var errorHandlingCallBack = this.domain.bind(job_worker.task);
      
      if (!job_worker.config.original_interval) // set original interval so we can get back to it
        job_worker.config.original_interval = job_worker.config.interval;

      errorHandlingCallBack(widgets, job_worker.config, dependencies, function(err, data){
        if (err){
          logger.warn('job ' + job_worker.job_name + ' executed with errors')
          job_worker.config.interval = job_worker.config.original_interval / 3;
        }
        else{
          logger.log('job ' + job_worker.job_name + ' executed')
          job_worker.config.interval = job_worker.config.original_interval;
        }
      });

      setTimeout(function(){ //schedule next job
        thiz.schedule(job_worker, widgets, dependencies);
      }, job_worker.config.interval || 60 * 1000);
    }

  };
  scheduler.initialize();
  return scheduler;
};
