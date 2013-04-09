var helpers = require('../helpers'),
    fs = require('fs'),
    path = require('path'),
    item_manager = require('../item-manager'),
    web_logic = require('./logic'),
    stylus = require('stylus'),
    nib = require('nib'),
    express = require('express');

var atlasboard = {};

module.exports = function(app, port, packagesPath, config) {

  var atlasboard_assets_folder = config.atlasboardAssetFolder || path.join(__dirname, "../../assets");
  var wallboard_assets_folder = config.wallboardAssetFolder || path.join(process.cwd(), "assets");

  // -----------------------------------------
  // Web server configuration
  // -----------------------------------------
  app.configure(function() {
    app.set('port', port);
    app.use(express.logger('dev'));
    app.use(express.compress());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.errorHandler());
  });

  app.configure('development', function(){
    app.use(express.errorHandler());
  });

  app.use(stylus.middleware({
    src: atlasboard_assets_folder,
    compile: function(str, path) { // optional, but recommended
    return stylus(str)
      .set('filename', path)
      .set('warn', true)
      .set('compress', true)
      .use(nib());
    }
  }));

  // -----------------------------------------
  //  Expose both, wallboard assets and atlasboard assets.
  //  Wallboard assets take precedence
  // -----------------------------------------
  app.use(express.static(wallboard_assets_folder));
  app.use(express.static(atlasboard_assets_folder));

  // -----------------------------------------
  //  Log
  // -----------------------------------------
  app.get("/log", function(req, res) {
    if (config.get("live-logging").enabled === true){
      web_logic.log(req, res);
    }
    else{
      res.end('live logging it disabled. Must be enabled in config file');
    }
  });

  // -----------------------------------------
  //  Fetch JS for specific widget
  // -----------------------------------------
  app.get("/widgets/:widget/js", function(req, res) {
    web_logic.renderJsWidget(packagesPath, req.params.widget, req, res);
  });

  // -----------------------------------------
  //  Fetch HTML and CSS for specific widget
  // -----------------------------------------
  app.get("/widgets/:widget", function(req, res) {
    web_logic.renderHtmlWidget(packagesPath, req.params.widget, req, res);
  });


  // -----------------------------------------
  //  Entry point for a particular dashboard
  // -----------------------------------------
  app.get("/:dashboard", function(req, res) {
    web_logic.renderDashboard(packagesPath, req.params.dashboard, req, res);
  });

  // -----------------------------------------
  //  Entry point for a particular dashboard
  // -----------------------------------------
  app.get("/:dashboard/js", function(req, res) {
    web_logic.renderJsDashboard(packagesPath, wallboard_assets_folder, req.params.dashboard, req, res);
  });

  // -----------------------------------------
  // No address given - list all available dashboards
  // -----------------------------------------
  app.get("/", function(req, res) {
    web_logic.listAllDashboards(packagesPath, req, res);
  });

};