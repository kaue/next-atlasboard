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
        atlasboard.assets = function() {
            // TODO Find a better way to include all required assets
            result = "<script src=\"/socket.io/socket.io.js\"></script>";
            result += this.js('underscore');
            result += this.js('jquery');
            result += this.js('jquery.gridster.with-extras');
            result += this.js('console-helper');
            result += this.js('application');
            result += this.css('application');
            result += "<link rel='stylesheet' href='/widgets.css'>";
            result += "<script src='/widgets.js'></script>";
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
                availableDashboards.push("<li>" + path.basename(file, ".json") + "</li>");
            });

            res.send(availableDashboards.join("\n"));
        });

    })

    app.get("/widgets.js", function(req, res) {
        res.type("application/javascript");

        res.write("var Widgets = {};\n\n");

        var widgets = fs.readdirSync("widgets");
        widgets.forEach(function(widget) {
            var safeWidget = path.basename(widget);
            var data = fs.readFileSync(path.join("widgets", safeWidget, safeWidget + ".js"));
            res.write(data + "\n");
        })

        res.end();
    })

    app.get("/widgets.css", function(req, res) {
        res.type("text/css");

        var widgets = fs.readdirSync("widgets");
        widgets.forEach(function(widget) {
            var safeWidget = path.basename(widget);
            var data = fs.readFileSync(path.join("widgets", safeWidget, safeWidget + ".css"));
            var namespacedCss = parse(data.toString());

            namespacedCss.stylesheet.rules.forEach(function(rule) {

                rule.selectors.forEach(function (selector) {
                    var responseCSS = 'li[data-widget-id="' + widget + '"] ' + selector + " {\n" + rule.declarations.reduce(function(accumulator, pair){
                        return accumulator + "\t" + pair.property + ": " + pair.value + ";\n";
                    }, "") + "}\n\n";

                    res.write(responseCSS + "\n");
                }) ;

            })
        })

        res.end();
    })

    app.get("/favicon.ico", function(req, res) {
        res.sendfile(path.join(__dirname, "..", "assets", "images", "favicon.ico"));
    })

    app.get("/:dashboard", function(req, res) {
        //Direct us to that dashboard, regardless of file extension
        var safeDash = path.basename(req.params.dashboard).split('.')[0];
        var dashboardPath = path.join(process.cwd(), "dashboards", safeDash);
        if (fs.existsSync(dashboardPath + ".json")) {
                res.render(path.join(__dirname, "..", "templates", "dashboard.ejs"), {atlasboard: atlasboard, dashboardConfig: JSON.parse(fs.readFileSync(dashboardPath + ".json"))});

        } else if(fs.existsSync(dashboardPath + ".ejs")) {
            res.render(dashboardPath + ".ejs", {atlasboard: atlasboard});

        } else if(fs.existsSync(dashboardPath + ".html")) {
            res.render(dashboardPath + ".html");

        } else {
            res.send("Trying to render dashboard " + safeDash + ", but couldn't find anything at " + path.join("dashboards", safeDash))
        }
    })

    app.get("/widgets/:widget", function(req, res) {
        var safeWidget = path.basename(req.params.widget);
        var widgetPath = path.join("widgets", safeWidget, safeWidget + ".html");

        if (fs.existsSync(widgetPath)) {
            res.sendfile(widgetPath);
        } else {
            res.send("Trying to render widget " + safeWidget + ", but couldn't find anything at " + widgetPath)
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

    fs.readdir("jobs", function(err, directories) {
        if (!directories)
            return

        directories.forEach(function(directory) {
            try {
                fs.readdir(path.join("jobs/", path.basename(directory)), function(err, files) {
                    if (!files) {
                        console.log(err)
                        return;
                    }

                    //determine if the folder contains any json files
                    var folderContainsJson = false;
                    files.forEach(function(file) {
                        if (path.extname(file) == ".json") {
                            folderContainsJson = true;
                        }
                    });

                    files.forEach(function(file) {
                        var pathHere = path.join(process.cwd(), "jobs", path.basename(directory));
                        if (path.extname(file) == ".json") {
                            try {
                                var config = JSON.parse(fs.readFileSync(path.join(pathHere, path.basename(file))));
                                config.globalAuth = JSON.parse(fs.readFileSync(path.join(process.cwd(), "globalAuth.json")));

                                var job = require(path.join(pathHere, "index.js"));
                                var eventId = path.basename(directory) + "-" + path.basename(file).substr(0, file.lastIndexOf("."));
                                var widgets = {
                                    sendData: function(data) {
                                        eventQueue.send(eventId, data);
                                    }
                                }
                                job(widgets, scheduler, config);
                            } catch (e) {
                                console.error(e.stack);
                            }

                        } else if (folderContainsJson === false) {
                            try {
                                require(path.join(pathHere, path.basename(file)))(eventQueue, scheduler, {});
                            } catch (e) {
                                console.error(e.stack);
                            }
                        }
                    })
                })
            } catch (e) {
                console.error(e.stack);
            }
        })
    })
}

