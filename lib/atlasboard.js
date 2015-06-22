var path = require('path'),
    webServer = require('./webapp/routes.js'),
    helpers = require('./helpers'),
    jobs_manager = require('./job-manager'),
    http = require('http'),
    fs = require('fs'),
    generalConfigManager = require('./config-manager')(),
    loadGlobalAuth = require('./global-auth'),
    packageDependencyManager = require('./package-dependency-manager'),
    EventQueue = require("./event-queue");

module.exports = function(options, callback) {

    options = options || {};
    var port = options.port;

    var packagesLocalFolder = path.join(process.cwd(), "/packages");
    var packagesAtlasboardFolder = path.join(__dirname, "../packages");

    var configPath = path.join(process.cwd(), "/config");

    //-----------------------------------
    // Global config
    //-----------------------------------
    http.globalAgent.maxSockets = 100;

    //-----------------------------------
    // Runner
    //-----------------------------------

    var runner = function() {
      //-----------------------------------
      // Init web server
      //-----------------------------------
      var app = require('express')();
      webServer(app, port, [packagesLocalFolder, packagesAtlasboardFolder], generalConfigManager);

      var httpServer = http.createServer(app).listen(app.get('port'));
      var assignedPort = app.get('port');
      if (!assignedPort){
        return callback('Error initializating web server on port ' + port +
          '. Please check that the port is not in use and you have the ' +
          'right permissions.');
      }
      console.log("\n   AtlasBoard server started. Go to: http://localhost:" + assignedPort + " to access your dashboard \n");


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
      var scheduler = require("./scheduler")(generalConfigManager.get("scheduler"));

      var generalLogger = require('./logger')();
      var jobDependencyManager = require('./job-dependencies/loader.js');

      var jobOptions = {
        packagesPath : [packagesLocalFolder, packagesAtlasboardFolder],
        configPath: configPath,
        filters: options.filters
      };

      jobs_manager.get_jobs(jobOptions, function(err, jobWorkers){
        if (err) return callback(err);

        var globalAuth = loadGlobalAuth(generalConfigManager.get('authentication-file-path'));

        if (!jobWorkers.length){
          generalLogger.warn("No jobs found matching the current configuration and filters");
        }
        else {
          var eventQueue = new EventQueue(io);
          jobWorkers.forEach(function (jobWorker){

            // unique id for this widget in the wallboard
            jobWorker.id = jobWorker.dashboard_name + '-' + jobWorker.widget_item.row + '-' +
                jobWorker.widget_item.col;

            var widgets = { sendData: function(data) { eventQueue.send(jobWorker.id, data); } };

            // add security info
            jobWorker.config.globalAuth = globalAuth;

            if (jobWorker.widget_item.enabled !== false){
              if (jobWorker.task){

                // introduce a random delay on job initialization to avoid a concurrency peak on start
                var rndDelay = helpers.getRndInt(0, 15000);

                jobDependencyManager.fillDependencies(jobWorker, io, generalConfigManager);

                setTimeout(function(){
                  //----------------------
                  // schedule job
                  //----------------------
                  scheduler.start(jobWorker, widgets);

                }, rndDelay);

              }
              else{
                generalLogger.warn("no job task for " + eventId);
              }
            }
            else { // job is disabled
              widgets.sendData({error: 'disabled'});
            }

          });
        }

        return callback();
      });
    };


    if(options.install) {
      packageDependencyManager.installDependencies([packagesLocalFolder], function(err){
        if (err) return callback(err);
        runner();
      });
    } else {
      runner();
    }

};

