var path = require('path');
var webLogic = require('./logic');
var widgetLogic = require('./routes/widget');
var configManager = require('../config-manager');

module.exports = function (app, packagesPath) {

  var wallboardAssetsFolder = path.join(process.cwd(), "assets");

  // -----------------------------------------
  //  Log
  // -----------------------------------------
  app.route("/log")
      .get(function (req, res) {
        if (configManager('logging').liveLoggingWebAccess) {
          webLogic.log(req, res);
        }
        else {
          res.status(403).end('Live logging it disabled. It must be enabled in the "logging" configuration file');
        }
      });

  // -----------------------------------------
  //  Resources for specific widget
  // -----------------------------------------
  app.route("/widgets/resources")
      .get(function (req, res) {
        widgetLogic.renderWidgetResource(path.join(process.cwd(), 'packages'), req.query.resource, req, res);
      });

  // -----------------------------------------
  //  JS for a specific widget
  // -----------------------------------------
  app.route("/widgets/:widget/js")
      .get(function (req, res) {
        widgetLogic.renderJsWidget(packagesPath, req.params.widget, req, res);
      });

  // -----------------------------------------
  //  HTML and CSS for a specific widget
  // -----------------------------------------
  app.route("/widgets/:widget")
      .get(function (req, res) {
        widgetLogic.renderHtmlWidget(packagesPath, req.params.widget, req, res);
      });

  // -----------------------------------------
  //  Dashboard
  // -----------------------------------------
  app.route("/:dashboard")
      .get(function (req, res) {
        webLogic.renderDashboard(packagesPath, req.params.dashboard, req, res);
      });

  // -----------------------------------------
  //  Dashboard JS
  // -----------------------------------------
  app.route("/:dashboard/js")
      .get(function (req, res) {
        webLogic.renderJsDashboard(packagesPath, wallboardAssetsFolder, req.params.dashboard, req, res);
      });

  // -----------------------------------------
  // List all available dashboards
  // -----------------------------------------
  app.route("/")
      .get(function (req, res) {
        webLogic.listAllDashboards(packagesPath, req, res);
      });

};