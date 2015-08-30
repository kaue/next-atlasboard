var path = require('path');
var webLogic = require('./logic');
var widgetLogic = require('./routes/widget');
var stylus = require('../stylus');
var express = require('express');
var methodOverride = require('method-override');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler');
var configManager = require('../config-manager');

module.exports = function(app, port, packagesPath) {

  var atlasboardAssetsFolder = path.join(__dirname, "../../assets");
  var wallboardAssetsFolder = path.join(process.cwd(), "assets");

  var loggingConfig = configManager('logging');

  app.set('port', port);
  app.use(morgan('dev'));
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(errorhandler());

  var compiledAssetsFolder = path.join(wallboardAssetsFolder, 'compiled');

  app.use(stylus.getMiddleware({
    src: atlasboardAssetsFolder,
    dest: compiledAssetsFolder
  }));

  // -----------------------------------------
  //  Expose both, wallboard assets and Atlasboard assets.
  //  Wallboard assets take precedence
  // -----------------------------------------
  app.use(express.static(wallboardAssetsFolder));
  app.use(express.static(compiledAssetsFolder));
  app.use(express.static(atlasboardAssetsFolder));

  // -----------------------------------------
  //  Log
  // -----------------------------------------
  app.get("/log", function(req, res) {
    if (loggingConfig.liveLoggingWebAccess){
      webLogic.log(req, res);
    }
    else{
      res.status(403).end('Live logging it disabled. It must be enabled in the "logging" configuration file');
    }
  });

  // -----------------------------------------
  //  Resources for specific widget
  // -----------------------------------------
  app.route("/widgets/resources")
    .get(function(req, res) {
        widgetLogic.renderWidgetResource(path.join(process.cwd(), 'packages'), req.query.resource, req, res);
    });

  // -----------------------------------------
  //  JS for a specific widget
  // -----------------------------------------
  app.route("/widgets/:widget/js")
    .get(function(req, res) {
        widgetLogic.renderJsWidget(packagesPath, req.params.widget, req, res);
    });

  // -----------------------------------------
  //  HTML and CSS for a specific widget
  // -----------------------------------------
  app.route("/widgets/:widget")
    .get(function(req, res) {
        widgetLogic.renderHtmlWidget(packagesPath, req.params.widget, req, res);
    });

  // -----------------------------------------
  //  Dashboard
  // -----------------------------------------
  app.route("/:dashboard")
    .get(function(req, res) {
      webLogic.renderDashboard(packagesPath, req.params.dashboard, req, res);
    });

  // -----------------------------------------
  //  Dashboard JS
  // -----------------------------------------
  app.route("/:dashboard/js")
    .get(function(req, res) {
      webLogic.renderJsDashboard(packagesPath, wallboardAssetsFolder, req.params.dashboard, req, res);
    });

  // -----------------------------------------
  // List all available dashboards
  // -----------------------------------------
  app.route("/")
    .get(function(req, res) {
      webLogic.listAllDashboards(packagesPath, req, res);
    });

};