var path = require('path');
var express = require('express');
var packageDependencyManager = require('./package-dependency-manager');
var webServer = require('./webapp/server');
var jobInitialiser = require('./job-initialiser');
var socketIO = require('socket.io');

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

    console.log('\n-------------------------------------------'.yellow);
    console.log(('Atlasboard listening at port ' + options.port).gray);
    console.log('-------------------------------------------'.yellow + '\n');

    //-----------------------------------
    // Init socket.io server
    //-----------------------------------

    var io = socketIO.listen(httpServer, {
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
    console.log('Installing dependencies...'.gray);
    packageDependencyManager.installDependencies([packagesLocalFolder], function (err) {
      if (err) {
        return callback(err);
      }
      console.log('done!'.green);
      runner(callback);
    });
  } else {
    runner(callback);
  }

};

