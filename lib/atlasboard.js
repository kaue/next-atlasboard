var path = require('path');
var jobsManager = require('./job-manager');
var configManager = require('./config-manager');
var loadGlobalAuth = require('./global-auth');
var packageDependencyManager = require('./package-dependency-manager');
var EventQueue = require("./event-queue");
var Scheduler = require("./scheduler");
var logger = require('./logger')();
var jobDependencyManager = require('./job-dependencies/loader.js');
var webServer = require('./webapp/server');
var express = require('express');

module.exports = function (options, callback) {

  options = options || {};

  var packagesLocalFolder = path.join(process.cwd(), "/packages");
  var packagesAtlasboardFolder = path.join(__dirname, "../packages");

  var configPath = path.join(process.cwd(), "/config");

  var runner = function () {

    //-----------------------------------
    // Init web server
    //-----------------------------------

    var app = express();
    var httpServer = webServer(app, {
      port: options.port,
      packageLocations: [packagesLocalFolder, packagesAtlasboardFolder]
    });

    //-----------------------------------
    // Init socket.io server
    //-----------------------------------

    var io = require('socket.io').listen(httpServer, {
      'log level': 2
    });
    var startTime = new Date().getTime();
    io.on('connection', function (socket) {
      socket.emit("serverinfo", {startTime: startTime});
    });

    //-----------------------------------
    // Init jobs / scheduler
    //-----------------------------------

    var jobOptions = {
      packagesPath: [packagesLocalFolder, packagesAtlasboardFolder],
      configPath: configPath,
      filters: options.filters
    };

    jobsManager.getJobs(jobOptions, function (err, jobWorkers) {
      if (err) {
        return callback(err);
      }

      var globalAuth = loadGlobalAuth(configManager('auth').authenticationFilePath);

      if (!jobWorkers.length) {
        logger.warn("No jobs found matching the current configuration and filters");
      }
      else {
        var eventQueue = new EventQueue(io);
        jobWorkers.forEach(function (jobWorker, index) {

          // unique id for this widget in the wallboard
          jobWorker.id = jobWorker.dashboard_name + '-' + jobWorker.widget_item.row + '-' +
              jobWorker.widget_item.col;

          jobWorker.pushUpdate = function (data) {
            eventQueue.send(jobWorker.id, data);
          };

          // add security info
          jobWorker.config.globalAuth = globalAuth;

          if (jobWorker.widget_item.enabled !== false) {

            jobDependencyManager.fillDependencies(jobWorker, {
              io: io,
              app: app
            });

            if (jobWorker.onInit) {
              jobWorker.onInit.call(jobWorker, jobWorker.config, jobWorker.dependencies);
            }

            if (jobWorker.task) {
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

      return callback();
    });
  };

  if (options.install) {
    packageDependencyManager.installDependencies([packagesLocalFolder], function (err) {
      if (err) {
        return callback(err);
      }
      runner();
    });
  } else {
    runner();
  }

};

