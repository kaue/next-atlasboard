var helpers = require('../helpers'),
    fs = require('fs'),
    path = require('path'),
    item_manager = require('../item-manager'),
    web_logic = require('./logic.js'),
    express = require('express');

var atlasboard = {};

module.exports = function(app, packagesPath) {

  var atlasboard_assets_folder = path.join(__dirname, "../../assets");
  var wallboard_assets_folder = path.join(process.cwd(), "assets");

  // -----------------------------------------
  // Web server configuration
  // -----------------------------------------
  app.configure(function() {
    app.set('port', 4444);
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.errorHandler());
  });

  app.configure('development', function(){
    app.use(express.errorHandler());
  });


  // -----------------------------------------
  // No address given - list all available dashboards
  // -----------------------------------------
  app.get("/", function(req, res) {
    web_logic.list_all_dashboards(packagesPath, req, res);
  });


  // -----------------------------------------
  //  Bundle CSS files for general style
  // -----------------------------------------
  app.get("/styles.css", function(req, res) {
    web_logic.render_css_general_assets(atlasboard_assets_folder, req, res);
  });


  // -----------------------------------------
  //  Bundle CSS files for all available widgets within the requested dashboard
  // -----------------------------------------
  app.get("/:dashboard/styles.css", function(req, res) {
    web_logic.render_css_assets(packagesPath, req.params.dashboard, req, res);
  });


  // -----------------------------------------
  //  Entry point for a particular dashboard
  // -----------------------------------------
  app.get("/:dashboard", function(req, res) {
    web_logic.render_dashboard(packagesPath, req.params.dashboard, req, res);
  });


  // -----------------------------------------
  //  Bundle JS assets
  // -----------------------------------------
  app.get("/:dashboard/scripts.js", function(req, res) {
    web_logic.render_script_assets(atlasboard_assets_folder, wallboard_assets_folder, packagesPath, req.params.dashboard, req, res);
  });


  // -----------------------------------------
  //  Fetch HTML for specific widget
  // -----------------------------------------
  app.get("/widgets/:widget", function(req, res) {
    web_logic.render_html_widget(packagesPath, req.params.widget, req, res);
  });


  // -----------------------------------------
  //  Other assets
  // -----------------------------------------
  app.get("/favicon.ico", function(req, res) {
    res.sendfile(path.join(atlasboard_assets_folder, "images", "favicon.ico"));
  });

  app.get("/fonts/:font", function(req, res) {
    res.sendfile(path.join(atlasboard_assets_folder, "fonts", path.basename(req.params.font)));
  });

  app.get("/images/:image", function(req, res) {
    res.sendfile(path.join(atlasboard_assets_folder, "images", path.basename(req.params.image)));
  });

};