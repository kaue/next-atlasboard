module.exports = function(port) {

    var path = require('path'),
        webServer = require('./webapp/routes.js'),
        helpers = require('./helpers'),
        jobs_manager = require('./job-manager'),
        http = require('http'),
        fs = require('fs'),
        logger = require('./logger');

    var packagesLocalFolder = path.join(process.cwd(), "/packages");
    var packagesAtlasboardFolder = path.join(__dirname, "../packages");

    var configPath = path.join(process.cwd(), "/config");

    //-----------------------------------
    // Global config
    //-----------------------------------
    http.globalAgent.maxSockets = 100;

    //-----------------------------------
    // Init web server
    //-----------------------------------
    var app = require('express')();
    webServer(app, port || 3000, [packagesLocalFolder, packagesAtlasboardFolder]);

    var httpServer = http.createServer(app).listen(app.get('port'));
    console.log("Express server listening on port " + app.get('port'));


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

    jobs_manager.get_jobs([packagesLocalFolder, packagesAtlasboardFolder], configPath, function(err, jobWorkers){
      if (err) {
        throw err;
      }

      var globalAuth = {};
      try {
        globalAuth = JSON.parse(fs.readFileSync(path.join(process.cwd(), "globalAuth.json")));
      }
      catch(e){
        logger.warn("Authentication file globalAuth.json not found. You may want to crate your own");
      }

      jobWorkers.forEach(function (jobWorker){

        // unique id for this widget
        var eventId = jobWorker.dashboard_name + "_" + jobWorker.widget_item.config + "_" + jobWorker.widget_item.widget + "_" + jobWorker.widget_item.job;

        var widgets = {
          sendData: function(data) { eventQueue.send(eventId, data); }
        };

        var dependencies = { //decouple dependencies so the jobs are testeable
          request : require('request'),
          logger: logger
        };

        // add security info
        jobWorker.config.globalAuth = globalAuth;

        if (jobWorker.widget_item.enabled !== false){
          if (jobWorker.task){

            // introduce a random delay on job initialization to avoid a concurrency peak on start
            var rndDelay = helpers.getRndInt(0, 15000);
            setTimeout(function(){
              logger.log ("running job " + eventId);
              scheduler.schedule(jobWorker, widgets, dependencies);
            }, rndDelay);

          }
          else{
            loger.warn("no job task for " + eventId);
          }
        }
        else { // job is disabled
          widgets.sendData({error: 'disabled'});
        }
      });
    });
};

