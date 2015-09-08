var path = require('path');
var async = require('async');
var helpers = require('../../helpers');
var templateManager = require('../../template-manager');
var itemManager = require('../../item-manager');

function getSafeItemName(itemName) {
  return path.basename(itemName).split('.')[0];
}

function readDashboardJSON(dashboardPath, cb) {
  helpers.readJSONFile(dashboardPath, function (err, dashboard) {
    if (err) {
      console.error('Error reading dashboard: ', dashboardPath);
      return cb(err);
    }
    dashboard.dashboardName = path.basename(dashboardPath, '.json');
    dashboard.friendlyDashboardName = (typeof dashboard.title === 'string') ? dashboard.title :
        dashboard.dashboardName.replace(/-/g, ' ').replace(/_/g, ' ');
    cb(null, dashboard);
  });
}

module.exports = {

  /**
   * Render dashboard list
   * @param packagesPath
   * @param req
   * @param res
   */

  listAllDashboards: function (packagesPath, req, res) {
    itemManager.get(packagesPath, "dashboards", ".json", function (err, dashboardConfigFiles) {
      if (err) {
        logger.error(err);
        return res.status(400).send("Error loading dashboards");
      }
      if (dashboardConfigFiles.length === 1) {
        return res.redirect("/" + getSafeItemName(dashboardConfigFiles[0]));
      } else {
        async.map(dashboardConfigFiles, readDashboardJSON, function (err, dashboardJSONs) {
          if (err) {
            return res.status(500).send("Error reading dashboards");
          }
          templateManager.resolveTemplateLocation('dashboard-list.ejs', function (err, location) {
            res.render(location, {
              dashboards: dashboardJSONs.sort(function (a, b) {
                if ( a.friendlyDashboardName < b.friendlyDashboardName )
                  return -1;
                if ( a.friendlyDashboardName > b.friendlyDashboardName )
                  return 1;
                return 0;
              })
            });
          });
        });
      }
    });
  },


  /**
   * Render a specific dashboard
   * @param packagesPath
   * @param dashboardName
   * @param req
   * @param res
   */

  renderDashboard: function (packagesPath, dashboardName, req, res) {
    dashboardName = getSafeItemName(dashboardName);
    itemManager.getFirst(packagesPath, dashboardName, "dashboards", ".json", function (err, dashboardPath) {
      if (err || !dashboardPath) {
        var statusCode = err ? 400 : 404;
        return res.status(statusCode).send(err ? err : "Trying to render the dashboard '" +
        dashboardName + "', but couldn't find a valid dashboard with that name. " +
        "If the dashboard exists, is it a valid json file? Please check the console for error messages");
      }
      helpers.readJSONFile(dashboardPath, function (err, dashboardJSON) {
        if (err) {
          return res.status(400).send("Invalid dashboard config file");
        }
        templateManager.resolveTemplateLocation("dashboard.ejs", function (err, location) {
          res.render(location, {
            dashboardName: dashboardName,
            dashboardConfig: dashboardJSON
          });
        });
      });
    });
  }
};