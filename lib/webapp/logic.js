var helpers = require('../helpers'),
    fs = require('fs'),
    path = require('path'),
    stylus = require('stylus'),
    itemManager = require('../item-manager'),
    logger = require('../logger')(),
    async = require('async'),
    templateManager = require('../template-manager');

function getSafeItemName (item_name){
  return path.basename(item_name).split('.')[0];
}

function addNamespace (css, res, widgetNamespace){
  function namespaceRulesAST (rules) {
    rules.forEach(function (rule) {
      if (rule.selectors) {
        rule.selectors = rule.selectors.map(function (selector) {
          if (selector === '@font-face') {
            return selector;
          }
          return 'li[data-widget-id="' + widgetNamespace + '"] ' + selector;
        });
      }
      // Handle rules within media queries
      if (rule.rules) {
        namespaceRulesAST(rule.rules);
      }
    });
  }

  if (css){
    var cssModule = require('css');
    var cssAST = cssModule.parse(css.toString());
    namespaceRulesAST(cssAST.stylesheet.rules);
    res.write(cssModule.stringify(cssAST));
  }
}

module.exports = {

    // ---------------------------------------------------------------
    // Render dashboard list
    // ---------------------------------------------------------------
    listAllDashboards : function (packagesPath, req, res){
      itemManager.get(packagesPath, "dashboards", ".json", function(err, dashboard_config_files){
        if (err){
          logger.error(err);
          return res.send(400, "Error loading dashboards");
        }
        if (dashboard_config_files.length===1){
          return res.redirect("/" + getSafeItemName(dashboard_config_files[0]));
        }
        else{
          var availableDashboards = dashboard_config_files.map(function(file){
            return path.basename(file, ".json");
          });
          templateManager.resolveTemplateLocation('dashboard-list.ejs', function(err, location){
            res.render(location, {
              dashboards: availableDashboards.sort()
            });
          })
        }
      });
    },

    // ---------------------------------------------------------------
    // Render a specific dashboard
    // ---------------------------------------------------------------
    renderDashboard : function (packagesPath, dashboardName, req, res){
      dashboardName = getSafeItemName(dashboardName);
      itemManager.get_first(packagesPath, dashboardName, "dashboards", ".json", function(err, dashboardPath){
        if (err || !dashboardPath){
          return res.send(err ? 400 : 404, err ? err : "Trying to render dashboard " +
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
    renderJsDashboard : function (packagesPath, wallboard_assets_folder, dashboardName, req, res){

      function pipeCustomJSFileNameToResponse (fileName, cb){
        var assetFullPath = path.join(wallboard_assets_folder, '/javascripts/', fileName);
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

    // ---------------------------------------------------------------
    // Render specific resource for a widget
    // - resource format: <package>/<widget>/<resource>
    //   ex: atlassian/blockers/icon.png
    // ---------------------------------------------------------------
    renderWidgetResource: function (localPackagesPath, resource, req, res){
      if (!resource){
        return res.send(400, 'resource id not specified');
      }
      //sanitization
      var input = resource.split('/');
      if (input.length !== 3) {
        return res.send(400, 'bad input');
      }
      var packageName = input[0];
      var widgetName = input[1];
      var resourceName = input[2];

      //TODO: add extra sanitization
      var resourcePath = path.join(localPackagesPath, packageName, 'widgets', widgetName, resourceName);
      if (fs.existsSync(resourcePath)){
        res.sendfile(resourcePath);
      }
      else {
        return res.send(404, 'resource not found');
      }
    },

    // ---------------------------------------------------------------
    // Render JS for a specific widget
    // ---------------------------------------------------------------
    renderJsWidget: function (packagesPath, widgetName, req, res){
      res.type("application/javascript");
      widgetName = getSafeItemName(widgetName);
      itemManager.get_first(packagesPath, widgetName, "widgets", ".js", function(err, html_file){
        if (err || !html_file){
          return res.send(400, "Error rendering widget");
        }
        res.sendfile(html_file);
      });
    },

    // ---------------------------------------------------------------
    // Render HTML and styles (CSS/Stylus)
    // ---------------------------------------------------------------
    renderHtmlWidget : function (packagesPath, widgetName, req, res){

      widgetName = getSafeItemName(widgetName);

      function getFileContents (extension, cb){
        itemManager.get_first(packagesPath, widgetName, "widgets", extension, function (err, path) {
          if (err || !path) {
            return cb(err);
          }
          fs.readFile(path, 'utf-8', cb);
        });
      }

      function loadHTML (res, cb) {
        getFileContents(".html", function (err, html) {
          if (!err && html) {
            res.write(html);
          }
          cb(err);
        });
      }

      function loadCSS (res, cb){
        getFileContents(".css", function(err, css){
          if (!err && css) {
            addNamespacesCSSToResponse(css, widgetName, res);
          }
          cb(err);
        });
      }

      function loadStylusifPresent(res, cb) {
        getFileContents(".styl", function(err, stylusContent){
          if (!err && stylusContent) {
            stylus(stylusContent)
                .import(path.join(__dirname, '../../assets/stylesheets/variables'))
                .render(function (err, css) {
                  if (!err) {
                    addNamespacesCSSToResponse(css, widgetName, res);
                  }
                  cb(err);
                });
          } else {
            cb(err);
          }
        });
      }

      function addNamespacesCSSToResponse(css, namespace, res) {
        res.write("<style>");
        addNamespace(css, res, namespace);
        res.write("</style>");
      }

      res.type("text/html");

      loadStylusifPresent(res, function(){
        loadCSS(res, function(){
          loadHTML(res, function(err){
            if (err) {
              res.send(500, "Error rendering widget: " + err);
            } else {
              res.end();
            }
          });
        })
      });
    },

    log : function (req, res){
      res.render(path.join(__dirname, "../..", "templates", "dashboard-log.ejs"));
    },

    // For testing only
    _addNamespace: addNamespace
};
