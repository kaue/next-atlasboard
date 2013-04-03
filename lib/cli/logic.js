#!/usr/bin/env node
var ejs = require('ejs'),
    fs = require('fs'),
    path = require('path'),
    hardhat = require('hardhat'),
    itemManager = require('../item-manager'),
    async = require('async'),
    _ = require('underscore');

function directoryHasAtlasBoardProject(dir){
  var requiredItems = ["packages", "package.json", "config"]; //the proyect should have these items
  return requiredItems.every(function (item) { return fs.existsSync(path.join(dir, item));});
}

module.exports = {

  generate: function (projectDir, defaultPackage, itemType, itemName, callback){

    var templateFolder = path.join(__dirname, "../..", "samples"); //TODO: extract to parameter

    //Assert valid parameter usage
    var itemsToGenerate = ["widget", "dashboard", "job"];
    if (itemsToGenerate.indexOf(itemType) == -1) {
      return callback("Invalid generator " + itemType + "\nUse one of: " + itemsToGenerate.join(", "));
    }

    //Assert a project already exists here
    if (!directoryHasAtlasBoardProject(projectDir)){
      return callback("It seems that no project exists here yet. Please navigate to your project's root directory, or generate one first.");
    }

    //Assert name given
    if (!itemName) {
      return callback("ERROR: No " + itemType + " name provided. Please try again with a name after the generate parameter");
    }

    //Assert no such item exists there yet
    var newItemPackageLocation = path.join(projectDir, "packages", defaultPackage);
    var newItemTypeLocation = path.join(newItemPackageLocation, itemType + "s");
    var newItemLocation = path.join(newItemTypeLocation, itemName);

    if (itemType === 'dashboard'){ // all dashboards files are stored within the dashboards folder
      newItemLocation = newItemTypeLocation;
      var targetFileName = path.join(newItemLocation, itemName + '.json');
      if (fs.existsSync(targetFileName)) {
        return callback ("ERROR: This " + itemType + " already seems to exist at " + targetFileName);
      }
    }
    else { // widget and job folder should not exist
      if (fs.existsSync(newItemLocation)) {
        return callback ("ERROR: This " + itemType + " already seems to exist at " + newItemLocation);
      }
    }

    //All is well. Generate the item based on the skeletons in the samples directory
    console.log("Creating new %s at %s...", itemType, newItemLocation);

    if (!fs.existsSync(newItemPackageLocation)) { // make sure package folder exists
      fs.mkdirSync(newItemPackageLocation);
    }

    if (!fs.existsSync(newItemTypeLocation)) { // make sure item type folder exists
      fs.mkdirSync(newItemTypeLocation);
    }

    if (!fs.existsSync(newItemLocation)) { // make sure item folder is created
      fs.mkdirSync(newItemLocation);
    }

    fs.readdir(path.join(templateFolder, itemType), function(err, files) {
      if (err || !files) {
        return callback(err || "no files found");
      }
      var outputFiles = [];
      files.forEach(function (file) {
        var targetFileName = path.join(newItemLocation, itemName + path.extname(file));
        var ejsOptions = {name: itemName};
        var itemPath = path.join(templateFolder, itemType, file);
        fs.writeFileSync(targetFileName,
            ejs.render(fs.readFileSync(itemPath).toString(), ejsOptions));
        outputFiles.push(targetFileName);
      });
      callback(null, {path: newItemLocation, outputFiles: outputFiles});
      console.log("New %s created successfully", itemType);
    });
  },

  newProject: function(srcDir, destDir, callback) {
    console.log("\nGenerating a new AtlasBoard project at %s...", destDir);

    var parentDir = path.dirname(destDir);

    if (directoryHasAtlasBoardProject(parentDir)){
      console.log("You can not create an atlasboard inside a directory containing an atlasboard (at least we think you shouldn't)");
      return false;
    }

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

  list : function(packagesPath, callback){
    packagesPath = Array.isArray(packagesPath) ? packagesPath : [packagesPath];
    async.map(_.unique(packagesPath), function(packagePath, cb){
      var list = { package : packagePath};
      itemManager.getByPackage(packagePath, "widgets", ".js", function(err, packages_widget_list){
        if (err) {return cb(err);}
        list.widgets = packages_widget_list;
        itemManager.getByPackage(packagePath, "jobs", ".js", function(err, packages_job_list){
          if (err) {return cb(err);}
          list.jobs = packages_job_list;
          cb(null, (list.widgets.length && list.jobs.length) ? list : null);
        });
      });
    }, function (err, results){
      callback(err, _.compact(results)); // remove null items if any
    });
  },

  start : function(port){
    //Assert a project already exists here
    if (!directoryHasAtlasBoardProject(process.cwd())){
      console.log("I couldn't find a valid AtlasBoard dashboard. Try generating one with `atlasboard new DASHBOARDNAME`.");
      return false;
    }

    //Start AtlasBoard
    console.log("Starting AtlasBoard server...");
    require('../atlasboard')(port);
    return true;
  }
};
