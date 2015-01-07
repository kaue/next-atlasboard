/**
 * Scheduler
 * 
 * @param  {boolean} options.logSuccessfulJob logs output when job is executed succesfully (verbose)
 * @return {object}  scheduler
 */

module.exports = function(options) {

  options = options || {};

  var scheduler = {
    domain: require('domain').create(),

    initialize: function() {
      this.domain.on("error", function(error) {
        console.error(error.stack);
      });
    },

    scheduleNext: function(job_worker, widgets) {
      var thiz = this;
      setTimeout(function(){
        thiz.schedule(job_worker, widgets);
      }, job_worker.config.interval || 60 * 1000);
    },

    schedule: function(job_worker, widgets) {

      function handleError(err) {
        job_worker.dependencies.logger.error('executed with errors: ' + err);

        // in case of error retry in one third of the original interval or 1 min, whatever is lower
        job_worker.config.interval = Math.min(job_worker.config.original_interval / 3, 60000);

        // -------------------------------------------------------------
        // Decide if we hold error notification according to widget config.
        // if the retryOnErrorTimes property found in config, the error notification
        // won´t be sent until we reach that number of consecutive errrors.
        // This will prevent showing too many error when connection to flaky, unreliable
        // servers.
        // -------------------------------------------------------------
        var sendError = true;        
        if (job_worker.firstRun === false) {
          if (job_worker.config.retryOnErrorTimes) {
            job_worker.retryOnErrorCounter = job_worker.retryOnErrorCounter || 0;
            if (job_worker.retryOnErrorCounter <= job_worker.config.retryOnErrorTimes) {
              job_worker.dependencies.logger.warn('widget with retryOnErrorTimes. attempts: '
                + job_worker.retryOnErrorCounter);
              sendError = false;
              job_worker.retryOnErrorCounter++;
            }
          }
        }
        else {
          // this is the first run for this job so if it fails, we want to inform immediately
          // since it may be a configuration or dev related problem.
          job_worker.firstRun = false;
        }

        if (sendError) {
          widgets.sendData({error: err, config: {interval: job_worker.config.interval}});
        }
      }

      var thiz = this;
      var task = this.domain.bind(job_worker.task);

      if (!job_worker.config.interval){
        job_worker.config.interval = 60 * 1000; // default to 60 secs if not provided
      }
      else if (job_worker.config.interval < 1000){
        job_worker.config.interval = 1000; // minium 1 sec
      }

      if (!job_worker.config.original_interval) // set original interval so we can get back to it
        job_worker.config.original_interval = job_worker.config.interval;

      try {

        // TODO
        // - We are still passing job_worker.dependencies as a parameter for backwards compatibility
        // but makes more sense to be passed as a property of job_worker. 
        // - The same with config
        task.call(job_worker, job_worker.config, job_worker.dependencies, function(err, data){
          if (err) {
            handleError(err);
          }
          else {
            job_worker.retryOnErrorCounter = 0; //reset error counter on success
            if (options.logSuccessfulJob !== false) {
              job_worker.dependencies.logger.log('executed OK');
            }
            job_worker.config.interval = job_worker.config.original_interval;
            if (!data) data = {};
            data.config = {interval: job_worker.config.interval}; // give access to interval to client
            widgets.sendData(data);
          }
          thiz.scheduleNext(job_worker, widgets);
        });
      }
      catch (e) {
        job_worker.dependencies.logger.error('Uncaught exception executing job: ' + e);
        handleError(e);
        thiz.scheduleNext(job_worker, widgets);
      }
    }

  };
  scheduler.initialize();
  return scheduler;
};
