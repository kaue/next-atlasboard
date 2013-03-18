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

      errorHandlingCallBack(job_worker.config, dependencies, function(err, data){
        if (err){
          logger.warn('job ' + job_worker.job_name + ' executed with errors: ' + err);
          job_worker.config.interval = job_worker.config.original_interval / 3;

          // -------------------------------------------------------------
          // Decide if we hold error notification according to widget config.
          // if the retryOnErrorTimes property found in config, the error notification
          // won´t be sent until we reach that number of consecutive errrors.
          // This will prevent showing too many error when connection to flaky, unreliable
          // servers.
          // -------------------------------------------------------------
          var sendError = true;
          if (job_worker.config.retryOnErrorTimes){
            job_worker.retryOnErrorCounter = job_worker.retryOnErrorCounter || 0;
            if (job_worker.retryOnErrorCounter <= job_worker.config.retryOnErrorTimes){
              logger.warn('widget with retryOnErrorTimes. attempts: '+ job_worker.retryOnErrorCounter);
              sendError = false;
              job_worker.retryOnErrorCounter ++;
            }
          }
          if (sendError){
            widgets.sendData({error : err });
          }
        }
        else{
          job_worker.retryOnErrorCounter = 0; //reset error counter on success
          logger.log('job ' + job_worker.job_name + ' executed OK');
          job_worker.config.interval = job_worker.config.original_interval;
          widgets.sendData(data);
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
