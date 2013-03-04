var helpers = require('../atlasboard_helpers'),
    fs = require('fs'),
    path = require('path'),
    item_manager = require('../atlasboard_item_manager');


function get_widgets_for_dashboard (packagesPath, dashboard_name, callback){
    item_manager.get_first(packagesPath, dashboard_name, "dashboards", ".json", function(err, dashboard_path){
        if (err || !dashboard_path) {
            return callback (err || 'dashboard not found');
        }
        var board_config = JSON.parse(fs.readFileSync(dashboard_path));
        callback(null, board_config.layout.widgets);
    });
}

function get_safe_item_name (item_name){
  return path.basename(item_name).split('.')[0];
}

module.exports = {

    // ---------------------------------------------------------------
    // Render dashboard
    // ---------------------------------------------------------------
    list_all_dashboards : function (packagesPath, req, res){
        item_manager.get(packagesPath, "dashboards", ".json", function(err, dashboard_config_files){
            if (err){
                return res.send(400, "Error loading dashboards");
            }
            var availableDashboards = dashboard_config_files.map(function(file){return path.basename(file, ".json");});
            res.render(path.join(__dirname, "../..", "templates", "dashboard-list.ejs"), { dashboards: availableDashboards.sort()});
        });
    },

    render_dashboard : function (packagesPath, dashboard_name, req, res){
        dashboard_name = get_safe_item_name(dashboard_name);
        item_manager.get_first(packagesPath, dashboard_name, "dashboards", ".json", function(err, dashboard){
            if (err){
                return res.send(400, "Error loading dashboards");
            }

            if (dashboard){
                res.render(path.join(__dirname, "../..", "templates", "dashboard.ejs"), {
                    dashboard_name: dashboard_name,
                    dashboardConfig: JSON.parse(fs.readFileSync(dashboard))
                });
            }
            else{
                res.send(400, "Trying to render dashboard " + dashboard_name + ", but couldn't find any dashboard in the packages folder");
            }
        });
    },

    // ---------------------------------------------------------------
    // Render JS
    // ---------------------------------------------------------------
    render_script_assets : function (atlasboard_assets_folder, wallboard_assets_folder, packagesPath, dashboard_name, req, res){

        dashboard_name = get_safe_item_name(dashboard_name);

        // common atlasboard js assets
        // they need to be in this order
        var atlasboard_js = ["jquery", "underscore", "console-helper", "jquery.gridster.with-extras", "application"].map(function(file){
            return path.join(atlasboard_assets_folder, '/javascripts/' + file + '.js') });

        // common wallboard js assets
        var wallboard_js = ["date.format", "jquery.peity", "jquery.spin", "md5", "pretty", "spin"].map(function(file){
            return path.join(wallboard_assets_folder, '/javascripts/' + file + '.js') });


        get_widgets_for_dashboard(packagesPath, dashboard_name, function(err, widget_for_this_dashboard){

            if (err){
                return res.send(400, "Error getting widget data for dashboard " + dashboard_name);
            }

            item_manager.get(packagesPath, "widgets", ".js", function(err, available_widgets){ //get all widgets

                var widget_js = [];
                // find widgets referenced by the current dashboard
                widget_js = available_widgets.filter(function(item){
                    for (var i = 0, l = widget_for_this_dashboard.length; i < l ;  i++) {
                        if (item.indexOf(path.sep + widget_for_this_dashboard[i].widget) > -1) {
                            return true;
                        }
                    }
                    return false;
                });

                var assets = atlasboard_js.concat(wallboard_js).concat(widget_js);

                res.type("application/javascript");
                res.write("var Widgets = {};\n\n");

                assets.forEach(function(file){
                  res.write(fs.readFileSync(file) + "\n\n");
                });

                //TODO: minify, cache, gzip
                res.end();
            });
        });
    },

    // ---------------------------------------------------------------
    // Render CSS
    // ---------------------------------------------------------------
    render_css_assets : function (packagesPath, dashboard_name, req, res){

      //safe dashboard_name
      dashboard_name = get_safe_item_name(dashboard_name);

      function add_namespace (css, res, widget_namespace){
          if (css){
              var parse = require('css-parse');
              var parsed_namespacedCss = parse(css);
              parsed_namespacedCss.stylesheet.rules.forEach(function(rule) {
                  rule.selectors.forEach(function (selector) {
                      if (!rule.declarations){
                          console.error('Error. No CSS declaration for selector ' + selector + ' in widget ' + widget_namespace); // don't put comments within the rules!
                      }
                      else {
                          var responseCSS = 'li[data-widget-id="' + widget_namespace + '"] ' + selector + " {\n" + rule.declarations.reduce(function(accumulator, pair){
                              return accumulator + "\t" + pair.property + ": " + pair.value + ";\n";
                          }, "") + "}\n\n";

                          res.write(responseCSS + "\n");
                      }
                  }) ;
              });
          }
      }

      get_widgets_for_dashboard(packagesPath, dashboard_name, function(err, widget_for_this_dashboard){
        if (err || !widget_for_this_dashboard){
          return res.send(400, "Error getting widget data for dashboard " + dashboard_name);
        }

        item_manager.get(packagesPath, "widgets", ".css", function(err, available_widgets){ //get all widgets

            var widget_css_paths = [];
            res.type("text/css");
            // find widgets referenced by the current dashboard
            widget_css_paths = available_widgets.forEach(function(item){
                for (var i = 0, l = widget_for_this_dashboard.length; i < l ;  i++) {
                    if (item.indexOf(path.sep + widget_for_this_dashboard[i].widget) > -1) {
                        add_namespace(fs.readFileSync(item), res, widget_for_this_dashboard[i].widget);
                    }
                }
            });

            //TODO: minify, cache, gzip
            res.end();
        });
      });
    },

    render_css_general_assets : function (atlasboard_assets_folder, req, res){
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
    // Render HTML
    // ---------------------------------------------------------------
    render_html_widget : function (packagesPath, widget_name, req, res){
      widget_name = get_safe_item_name(widget_name);
      item_manager.get_first(packagesPath, widget_name, "widgets", ".html", function(err, html_file){
        if (err || !html_file){
            return res.send(400, "Error rendering widget");
        }
        res.sendfile(html_file);
      });
    }
};