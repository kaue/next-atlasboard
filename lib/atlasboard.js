module.exports = function() {

    var path = require('path'),
        web_server = require('./webapp/routes.js'),
        helpers = require('./atlasboard_helpers'),
        jobs_manager = require('./atlasboard_job_manager'),
        http = require('http'),
        fs = require('fs');

    var packagesPath = path.join(process.cwd(), "/packages");
    var configPath = path.join(process.cwd(), "/config");

    //-----------------------------------
    // Init web server
    //-----------------------------------
    var app = require('express')();
    web_server(app, packagesPath);

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

    jobs_manager.get_jobs(packagesPath, configPath, function(err, job_workers){
        if (err) {
            throw err;
        }

        var globalAuth = JSON.parse(fs.readFileSync(path.join(process.cwd(), "globalAuth.json")));

        job_workers.forEach(function (job_worker){

            // unique id for this widget
            var eventId = job_worker.dashboard_name + "_" + job_worker.widget_item.config + "_" + job_worker.widget_item.widget + "_" + job_worker.widget_item.job;

            var widgets = {
                sendData: function(data) { eventQueue.send(eventId, data); }
            };

            var dependencies = { //decouple dependencies so the jobs are testeable
                request : require('request')
            };

            // add security info
            job_worker.config.globalAuth = globalAuth;

            if (job_worker.enabled !== false){
                if (job_worker.task){
                    console.log("running job " + eventId);
                    scheduler.schedule(function() {
                        // execute the job
                        job_worker.task (widgets, job_worker.config, dependencies);

                    }, job_worker.config.interval || 10 * 60 * 10000);
                }
                else{
                    console.log("no job task for " + eventId);
                }
            }
            else { // job is disabled
                widgets.sendData({error: 'disabled'});
            }
        });
    });
};

