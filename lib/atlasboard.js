module.exports = function() {

    var express = require('express'),
        path = require('path'),
        app = express(),
        http = require('http'),
        fs = require('fs'),
        _ = require('underscore'),
        parse = require('css-parse'),
        startTime = new Date().getTime(),
        atlasboard = {};

    app.configure(function() {
        app.set('port', 4444);

        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);

        // wallboard assets
        app.use(require('connect-assets')());
        css.root = "stylesheets";
        js.root = "javascripts";

        // atlasboard assets
        var atlasboardAssetsDirectory = path.join(__dirname, "../assets");
        app.use(require('connect-assets')({src: atlasboardAssetsDirectory, helperContext: atlasboard}));
        atlasboard.css.root = "stylesheets";
        atlasboard.js.root = "javascripts";
        
        atlasboard.assets = function(dashboard_name) {
            // TODO Find a better way to include all required assets
            result = "<script src=\"/socket.io/socket.io.js\"></script>";
            result += this.js('underscore');
            result += this.js('jquery');
            result += this.js('jquery.gridster.with-extras');
            result += this.js('console-helper');
            result += this.js('application');
            result += this.css('application');
            result += "<link rel='stylesheet' href='/widgets/" + dashboard_name + "/widgets.css'>";
            result += "<script src='/widgets/" + dashboard_name + "/widgets.js'></script>";
            return result;
        }

        app.use(express.errorHandler());
    });

    app.configure('development', function(){
        app.use(express.errorHandler());
    });

    // No address given - list all available dashboards
    app.get("/", function(req, res) {
        var availableDashboards = [];
        fs.readdir("dashboards", function(err, files) {
            files.forEach(function(file) {
                availableDashboards.push(path.basename(file, ".json"));
            });

            res.render(path.join(__dirname, "..", "templates", "dashboard-list.ejs"), {atlasboard: atlasboard, dashboards: availableDashboards.sort()});
        });

    })


    function get_first_existing_file() {
        if (!arguments){
            return null;
        }

        for (var i = arguments.length - 1; i >= 0; i--) {
            if (fs.existsSync(arguments[i])) {
                return arguments[i];
            }
        };
    }

    // -----------------------------------------
    //  Fetch HTML for specific widget
    // -----------------------------------------
    app.get("/widgets/:widget", function(req, res) {
        var safeWidget = path.basename(req.params.widget);

        //1. First lookup for overrides. 2, fetch from packages folder
        var html_file = get_first_existing_file (path.join("widgets", safeWidget, safeWidget + ".html"), path.join("packages", safeWidget, "widget", safeWidget + ".html"));
        if (html_file){
            res.sendfile(html_file);
        }
        else{
            res.send("Trying to render widget " + safeWidget + ", but couldn't find anything at " + widgetPath)
        }
    })

    // -----------------------------------------
    //  Bundle JS files for all available widgets
    // -----------------------------------------
    app.get("/widgets/:dashboard/widgets.js", function(req, res) {
        res.type("application/javascript");
        res.write("var Widgets = {};\n\n");

        //get widgets only from current dashboard
        var safeDash = path.basename(req.params.dashboard).split('.')[0];
        var dashboardPath = path.join(process.cwd(), "dashboards", safeDash) + '.json';
        if (fs.existsSync(dashboardPath)) {
            var board_config = JSON.parse(fs.readFileSync(dashboardPath));
            board_config.layout.widgets.forEach(function(widget_item){
                
                var js_file = get_first_existing_file ( path.join("widgets", widget_item.widget, widget_item.widget + ".js"), path.join("packages", widget_item.widget, 'widget', widget_item.widget + ".js"));
                if (js_file){
                    console.log(js_file)
                    var data = fs.readFileSync(js_file);
                    res.write(data + "\n");
                }
            });
        }

        res.end();
    })

    // -----------------------------------------
    //  Bundle CSS files for all available widgets
    // -----------------------------------------
    app.get("/widgets/:dashboard/widgets.css", function(req, res) {
        res.type("text/css");

        //get widgets only from current dashboard
        var safeDash = path.basename(req.params.dashboard).split('.')[0];
        var dashboardPath = path.join(process.cwd(), "dashboards", safeDash) + '.json';
        if (fs.existsSync(dashboardPath)) {
            var board_config = JSON.parse(fs.readFileSync(dashboardPath));
            board_config.layout.widgets.forEach(function(widget_item){
                
                var namespacedCss = "";
                var css_file = get_first_existing_file ( path.join("widgets", widget_item.widget, widget_item.widget + ".css"), path.join("packages", widget_item.widget, 'widget', widget_item.widget + ".css"));
                if (css_file){
                    namespacedCss = fs.readFileSync(css_file);
                }

                if (namespacedCss){
                    var parsed_namespacedCss = parse(namespacedCss);
                    parsed_namespacedCss.stylesheet.rules.forEach(function(rule) {
                        rule.selectors.forEach(function (selector) {
                            if (!rule.declarations){
                                console.error('Error. No CSS declaration for selector ' + selector + ' in widget ' + widget_item.widget) //don't put comments within the rules
                            }
                            else {
                                var responseCSS = 'li[data-widget-id="' + widget_item.widget + '"] ' + selector + " {\n" + rule.declarations.reduce(function(accumulator, pair){
                                    return accumulator + "\t" + pair.property + ": " + pair.value + ";\n";
                                }, "") + "}\n\n";

                                res.write(responseCSS + "\n");
                            }
                        }) ;
                    })
                }
            });
        }

        res.end();
    })

    app.get("/favicon.ico", function(req, res) {
        res.sendfile(path.join(__dirname, "..", "assets", "images", "favicon.ico"));
    })

    // -----------------------------------------
    //  Entry point for  particular dashboard
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
            res.send("Trying to render dashboard " + safeDash + ", but couldn't find anything at " + path.join("dashboards", safeDash))
        }
    })

    app.get("/fonts/:font", function(req, res) {
        res.sendfile(path.join(__dirname, "..", "assets", "fonts", path.basename(req.params.font)));
    })

    app.get("/images/:image", function(req, res) {
        res.sendfile(path.join(__dirname, "..", "assets", "images", path.basename(req.params.image)));
    })

    module.exports.startServer = function() {
        console.log("Express server listening on port " + app.get('port'));
        return http.createServer(app).listen(app.get('port'));
    }

    var httpServer = module.exports.startServer();

    var io = require('socket.io').listen(httpServer, {
        'log level': 2
    });

    io.on('connection', function (socket) {
        socket.emit("serverinfo", {startTime: startTime});
    });

    var eventQueue = require(path.join(__dirname, "event-queue"))(io);

    var scheduler = require(path.join(__dirname, "scheduler"))();

    //-----------------------------------
    // Goes over dashboards config files and initialize necessary jobs in there
    //-----------------------------------
    function initialize_jobs(){

        function get_job(job_name){
            var job = function(){};
            //1. look into user jobs. 2. look into packages folder
            var job_path = get_first_existing_file (path.join(process.cwd(), "jobs/", job_name, job_name + ".js"), path.join(process.cwd(), "packages/", job_name, "job", job_name + ".js"));
            if (job_path){
                job = require(job_path);
            } else{
                console.error("Could not find job file in %s", job_name);
            }
            return job;
        }

        var dashboardsPath = path.join(process.cwd(), "dashboards");
        fs.readdir(dashboardsPath, function(err, dashboard_config_files) {
            
            // read each dashboard file
            dashboard_config_files.forEach(function(dashboard_config_file) {
                var path_config_file = path.join(dashboardsPath, dashboard_config_file);
                var board_config = JSON.parse(fs.readFileSync(path_config_file));

                // read each widget for that dashboard
                board_config.layout.widgets.forEach(function(widget_item){
                    var eventId = widget_item.config + "_" + widget_item.widget + "_" + widget_item.job;
                    
                    var widgets = {
                        sendData: function(data) { eventQueue.send(eventId, data); }
                    }

                    if (widget_item.job) {// widgets can run without a job, displaying just static html.
                        var job = get_job(widget_item.job);
                        var widget_config = {}; //config is optional

                        if (board_config.config[widget_item.config]){
                            widget_config = board_config.config[widget_item.config];
                        }

                        widget_config.globalAuth = JSON.parse(fs.readFileSync(path.join(process.cwd(), "globalAuth.json")));
                        job(widgets, scheduler, widget_config);
                    }
                });
            });
        });
    }

    initialize_jobs();

}

