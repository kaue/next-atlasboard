var path = require('path');
var helpers = require('../../helpers');
var templateManager = require('../../template-manager');
var itemManager = require('../../item-manager');

function getSafeItemName(itemName) {
  return path.basename(itemName).split('.')[0];
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
        return res.send(400, "Error loading dashboards");
      }
      if (dashboardConfigFiles.length === 1) {
        return res.redirect("/" + getSafeItemName(dashboardConfigFiles[0]));
      } else {
        var availableDashboards = dashboardConfigFiles.map(function (file) {
          return path.basename(file, ".json");
        });
        templateManager.resolveTemplateLocation('dashboard-list.ejs', function (err, location) {
          res.render(location, {
            dashboards: availableDashboards.sort()
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
        return res.status(statusCode).send(err ? err : "Trying to render dashboard " +
        dashboardName + ", but couldn't find any dashboard in the packages folder");
      }
      helpers.readJSONFile(dashboardPath, function (err, dashboardJSON) {
        if (err) {
          return res.send(400, "Invalid dashboard config file");
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