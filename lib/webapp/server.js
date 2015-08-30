var http = require('http');
var path = require('path');
var methodOverride = require('method-override');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler');
var stylus = require('../stylus');
var express = require('express');
var routes = require('./routes.js');
var configManager = require('../config-manager');

exports = module.exports = function (app, options) {

  http.globalAgent.maxSockets = 100;

  var atlasboardAssetsFolder = path.join(__dirname, "../../assets");
  var localAssetsFolder = path.join(process.cwd(), "assets");

  var compiledAssetsFolder = path.join(localAssetsFolder, 'compiled');

  app.set('port', options.port);

  app.use(morgan(configManager('logging').morgan));
  app.use(compression());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(errorhandler());

  app.use(stylus.getMiddleware({
    src: atlasboardAssetsFolder,
    dest: compiledAssetsFolder
  }));

  // -----------------------------------------
  //  Expose both wallboard and Atlasboard assets.
  //  Local wallboard assets take precedence
  // -----------------------------------------
  app.use(express.static(localAssetsFolder));
  app.use(express.static(compiledAssetsFolder));
  app.use(express.static(atlasboardAssetsFolder));

  routes(app, options.packageLocations);

  var httpServer = http.createServer(app).listen(app.get('port'));
  if (!app.get('port')) {
    throw ('Error binding http server to port ' + options.port);
  }
  return httpServer;
};