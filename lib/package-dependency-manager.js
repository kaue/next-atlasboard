var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    _ = require ('underscore');

module.exports.installDependencies = function (packagesPath, callback){

  // Process all available package containers
  async.map (packagesPath.filter(fs.existsSync), checkPackagesFolder, function(err, results){
    if (err){ return callback(err); }
    var paths = _.flatten(results);
    async.eachSeries(paths, install, function (err, results){
      callback(err);
    });
  });

};

/**
 * Search for packages in the current folder
 */

function checkPackagesFolder (packagesPath, cb){
  fs.readdir(packagesPath, function(err, allPackagesDir){
    if (err){ return cb(err); }

    // convert to absolute path
    allPackagesDir = allPackagesDir.map(function(partial_dir){
        return path.join(packagesPath, partial_dir);});

    allPackagesDir = allPackagesDir.filter(function(dir){
      return fs.statSync(dir).isDirectory() && fs.existsSync(dir + '/package.json');
    });

    cb(null, allPackagesDir);
  });
}

/**
 * Install from package folder
 */
function install (pathPackageJson, callback){
  var currPath = process.cwd(); // save current path
  process.chdir(pathPackageJson);

  console.log ('\nChecking npm dependencies for ' + pathPackageJson + '...');
  executeCommand('npm', ["install", pathPackageJson], function(err, code){
    if (err){
      callback('Error installing dependencies for ' + pathPackageJson + '. err:' + err);
    } else {
      callback(code !== 0 ? 'error installing ' + pathPackageJson : null);
    }
  });

  process.chdir(currPath); //restore path
}

/**
 * Executes a command in a childProcess
 */

function executeCommand(cmd, args, callback) {
  var childProcess = require('child_process');
  var child = childProcess.spawn(cmd, args, {stdio: 'inherit'});
  child.on('error', function (err) {
    callback(err);
  });
  child.on('exit', function (code) {
    callback(null, code);
  });
}