var fs = require('fs'),
    path = require('path'),
    helpers = require('./atlasboard_helpers'),
    async = require('async');


module.exports = {

  //----------------------------------------
  // Return first candiate found
  //----------------------------------------
  get_first: function (packagesPath, item_name, item_type, extension, callback) {
    this.get(packagesPath, item_type, extension, function(err, items){
      if (err){
          return callback(err);
      }

      var candidates = items.filter(function(item){return item.indexOf(path.sep + item_name + extension) > -1; });

      //todo: if item_name matches: "package#item_name" format, resolve the right package for it instead
      //of using the first match
      if (candidates.length){
        callback(null, candidates[0]);
      }
      else{
        callback(null, null);
      }
    });
  },

  //----------------------------------------
  // Return items found in any package within the packagesPath
  //----------------------------------------
  get : function (packagesPath, item_type, extension, callback) {

    if (!Array.isArray(packagesPath)){
      packagesPath = [packagesPath];
    }

    function read_items_from_package_dir (dir, cb){
        var items = [];
        var item_dir = path.join(dir, item_type);
        if (!fs.existsSync(item_dir)){
            return cb(null, []);
        }

        // this functions parses:
        // - packages/default/<item_type>/*
        // - packages/otherpackages/<item_type>/*

        // for dashboards, or:
        // - packages/default/<item_type>/*/*.js
        // - packages/otherpackages/<item_type>/*/*.js
        // for jobs and widgets


        // custom logic for wigets and jobs. they are stored in folders
        var use_directory_level = ((item_type==="widgets") || (item_type==="jobs"));

        fs.readdir(item_dir, function(err, items){
            if (err){
                return cb (err);
            }

            if (use_directory_level){
              items = items.map(function(item){
                  //this can be done nicer
                  if (fs.existsSync(path.join(item_dir, item + path.sep + item + extension))){
                    return item + path.sep + item + extension;
                  }
                  else{
                    return item + "";
                  }
              });
            }

            items = items.filter(function(item){ // filter by extension (or being a directory)
                    return path.extname(item) === extension;
            });

            items = items.map(function(partial_dir){
                    return path.join(item_dir, partial_dir);}); // convert to absolute path

            return cb(null, items);
        });
    }


    // read all packages:
    // packages/default/*
    // packages/otherpackages/*

    function fill_packages (packagesPath, cb){

      var items = [];
      fs.readdir(packagesPath, function(err, all_packages_dir){
          if (err){
              return cb(err);
          }

          // convert to absolute path
          all_packages_dir = all_packages_dir.map(function(partial_dir){
                  return path.join(packagesPath, partial_dir);});

          // get items for every package
          async.map (all_packages_dir, read_items_from_package_dir, function(err, results){
              if (err){
                  return cb(err);
              }

              // flatten to an unique array
              results.forEach(function(paths){
                  paths.forEach(function(item){
                      items.push(path.join(item));
                  });
              });

              cb(err, items);
          });
      });
    }

    async.map (packagesPath, fill_packages, function(err, results){
      if (err){ return callback(err); }

      var items = [];
      results.forEach(function(paths){
          paths.forEach(function(item){
              items.push(path.join(item));
          });
      });

      callback(null, items);
    });
  }
};