/**
 * Job scheduler
 *
 * @param jobWorker
 * @param options
 * @constructor
 */

function Scheduler(jobWorker, options) {
  this.jobWorker = ensureSafeJobWorkerConfiguration(jobWorker);
  this.options = options || {};
  this.originalInterval = jobWorker.config.interval;
}

exports = module.exports = Scheduler;

/**
 * Schedules next job execution based on job's interval
 */

Scheduler.prototype.scheduleNext = function(){
  var self = this;
  setTimeout(function(){
    self.start();
  }, this.jobWorker.config.interval);
};

/**
 * Run job and schedule next
 */

Scheduler.prototype.start = function() {

  var self = this;

  function handleError(err) {
    self.jobWorker.dependencies.logger.error('executed with errors: ' + err);

    // in case of error retry in one third of the original interval or 1 min, whatever is lower
    self.jobWorker.config.interval = Math.min(self.originalInterval / 3, 60000);

    // -------------------------------------------------------------
    // Decide if we hold error notification according to widget config.
    // if the retryOnErrorTimes property found in config, the error notification
    // won´t be sent until we reach that number of consecutive errrors.
    // This will prevent showing too many error when connection to flaky, unreliable
    // servers.
    // -------------------------------------------------------------
    var sendError = true;
    if (self.jobWorker.firstRun === false) {
      if (self.jobWorker.config.retryOnErrorTimes) {
        self.jobWorker.retryOnErrorCounter = self.jobWorker.retryOnErrorCounter || 0;
        if (self.jobWorker.retryOnErrorCounter <= self.jobWorker.config.retryOnErrorTimes) {
          self.jobWorker.dependencies.logger.warn('widget with retryOnErrorTimes. attempts: ' +
              self.jobWorker.retryOnErrorCounter);
          sendError = false;
          self.jobWorker.retryOnErrorCounter++;
        }
      }
    }
    else {
      // this is the first run for this job so if it fails, we want to inform immediately
      // since it may be a configuration or dev related problem.
      self.jobWorker.firstRun = false;
    }

    if (sendError) {
      self.jobWorker.pushUpdate({error: err, config: {interval: self.jobWorker.config.interval}});
    }
  }

  function handleSuccess(data) {
    self.jobWorker.retryOnErrorCounter = 0; //reset error counter on success
    if (self.options.logSuccessfulJob !== false) {
      self.jobWorker.dependencies.logger.log('executed OK');
    }
    self.jobWorker.config.interval = self.originalInterval;
    if (!data) data = {};
    data.config = {interval: self.jobWorker.config.interval}; // give access to interval to client
    self.jobWorker.pushUpdate(data);
  }

  try {

    var cbCalled = false; // job_callback is meant to be executed only once per job run

    function jobCallback (err, data){
      if (cbCalled) {
        self.jobWorker.dependencies.logger.warn('WARNING!!!!: job_callback executed more than once for job ' +
        self.jobWorker.widget_item.job + ' in dashboard ' + self.jobWorker.dashboard_name);
      }
      cbCalled = true;

      if (err) {
        handleError(err);
      }
      else {
        handleSuccess(data);
      }
      self.scheduleNext();
    }

    self.jobWorker.task.call(self.jobWorker, self.jobWorker.config, self.jobWorker.dependencies, jobCallback);

  }
  catch (e) {
    self.jobWorker.dependencies.logger.error('Uncaught exception executing job: ' + e);
    handleError(e);
    self.scheduleNext();
  }
};

function ensureSafeJobWorkerConfiguration(jobWorker) {
  if (!jobWorker.config.interval) {
    jobWorker.config.interval = 60 * 1000; // default to 60 secs if not provided
  }
  else if (jobWorker.config.interval < 1000) {
    jobWorker.config.interval = 1000; // minimum 1 sec
  }

  return jobWorker;
}