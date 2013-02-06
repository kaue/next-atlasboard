#!/usr/bin/env node
var ejs = require('ejs'),
    fs = require('fs'),
    path = require('path'),
    hardhat = require('hardhat'),
    npm = require('npm'),
    _ = require('underscore');

var argv = require('optimist').argv;

var sanitizePath = function(path) {
    if (!path) return;
    var pathArray = path.split("/");
    path = pathArray.pop();
    if (!path || path == "..") {
        console.log("Malicious path detected: %s", path);
        console.log("Renaming to newitem");
        path = "newitem";
    }

    return path.toLowerCase();
}


var params = argv._;
var argument = params[0];
var value = sanitizePath(params[1]);
var name = sanitizePath(params[2]);

if (argument == "help") {
    var projectPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json")));
    var version = projectPackageJson.version;
    console.log("AtlasBoard Version %s\n", version);
    console.log("LIST OF AVAILABLE COMMANDS:\n");
    var commands = [
        {command: "help", description: "Displays this help text."},
        {command: "generate (widget/dashboard/job) NAME", description: "Generates a basic widget/dashboard/job with the given NAME when run in an AtlasBoard project base directory."},
        {command: "new NAME", description: "Creates a new fully functional dashboard with the name given in NAME whose base lies in the current directory."},
        {command: "start", description: "When run in a project's base directory, starts the AtlasBoard server."}
    ]
    commands.forEach(function(item) {
        console.log("atlasboard %s\n    %s\n", item.command, item.description);
    })
    return;
}

if (argument == "generate") {
    //Assert valid parameter usage
    var itemsToGenerate = ["widget", "dashboard", "job"];
    if (itemsToGenerate.indexOf(value) == -1) {
        console.log("Invalid generator \"%s\"\nUse one of %s", value, itemsToGenerate.join(", "));
        return;
    }

    //Assert a project already exists here
    var projectExists = true;
    itemsToGenerate.forEach(function (item) {
        if (!fs.existsSync(path.join(process.cwd(), item + "s"))) {
            projectExists = false;
            return;
        }
    });
    if (projectExists === false) {
        console.log("It seems that no project exists here yet. Please navigate to your project's root directory, or generate one first.")
        return;
    }

    //Assert name given and no such item exists there yet
    if (!name) {
        console.log("ERROR: No %s name provided. Please try again with a name after the generate parameter", value);
        return;
    } else if (fs.existsSync(path.join(process.cwd(), value + "s", name))) {
        console.log("ERROR: This %s already seems to exist at %s", value, path.join(process.cwd(), value + "s", name));
        return;
    }

    //All is well. Generate the item based on the skeletons in the samples directory
    fs.mkdirSync(path.join(process.cwd(), value + "s", name))

    fs.readdir(path.join(__dirname, "..", "samples", value), function(err, files) {
        if (!files) {
            console.log(err)
        }
        files.forEach(function (file) {
            var targetFileName = path.join(process.cwd(), value + "s", name, ((path.extname(file) == ".js" && value == "job") ? "index" : name) + path.extname(file));
            var ejsOptions = {name: name};
            fs.writeFileSync(targetFileName, ejs.render(fs.readFileSync(path.join(__dirname, "..", "samples", value, file)).toString(), ejsOptions));
        });

    });

    return;
}

if (argument == "new") {
    //Generate a new project
    var srcDir = path.join(__dirname, "..", "samples", "project");
    var destDir = path.join(process.cwd(), value);

    console.log("Generating a new AtlasBoard project at %s...", destDir);

    if (fs.existsSync(destDir)) {
        console.log("There is already a directory here called %s. Please choose a new name.", value);
        return;
    }

    console.log("Directory %s/ does not exist. Creating it now.", value)
    fs.mkdirSync(destDir);
    var options = {};

    console.log("Porting sample project across...");
    hardhat.scaffold(srcDir, destDir, options, function(err) {
        if (err) {
            console.log("Error when creating new project. Aborting.")
            console.log(err);
        } else {
            /*
             * UNSTABLE
             console.log("Sample project ported successfully.\nInstalling dependencies with npm...");
             var sampleProjectPackageJson = JSON.parse(fs.readFileSync(path.join(srcDir, "package.json")));
            npm.load(sampleProjectPackageJson, function(err) {
                if (err) {
                    console.log("Something went wrong while loading npm!");
                    console.log(err);
                    return;
                }
                var installDeps = _.keys(sampleProjectPackageJson.dependencies);
                npm.commands.install(installDeps, function(err, data) {
                    if (err) {
                        console.log("Something went wrong while installing a package. Try installing manually with `npm install`.");
                        console.log(err);

                    } else {
                        console.log("SUCCESS\n\nNew project %s successfully created. Now:\n1. Run it with `atlasboard start`\n2. Visit it at http://localhost:4444");

                    }
                })
            })
            */
            console.log("SUCCESS\n\nNew project %s successfully created. Now:\n1. Navigate to the project directory and run `npm install`\n2. Start your server with `atlasboard start`\n3. Visit it at http://localhost:4444");
        }
    });

    return;
}


if (argument == "start") {
    //Assert a project already exists here
    var validLocation = true;
    var requiredItems = ["widgets", "jobs", "dashboards", "server.js", "package.json"];
    requiredItems.forEach(function (item) {
        if (!fs.existsSync(path.join(process.cwd(), item))) {
            validLocation = false;
            return;
        }
    });
    if (validLocation === false) {
        console.log("I couldn't find a valid AtlasBoard dashboard. Try generating one with `atlasboard new DASHBOARDNAME`.")
        return;
    }

    //Start AtlasBoard
    console.log("Starting AtlasBoard server...");
    npm.load({}, function(err) {
        if (err) {
            console.log("Error while loading npm. Aborting");
            console.log(err);
            return;
        }
        npm.commands.start();
    })


    return;
}

//We haven't actioned anything, so we got invalid input.
console.log("Invalid input. Check `atlasboard help` for a description of valid uses.")