var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    _ = require ('underscore');

module.exports.installDependencies = function (packagesPath, callback){

  //----------------------------------------------
  // Search for packages in the current folder
  //----------------------------------------------
  function checkPackagesFolder (packagesPath, cb){
    fs.readdir(packagesPath, function(err, all_packages_dir){
        if (err){ return cb(err); }

        // convert to absolute path
        all_packages_dir = all_packages_dir.map(function(partial_dir){
            return path.join(packagesPath, partial_dir);});

        all_packages_dir = all_packages_dir.filter(function(dir){
          return fs.statSync(dir).isDirectory() && fs.existsSync(dir + '/package.json');
        });

        cb(err, all_packages_dir);
    });
  }

  //----------------------------------------------
  // Install from package folder
  //----------------------------------------------
  function install (pathPackageJson, callback){
    var path = process.cwd();
    process.chdir(pathPackageJson);
    var childProcess = require('child_process');
    var child = childProcess.spawn('npm', ["install", pathPackageJson], {stdio: 'inherit'});
    console.log ('\nChecking npm dependencies for ' + pathPackageJson + '...');
    child.on('error', function (err) {
      callback('Error installing dependencies for ' + pathPackageJson + '. err:' + err);
    });
    child.on('exit', function (code) {
      callback(code !== 0 ? 'error installing ' + pathPackageJson : null);
    });
    process.chdir(path); //restore path
  }

  //----------------------------------------------
  // Process all available package containers
  //----------------------------------------------
  async.map (packagesPath.filter(fs.existsSync), checkPackagesFolder, function(err, results){
    if (err){ return callback(err); }
    var paths = _.flatten(results);
    async.eachSeries(paths, install, function (err, results){
      callback(err);
    });
  });

};