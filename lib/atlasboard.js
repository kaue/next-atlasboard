module.exports = function(port) {

    var path = require('path'),
        webServer = require('./webapp/routes.js'),
        helpers = require('./helpers'),
        jobs_manager = require('./job-manager'),
        http = require('http'),
        fs = require('fs'),
        generalConfigManager = require('./config-manager')(),
        packageDependencyManager = require('./package-dependency-manager');

    var packagesLocalFolder = path.join(process.cwd(), "/packages");
    var packagesAtlasboardFolder = path.join(__dirname, "../packages");

    var configPath = path.join(process.cwd(), "/config");

    //-----------------------------------
    // Global config
    //-----------------------------------
    http.globalAgent.maxSockets = 100;

    //-----------------------------------
    // Check package dependencies
    //-----------------------------------
    packageDependencyManager.installDependencies([packagesLocalFolder], function(err){
      if (err) throw err;

      //-----------------------------------
      // Init web server
      //-----------------------------------
      var app = require('express')();
      webServer(app, port, [packagesLocalFolder, packagesAtlasboardFolder], generalConfigManager);

      var httpServer = http.createServer(app).listen(app.get('port'));
      var assignedPort = app.get('port');
      if (isNaN(assignedPort)){
        throw 'Error initializating web server on port ' + port +
          '. Please check that the port is not in use and you have the ' +
          'right permissions.';
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
      var eventQueue = require(path.join(__dirname, "event-queue"))(io);
      var scheduler = require(path.join(__dirname, "scheduler"))();

      var generalLogger = require('./logger')();
      var jobDependencyManager = require('./job-dependencies/loader.js');

      jobs_manager.get_jobs([packagesLocalFolder, packagesAtlasboardFolder], configPath, function(err, jobWorkers){
        if (err) {
          throw err;
        }

        var globalAuth = {};
        try {
          globalAuth = JSON.parse(fs.readFileSync(generalConfigManager.get('authentication-file-path')));
        }
        catch(e){
          generalLogger.warn("-- Authentication file not found in " + generalConfigManager.get('authentication-file-path') + 
              ". You may want to crate your own. You can also define the place where the credential file will be located " + 
              " by editing the general configuration property 'authentication-file-path' -- ");
        }

        jobWorkers.forEach(function (jobWorker){

          // unique id for this widget
          jobWorker.id = jobWorker.dashboard_name + "_" + jobWorker.widget_item.config + "_" +
              jobWorker.widget_item.widget + "_" + jobWorker.widget_item.job;

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
                scheduler.schedule(jobWorker, widgets);

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
      });
    });

};

