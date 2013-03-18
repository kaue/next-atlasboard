var helpers = require('../helpers'),
    fs = require('fs'),
    path = require('path'),
    itemManager = require('../item-manager'),
    logger = require('../logger');


function getSafeItemName (item_name){
  return path.basename(item_name).split('.')[0];
}

function addNamespace (css, res, widgetNamespace){
  if (css){
    var parse = require('css-parse');
    var parsedNamespaceCss = parse(css);
    parsedNamespaceCss.stylesheet.rules.forEach(function(rule) {
      rule.selectors.forEach(function (selector) {
        if (!rule.declarations){
          logger.error('Error. No CSS declaration for selector ' + selector + ' in widget ' + widgetNamespace); // don't put comments within the rules!
        }
        else {
          var responseCSS = 'li[data-widget-id="' + widgetNamespace + '"] ' + selector + " {\n" + rule.declarations.reduce(function(accumulator, pair){
            return accumulator + "\t" + pair.property + ": " + pair.value + ";\n";
          }, "") + "}\n\n";

          res.write(responseCSS + "\n");
        }
      }) ;
    });
  }
}

module.exports = {

    // ---------------------------------------------------------------
    // Render dashboard list
    // ---------------------------------------------------------------
    listAllDashboards : function (packagesPath, req, res){
      itemManager.get(packagesPath, "dashboards", ".json", function(err, dashboard_config_files){
        if (err){
          return res.send(400, "Error loading dashboards");
        }
        var availableDashboards = dashboard_config_files.map(function(file){return path.basename(file, ".json");});
        res.render(path.join(__dirname, "../..", "templates", "dashboard-list.ejs"), { dashboards: availableDashboards.sort()});
      });
    },

    // ---------------------------------------------------------------
    // Render a specific dashboard
    // ---------------------------------------------------------------
    renderDashboard : function (packagesPath, dashboardName, req, res){
      dashboardName = getSafeItemName(dashboardName);
      itemManager.get_first(packagesPath, dashboardName, "dashboards", ".json", function(err, dashboard){
        if (err || !dashboard){
          return res.send(err ? 400 : 404, err ? err : "Trying to render dashboard " + dashboardName + ", but couldn't find any dashboard in the packages folder");
        }
        res.render(path.join(__dirname, "../..", "templates", "dashboard.ejs"), {
          dashboardName: dashboardName,
          dashboardConfig: JSON.parse(fs.readFileSync(dashboard))
        });
      });
    },

    // ---------------------------------------------------------------
    // Render JS
    // ---------------------------------------------------------------
    renderScriptAssets : function (atlasboard_assets_folder, wallboard_assets_folder, req, res){

      // common atlasboard js assets
      // they need to be in this order
      var atlasboard_js = ["jquery-1.8.3.min", "underscore", "console-helper", "jquery.gridster.with-extras", "application"].map(function(file){
          return path.join(atlasboard_assets_folder, '/javascripts/' + file + '.js') });

      // common wallboard js assets
      var wallboard_js = ["date.format", "jquery.peity", "jquery.spin", "md5", "pretty", "spin"].map(function(file){
          return path.join(wallboard_assets_folder, '/javascripts/' + file + '.js') });

      var assets = atlasboard_js.concat(wallboard_js);

      res.type("application/javascript");
      res.write("var Widgets = {};\n\n");

      assets.forEach(function(file){
        res.write(fs.readFileSync(file) + "\n\n");
      });

      //TODO: minify, cache, gzip
      res.end();
    },

    renderCssGeneralAssets : function (atlasboard_assets_folder, req, res){
      res.type("text/css");

      // common altasboard css assets
      var css_files = ["jquery.gridster", "normalize", "helpers"];
      css_files.forEach(function(file){
        var file_path = path.join(atlasboard_assets_folder, '/stylesheets/' + file + '.css');
        res.write(fs.readFileSync(file_path) + "\n\n");
      });

      // render stylus
      var stylus_str = (fs.readFileSync(path.join(atlasboard_assets_folder, '/stylesheets/application.styl')) + "\n\n");
      var stylus = require('stylus');
      stylus.render(stylus_str, { filename: "application.styl" }, function(err, css){
        if (err) throw err;
        res.write(css);
        res.end();
      });
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
    // Render HTML
    // ---------------------------------------------------------------
    renderHtmlWidget : function (packagesPath, widgetName, req, res){
      res.type("text/html");

      widgetName = getSafeItemName(widgetName);

      itemManager.get_first(packagesPath, widgetName, "widgets", ".css", function(err, css_file){
        if (!err && css_file){ //this is optional
          res.write("<style>");
          addNamespace(fs.readFileSync(css_file), res, widgetName);
          res.write("</style>");
        }

        itemManager.get_first(packagesPath, widgetName, "widgets", ".html", function(err, html_file){
          if (err || !html_file){
            return res.send(404, "Error rendering widget");
          }

          res.write(fs.readFileSync(html_file));

          res.end();
        });
      });
    }
};