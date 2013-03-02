#!/usr/bin/env node
var ejs = require('ejs'),
    fs = require('fs'),
    path = require('path'),
    hardhat = require('hardhat'),
    helpers = require('./atlasboard_helpers'),
    _ = require('underscore');

var argv = require('optimist').argv;

function dir_has_atlas_project(dir){
    var requiredItems = ["packages", "dashboards", "package.json"]; //the proyect should have these items
    return requiredItems.every(function (item) { return fs.existsSync(path.join(dir, item));});
}

var commands = {

    generate: function (project_dir, item_type, item_name, callback){
        //Assert valid parameter usage
        var itemsToGenerate = ["widget", "dashboard", "job"];
        if (itemsToGenerate.indexOf(item_type) == -1) {
            return callback("Invalid generator \"%s\"\nUse one of %s", item_type, itemsToGenerate.join(", "));
        }

        //Assert a project already exists here
        if (!dir_has_atlas_project(project_dir)){
            return callback("It seems that no project exists here yet. Please navigate to your project's root directory, or generate one first.");
        }

        //Assert name given
        if (!item_name) {
            return callback("ERROR: No " + item_type + " name provided. Please try again with a name after the generate parameter");
        }

        //Assert no such item exists there yet
        var newItemBaseLocation;
        var newItemLocation;

        if (item_type === "dashboard"){
            newItemBaseLocation = path.join(project_dir, "dashboards");
            newItemLocation = path.join(newItemBaseLocation);
        }
        else{
            newItemBaseLocation = path.join(project_dir, "packages", item_name);
            newItemLocation = path.join(newItemBaseLocation, item_type);
            if (fs.existsSync(newItemLocation)) {
                return callback ("ERROR: This " + item_type + " already seems to exist at " + path.join(process.cwd()));
            }
        }

        //All is well. Generate the item based on the skeletons in the samples directory
        console.log("Creating new %s at %s...", item_type, newItemLocation);

        if (!fs.existsSync(newItemBaseLocation)) { //this could exist already
            fs.mkdirSync(newItemBaseLocation);
        }
        if (!fs.existsSync(newItemLocation)) {
            fs.mkdirSync(newItemLocation);
        }

        fs.readdir(path.join(__dirname, "..", "samples", item_type), function(err, files) {
            if (err || !files) {
                console.error(err || "no files found");
            }
            files.forEach(function (file) {
                var targetFileName = path.join(newItemLocation, item_name + path.extname(file));
                var ejsOptions = {name: item_name};
                var item_path = path.join(__dirname, "..", "samples", item_type, file);
                fs.writeFileSync(targetFileName,
                    ejs.render(fs.readFileSync(item_path).toString(), ejsOptions));
            });
            callback(null, {path: newItemLocation});
            console.log("New %s created successfully", item_type);
        });
    },

    new_project: function(srcDir, destDir, callback) {
        //Generate a new project
        console.log("Generating a new AtlasBoard project at %s...", destDir);

        if (fs.existsSync(destDir)) {
            return callback("There is already a directory here called " + destDir + ". Please choose a new name.");
        }

        console.log("Directory %s/ does not exist. Creating it now.", destDir);
        fs.mkdirSync(destDir);

        console.log("Porting sample project across...");
        hardhat.scaffold(srcDir, destDir, {}, function(err) {
            if (err) {
                return callback ("Error when creating new project. Aborting. ERROR: " + err);
            } else {
                //todo: install dependencies after project copy
                callback(null);
            }
        });
    },

    start : function(){
        //Assert a project already exists here
        if (!dir_has_atlas_project(process.cwd())){
            console.log("I couldn't find a valid AtlasBoard dashboard. Try generating one with `atlasboard new DASHBOARDNAME`.");
            return false;
        }

        //Start AtlasBoard
        console.log("Starting AtlasBoard server...");
        require('./atlasboard')();
        return true;
    }
};

module.exports = {commands: commands}; //export commands for testing

// ----------------------------------------
//  Main
// ----------------------------------------

var params = argv._;
var command = params[0];
var first = helpers.sanitizePath(params[1]);
var second = helpers.sanitizePath(params[2]);

// ----------------------------------
// Generate
// ----------------------------------
if (command == "generate") {
    return commands.generate(process.cwd(), first, second, function(err){
        if (err){
            console.error(err);
        }
    });
}
// ----------------------------------
// New item
// ----------------------------------
else if (command == "new") {
    var srcDir = path.join(__dirname, "..", "samples", "project");
    var destDir = path.join(process.cwd(), first);

    return commands.new_project (srcDir, destDir, function(err){
        if (err){
            console.error(err);
        }
        else{
            console.log("SUCCESS\n\nNew project %s successfully created. Now:\n1. Navigate to the project directory and run `npm install`\n2. Start your server with `atlasboard start`\n3. Visit it at http://localhost:4444", destDir);
        }
    });
}
// ----------------------------------
// Launch app
// ----------------------------------
else if (command == "start") {
    return commands.start();
}
else{

    // ----------------------------------
    // No command found.
    // if we got here we better show the help message
    // ----------------------------------
    var projectPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json")));
    var version = projectPackageJson.version;
    console.log("AtlasBoard Version %s\n", version);
    console.log("LIST OF AVAILABLE COMMANDS:\n");
    var commands = [
        {command: "new NAME", description: "Creates a new fully functional dashboard with the name given in NAME whose base lies in the current directory."},
        {command: "generate (widget/dashboard/job) NAME", description: "Generates a basic widget/dashboard/job with the given NAME when run in an AtlasBoard project base directory."},
        {command: "start", description: "When run in a project's base directory, starts the AtlasBoard server."},
        {command: "help", description: "Displays this help text."}
    ];
    commands.forEach(function(item) {
        console.log("atlasboard %s\n    %s\n", item.command, item.description);
    });
}