var helpers = require('../helpers'),
    fs = require('fs'),
    path = require('path'),
    itemManager = require('../item-manager'),
    logger = require('../logger')(),
    async = require('async'),
    templateManager = require('../template-manager');

function getSafeItemName (itemName){
  return path.basename(itemName).split('.')[0];
}

module.exports = {

    // ---------------------------------------------------------------
    // Render dashboard list
    // ---------------------------------------------------------------
    listAllDashboards : function (packagesPath, req, res){
      itemManager.get(packagesPath, "dashboards", ".json", function(err, dashboardConfigFiles){
        if (err){
          logger.error(err);
          return res.send(400, "Error loading dashboards");
        }
        if (dashboardConfigFiles.length===1){
          return res.redirect("/" + getSafeItemName(dashboardConfigFiles[0]));
        }
        else{
          var availableDashboards = dashboardConfigFiles.map(function(file){
            return path.basename(file, ".json");
          });
          templateManager.resolveTemplateLocation('dashboard-list.ejs', function(err, location){
            res.render(location, {
              dashboards: availableDashboards.sort()
            });
          });
        }
      });
    },

    // ---------------------------------------------------------------
    // Render a specific dashboard
    // ---------------------------------------------------------------
    renderDashboard : function (packagesPath, dashboardName, req, res){
      dashboardName = getSafeItemName(dashboardName);
      itemManager.get_first(packagesPath, dashboardName, "dashboards", ".json", function(err, dashboardPath){
        if (err || !dashboardPath) {
          var statusCode = err ? 400 : 404;
          return res.status(statusCode).send(err ? err : "Trying to render dashboard " +
              dashboardName + ", but couldn't find any dashboard in the packages folder");
        }
        helpers.readJSONFile(dashboardPath, function(err, dashboardJSON){
          if (err) {
            return res.send(400, "Invalid dashboard config file");
          }
          templateManager.resolveTemplateLocation("dashboard.ejs", function(err, location){
            res.render(location, {
              dashboardName: dashboardName,
              dashboardConfig: dashboardJSON
            });
          });
        });
      });
    },

    // ---------------------------------------------------------------
    // Render custom JS for a dashboard
    // ---------------------------------------------------------------
    renderJsDashboard : function (packagesPath, wallboardAssetsFolder, dashboardName, req, res){

      function pipeCustomJSFileNameToResponse (fileName, cb){
        var assetFullPath = path.join(wallboardAssetsFolder, '/javascripts/', fileName);
        fs.readFile(assetFullPath, function(err, fileContent) {
          if (err) {
            logger.error(assetFullPath + " not found");
          }
          else {
            res.write(fileContent + "\n\n");
          }
          cb(null);
        });
      }

      dashboardName = getSafeItemName(dashboardName);
      itemManager.get_first(packagesPath, dashboardName, "dashboards", ".json", function(err, dashboardPath){
        if (err || !dashboardPath){
          return res.send(err ? 400 : 404, err ? err : "Trying to render dashboard " +
              dashboardName + ", but couldn't find any dashboard in the packages folder");
        }
        helpers.readJSONFile(dashboardPath, function(err, dashboardJSON){
          if (err){
            return res.send(400, "Error reading dashboard");
          } else{
            res.type("application/javascript");
            async.eachSeries((dashboardJSON.layout.customJS || []), pipeCustomJSFileNameToResponse, function(){
              res.end();
            });
          }
        });
      });
    },

    log : function (req, res){
      res.render(path.join(__dirname, "../..", "templates", "dashboard-log.ejs"));
    }
};
