var helpers = require('./atlasboard_helpers'),
    fs = require('fs'),
    path = require('path'),
    express = require('express');

function get_widgets_for_dashboard (dashboard_name, callback){
    var dashboardPath = path.join(process.cwd(), "dashboards", dashboard_name) + '.json';
    if (!fs.existsSync(dashboardPath)) {
        return callback ('dashboard not found');
    }
    var board_config = JSON.parse(fs.readFileSync(dashboardPath));
    callback(null, board_config.layout.widgets);
}

var atlasboard = {};

module.exports = function(app) {

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
        var availableDashboards = [];
        fs.readdir("dashboards", function(err, files) {
            files.forEach(function(file) {
                availableDashboards.push(path.basename(file, ".json"));
            });
            res.render(path.join(__dirname, "..", "templates", "dashboard-list.ejs"), {atlasboard: atlasboard, dashboards: availableDashboards.sort()});
        });
    });


    // -----------------------------------------
    //  Bundle JS assets
    // -----------------------------------------
    app.get("/:dashboard/scripts.js", function(req, res) {
        res.type("application/javascript");

        // common atlasboard js assets
        // they need to be in this order
        var atlasboard_js = ["jquery", "underscore", "console-helper", "jquery.gridster.with-extras", "application"].map(function(file){
            return path.join(__dirname, '../assets/javascripts/' + file + '.js') });

        // common wallboard js assets
        var wallboard_js = ["date.format", "jquery.peity", "jquery.spin", "md5", "pretty", "spin"].map(function(file){
            return path.join(process.cwd(), '/assets/javascripts/' + file + '.js') });


        //get widgets only from current dashboard
        var widget_js = [];
        get_widgets_for_dashboard(req.params.dashboard, function(err, widgets){
            widgets.forEach(function(widget_item){
                var js_file = helpers.get_first_existing_file ( path.join("widgets", widget_item.widget, widget_item.widget + ".js"), path.join("packages", widget_item.widget, 'widget', widget_item.widget + ".js"));
                if (js_file){
                    widget_js.push(js_file);
                }
            });
        });

        var assets = atlasboard_js.concat(wallboard_js).concat(widget_js);

        res.write("var Widgets = {};\n\n");

        assets.forEach(function(file){
          res.write(fs.readFileSync(file) + "\n\n");
        });

        //TODO: minify, cache, gzip
        res.end();
    });


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

    // -----------------------------------------
    //  Bundle CSS files for general style
    // -----------------------------------------
    app.get("/styles.css", function(req, res) {
        res.type("text/css");

        // common altasboard css assets
        var css_files = ["jquery.gridster", "normalize", "helpers"];
        css_files.forEach(function(file){
            var file_path = path.join(__dirname, '../assets/stylesheets/' + file + '.css');
            res.write(fs.readFileSync(file_path) + "\n\n");
        });

        // render stylus
        var stylus_str = (fs.readFileSync(path.join(__dirname, '../assets/stylesheets/application.styl')) + "\n\n");
        var stylus = require('stylus');
        stylus.render(stylus_str, { filename: "application.styl" }, function(err, css){
          if (err) throw err;
          res.write(css);
          res.end();
        });
    });

    // -----------------------------------------
    //  Bundle CSS files for all available widgets
    // -----------------------------------------
    app.get("/:dashboard/styles.css", function(req, res) {
        res.type("text/css");

      get_widgets_for_dashboard(req.params.dashboard, function(err, widgets){
          if (!err || widgets){
              widgets.forEach(function(widget_item){
                  var namespacedCss = "";
                  var css_file = helpers.get_first_existing_file ( path.join("widgets", widget_item.widget, widget_item.widget + ".css"), path.join("packages", widget_item.widget, 'widget', widget_item.widget + ".css"));
                  if (css_file){
                      add_namespace(fs.readFileSync(css_file), res, widget_item.widget);
                  }
              });
          }

          //TODO: cache, gzip
          res.end();
      });
    });

        // -----------------------------------------
    //  Fetch HTML for specific widget
    // -----------------------------------------
    app.get("/widgets/:widget", function(req, res) {
        var safeWidget = path.basename(req.params.widget);

        //1. First lookup for overrides. 2, fetch from packages folder
        var html_file = helpers.get_first_existing_file (path.join("widgets", safeWidget, safeWidget + ".html"), path.join("packages", safeWidget, "widget", safeWidget + ".html"));
        if (html_file){
            res.sendfile(html_file);
        }
        else{
            res.send("Trying to render widget " + safeWidget + ", but couldn't find anything at " + widgetPath);
        }
    });

    // -----------------------------------------
    //  Entry point for a particular dashboard
    // -----------------------------------------
    app.get("/:dashboard", function(req, res) {
        //Direct us to that dashboard, regardless of file extension
        var safeDash = path.basename(req.params.dashboard).split('.')[0];
        var dashboardPath = path.join(process.cwd(), "dashboards", safeDash);

        if (fs.existsSync(dashboardPath + ".json")) {
            res.render(path.join(__dirname, "..", "templates", "dashboard.ejs"), {
                atlasboard: atlasboard,
                dashboard_name: safeDash,
                dashboardConfig: JSON.parse(fs.readFileSync(dashboardPath + ".json"))
            });
        } else if(fs.existsSync(dashboardPath + ".ejs")) {
            res.render(dashboardPath + ".ejs", {atlasboard: atlasboard});

        } else if(fs.existsSync(dashboardPath + ".html")) {
            res.render(dashboardPath + ".html");

        } else {
            res.send("Trying to render dashboard " + safeDash + ", but couldn't find anything at " + path.join("dashboards", safeDash));
        }
    });

    app.get("/favicon.ico", function(req, res) {
        res.sendfile(path.join(__dirname, "..", "assets", "images", "favicon.ico"));
    });

    app.get("/fonts/:font", function(req, res) {
        res.sendfile(path.join(__dirname, "..", "assets", "fonts", path.basename(req.params.font)));
    });

    app.get("/images/:image", function(req, res) {
        res.sendfile(path.join(__dirname, "..", "assets", "images", path.basename(req.params.image)));
    });

};