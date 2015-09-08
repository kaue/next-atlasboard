var helpers = require('../helpers');
var fs = require('fs');
var path = require('path');
var itemManager = require('../item-manager');
var logger = require('../logger')();
var async = require('async');

function getSafeItemName (itemName){
  return path.basename(itemName).split('.')[0];
}

module.exports = {

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
      itemManager.getFirst(packagesPath, dashboardName, "dashboards", ".json", function(err, dashboardPath){
        if (err || !dashboardPath){
          return res.status(err ? 400 : 404).send(err ? err : "Trying to render dashboard " +
              dashboardName + ", but couldn't find any dashboard in the packages folder");
        }
        helpers.readJSONFile(dashboardPath, function(err, dashboardJSON){
          if (err){
            return res.status(400).send("Error reading dashboard");
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
