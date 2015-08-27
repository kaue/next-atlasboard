var helpers = require('../helpers'),
    fs = require('fs'),
    path = require('path'),
    webLogic = require('./logic'),
    widgetLogic = require('./routes/widget'),
    stylus = require('stylus'),
    nib = require('nib'),
    express = require('express'),
    methodOverride = require('method-override'),
    morgan = require('morgan'),
    compression = require('compression'),
    bodyParser = require('body-parser'),
    errorhandler = require('errorhandler');

var atlasboard = {};

module.exports = function(app, port, packagesPath, generalConfigManager) {

  //generalConfigManager.atlasboardAssetFolder and generalConfigManager.wallboardAssetFolder are injected in testing env.
  var atlasboardAssetsFolder = generalConfigManager.atlasboardAssetFolder || path.join(__dirname, "../../assets");
  var wallboardAssetsFolder = generalConfigManager.wallboardAssetFolder || path.join(process.cwd(), "assets");

  // -----------------------------------------
  // Web server configuration
  // -----------------------------------------
  app.set('port', port);
  app.use(morgan('dev'));
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(errorhandler());

  var compiledAssetsFolder = path.join(wallboardAssetsFolder, 'compiled');
  app.use(stylus.middleware({
    src: atlasboardAssetsFolder,
    dest: compiledAssetsFolder,
    compile: function(str, path) { // optional, but recommended    
    return stylus(str)
      .set('filename', path)
      .set('warn', false)
      .set('compress', true)
      .use(nib());
    }
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
    if (generalConfigManager.get("live-logging").enabled === true){
      webLogic.log(req, res);
    }
    else{
      res.end('live logging it disabled. Must be enabled in config file');
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