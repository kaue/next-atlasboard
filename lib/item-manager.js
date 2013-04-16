var fs = require('fs'),
    path = require('path'),
    helpers = require('./helpers'),
    async = require('async'),
    _ = require ('underscore'),
    logger = require('./logger')();


var filters = {
  "dashboards" : function (dashboardPath){
    try {
      var contentJSON = JSON.parse(fs.readFileSync(dashboardPath));
      return (contentJSON.enabled !== false);
    }
    catch (e){
      logger.error ('## ERROR ## ' + dashboardPath + ' has an invalid format or file doesn\'t exist\n');
      return false;
    }
  }
};

module.exports = {

  //----------------------------------------
  // Returns relative path to packages path based on item type
  //----------------------------------------
  resolve_location : function (name, item_type, extension){
    var use_directory_level = ((item_type==="widgets") || (item_type==="jobs"));
    if (use_directory_level){
      // /jobs/job1/job1.js
      return path.join(item_type, name, name + extension);
    }
    else{
      // /dashboards/dashboard.json
      return path.join(item_type, name + extension);
    }
  },

  //----------------------------------------
  // Get the items that match the particular filter.
  //----------------------------------------
  resolve_candidates : function(items, name, item_type, extension){
      var search_criteria = "";
      if (name.indexOf("#") > -1){
        var package_name = name.split("#")[0];
        var item_name_parsed = name.split("#")[1];
        //package/jobs/job1/job1.js
        search_criteria = path.join(package_name, this.resolve_location(item_name_parsed, item_type, extension));
      }
      else{
        //jobs/job1/job1.js
        search_criteria = this.resolve_location(name, item_type, extension);
      }
      return items.filter(function(item){ return item.indexOf(search_criteria) > -1; });
  },

  //----------------------------------------
  // Return first candidate found
  //----------------------------------------
  get_first: function (packagesPath, item_name, item_type, extension, callback) {
    var thiz = this;
    this.get(packagesPath, item_type, extension, function(err, items){
      if (err){ return callback(err); }

      var candidates = thiz.resolve_candidates(items, item_name, item_type, extension);
      callback(null, candidates.length ? candidates[0] : null);
    });
  },

  //----------------------------------------
  // Return items found in any package within the packagesPath
  //----------------------------------------
  get : function (packagesPath, item_type, extension, callback) {
    this.getByPackage(packagesPath, item_type, extension, function (err, results){
      if (err){ return callback(err);}
      var items = [];
      results.forEach(function(package){
        items = items.concat(package.items);
      });
      callback(err, items);
    });
  },

  //----------------------------------------
  // Return items found in any package within the packagesPath
  // Items are returned separated by package
  //----------------------------------------
  getByPackage : function (packagesPath, item_type, extension, callback) {

    var thiz = this;

    if (!Array.isArray(packagesPath)){
      packagesPath = [packagesPath];
    }

    function read_items_from_package_dir (dir, cb){
        var package = {dir : dir};

        var item_dir = path.join(dir, item_type);
        if (!fs.existsSync(item_dir)){
            package.items = [];
            return cb(null, package);
        }

        // this functions parses:
        // - packages/default/<item_type>/*
        // - packages/otherpackages/<item_type>/*
        // for dashboards, or:
        // - packages/default/<item_type>/*/*.js
        // - packages/otherpackages/<item_type>/*/*.js
        // for jobs and widgets
        fs.readdir(item_dir, function(err, items){
          if (err){ return cb (err); }

          var selected_items = [];
          items.forEach(function(item_name){
            var item = path.join(item_dir, item_name);
            var stat = fs.statSync(item);
            if (stat.isDirectory()){
              // /job/job1/job1.js
              item = path.join(item, item_name + extension);
            }

            if (path.extname(item) === extension){
              if (fs.existsSync(item)){
                selected_items.push(item);
              }
            }
          });

          if (filters[item_type]){ // change to use custom filters for item_type
            selected_items = selected_items.filter(filters[item_type]);
          }

          package.items = selected_items;
          return cb(null, package);
        });
    }


    // read all packages:
    // packages/default/*
    // packages/otherpackages/*

    function fill_packages (packagesPath, cb){
      fs.readdir(packagesPath, function(err, all_packages_dir){
          if (err){ return cb(err); }

          // convert to absolute path
          all_packages_dir = all_packages_dir.map(function(partial_dir){
              return path.join(packagesPath, partial_dir);});

          all_packages_dir = all_packages_dir.filter(function(dir){return fs.statSync(dir).isDirectory();});
          // get items for every package
          async.map (all_packages_dir, read_items_from_package_dir, function(err, results){
            if (err){
              return cb(err);
            }
            cb(err, _.flatten(results));
          });
      });
    }

    async.map (packagesPath.filter(fs.existsSync), fill_packages, function(err, results){
      if (err){ return callback(err); }
      callback(null, _.flatten(results));
    });
  }
};