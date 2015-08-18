var helpers = require('../helpers'),
    fs = require('fs'),
    path = require('path'),
    item_manager = require('../item-manager'),
    web_logic = require('./logic'),
    widget_logic = require('./routes/widget'),
    stylus = require('stylus'),
    nib = require('nib'),
    express = require('express'),
    methodOverride = require('method-override'),
    morgan = require('morgan')
    compression = require('compression'),
    bodyParser = require('body-parser'),
    errorhandler = require('errorhandler');

var atlasboard = {};

module.exports = function(app, port, packagesPath, generalConfigManager) {

  //generalConfigManager.atlasboardAssetFolder and generalConfigManager.wallboardAssetFolder are injected in testing env.
  var atlasboard_assets_folder = generalConfigManager.atlasboardAssetFolder || path.join(__dirname, "../../assets");
  var wallboard_assets_folder = generalConfigManager.wallboardAssetFolder || path.join(process.cwd(), "assets");

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

  var compiledAssetsFolder = path.join(wallboard_assets_folder, 'compiled');
  app.use(stylus.middleware({
    src: atlasboard_assets_folder,
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
  app.use(express.static(wallboard_assets_folder));
  app.use(express.static(compiledAssetsFolder));
  app.use(express.static(atlasboard_assets_folder));

  // -----------------------------------------
  //  Log
  // -----------------------------------------
  app.get("/log", function(req, res) {
    if (generalConfigManager.get("live-logging").enabled === true){
      web_logic.log(req, res);
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
        widget_logic.renderWidgetResource(path.join(process.cwd(), 'packages'), req.query.resource, req, res);
    });

  // -----------------------------------------
  //  JS for a specific widget
  // -----------------------------------------
  app.route("/widgets/:widget/js")
    .get(function(req, res) {
        widget_logic.renderJsWidget(packagesPath, req.params.widget, req, res);
    });

  // -----------------------------------------
  //  HTML and CSS for a specific widget
  // -----------------------------------------
  app.route("/widgets/:widget")
    .get(function(req, res) {
        widget_logic.renderHtmlWidget(packagesPath, req.params.widget, req, res);
    });

  // -----------------------------------------
  //  Dashboard
  // -----------------------------------------
  app.route("/:dashboard")
    .get(function(req, res) {
      web_logic.renderDashboard(packagesPath, req.params.dashboard, req, res);
    });

  // -----------------------------------------
  //  Dashboard JS
  // -----------------------------------------
  app.route("/:dashboard/js")
    .get(function(req, res) {
      web_logic.renderJsDashboard(packagesPath, wallboard_assets_folder, req.params.dashboard, req, res);
    });

  // -----------------------------------------
  // List all available dashboards
  // -----------------------------------------
  app.route("/")
    .get(function(req, res) {
      web_logic.listAllDashboards(packagesPath, req, res);
    });

};