var path = require('path');
var express = require('express');
var packageDependencyManager = require('./package-dependency-manager');
var webServer = require('./webapp/server');
var jobInitialiser = require('./job-initialiser');

module.exports = function (options, callback) {

  options = options || {};

  var packagesLocalFolder = path.join(process.cwd(), "/packages");
  var packagesAtlasboardFolder = path.join(__dirname, "../packages");

  var configPath = path.join(process.cwd(), "/config");

  var runner = function (cb) {

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
      filters: options.filters,
      deps: {io: io, app: app}
    };

    jobInitialiser.init(jobOptions, cb);
  };

  if (options.install) {
    packageDependencyManager.installDependencies([packagesLocalFolder], function (err) {
      if (err) {
        return callback(err);
      }
      runner(callback);
    });
  } else {
    runner(callback);
  }

};

