#!/usr/bin/env node
var ejs = require('ejs'),
    fs = require('fs'),
    path = require('path'),
    hardhat = require('hardhat'),
    _ = require('underscore');

function dir_has_atlas_project(dir){
  var requiredItems = ["packages", "package.json", "config"]; //the proyect should have these items
  return requiredItems.every(function (item) { return fs.existsSync(path.join(dir, item));});
}

module.exports = {

  generate: function (project_dir, default_package, item_type, item_name, callback){

    var template_folder = path.join(__dirname, "../..", "samples"); //TODO: extract to parameter

    //Assert valid parameter usage
    var itemsToGenerate = ["widget", "dashboard", "job"];
    if (itemsToGenerate.indexOf(item_type) == -1) {
      return callback("Invalid generator " + item_type + "\nUse one of: " + itemsToGenerate.join(", "));
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
    var newItemPackageLocation = path.join(project_dir, "packages", default_package);
    var newItemTypeLocation = path.join(newItemPackageLocation, item_type + "s");
    var newItemLocation = path.join(newItemTypeLocation, item_name);
    if (fs.existsSync(newItemLocation)) {
      return callback ("ERROR: This " + item_type + " already seems to exist at " + path.join(process.cwd()) + ". Path:" + newItemLocation);
    }

    //All is well. Generate the item based on the skeletons in the samples directory
    console.log("Creating new %s at %s...", item_type, newItemLocation);

    if (!fs.existsSync(newItemPackageLocation)) { // make sure package folder exists
      fs.mkdirSync(newItemPackageLocation);
    }

    if (!fs.existsSync(newItemTypeLocation)) { // make sure item type folder exists
      fs.mkdirSync(newItemTypeLocation);
    }

    if (!fs.existsSync(newItemLocation)) { // make sure item folder is created
      fs.mkdirSync(newItemLocation);
    }

    fs.readdir(path.join(template_folder, item_type), function(err, files) {
      if (err || !files) {
        return callback(err || "no files found");
      }
      files.forEach(function (file) {
        var targetFileName = path.join(newItemLocation, item_name + path.extname(file));
        var ejsOptions = {name: item_name};
        var item_path = path.join(template_folder, item_type, file);
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
    require('../atlasboard')();
    return true;
  }
};
