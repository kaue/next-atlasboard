var jobsManager = require('./job-manager');
var configManager = require('./config-manager');
var loadGlobalAuth = require('./global-auth');
var EventQueue = require("./event-queue");
var Scheduler = require("./scheduler");
var jobDependencyManager = require('./job-dependencies/loader.js');
var logger = require('./logger')();

exports = module.exports = (function () {

  function init(options, cb) {

    jobsManager.getJobs(options, function (err, jobWorkers) {
      if (err) {
        return cb(err);
      }

      var globalAuth = loadGlobalAuth(configManager('auth').authenticationFilePath);

      if (!jobWorkers.length) {
        logger.warn("No jobs found matching the current configuration and filters");
      }
      else {
        var eventQueue = new EventQueue(options.deps.io);
        jobWorkers.forEach(function (jobWorker, index) {

          // unique id for this widget in the wallboard
          jobWorker.id = jobWorker.dashboard_name + '-' +
              (jobWorker.widget_item.r || jobWorker.widget_item.row) + '-' +
              (jobWorker.widget_item.c || jobWorker.widget_item.col);

          jobWorker.pushUpdate = function (data) {
            eventQueue.send(jobWorker.id, data);
          };

          // add security info
          jobWorker.config.globalAuth = globalAuth;

          if (jobWorker.widget_item.enabled !== false) {

            jobDependencyManager.fillDependencies(jobWorker, options.deps);

            if (jobWorker.onInit) {
              jobWorker.onInit.call(jobWorker, jobWorker.config, jobWorker.dependencies);
            }

            if (jobWorker.onRun) {
              setTimeout(function () {
                var scheduler = new Scheduler(jobWorker);
                scheduler.start();
              }, index * 1500); // avoid a concurrency peak on startup
            }
          }
          else { // job is disabled
            jobWorker.pushUpdate({error: 'disabled'});
          }

        });
      }
      return cb();
    });
  }

  return {
    init: init
  }

})();