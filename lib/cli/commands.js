#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
    helpers = require('../helpers'),
    logicCli = require('./logic'),
    argv = require('optimist').argv;

// ----------------------------------------
//  Main
// ----------------------------------------
var params = argv._;
var command = params[0];
var first = "" + params[1]; //make sure it is a string
var second = "" + params[2];
var templatesDir = path.join(__dirname, "../..", "samples");

var packagesLocalFolder = path.join(process.cwd(), "/packages");
var packagesAtlasboardFolder = path.join(__dirname, "../../packages");

// ----------------------------------
// Generate
// ----------------------------------
if (command === "generate") {
  var packageFolder = "default";
  var itemName = second;
  if (second.indexOf('#') > -1){ //package namespacing
    packageFolder = second.split('#')[0];
    itemName = second.split('#')[1];
  }
  return logicCli.generate(process.cwd(), packageFolder, first, itemName, function(err){
    if (err){
      console.error(err);
    }
  });
}
// ----------------------------------
// New item
// ----------------------------------
else if (command === "new") {
  var srcDir = path.join(templatesDir, "project");
  var destDir = path.join(process.cwd(), first);
  return logicCli.newProject (srcDir, destDir, function(err){
    if (err){
      console.error(err);
    }
    else{
      process.chdir(first);
      var childProcess = require('child_process');
      var child = childProcess.spawn('npm', ["install"], {stdio: 'inherit'});
      console.log ('Installing npm dependencies...');
      child.on('error', function () {
        console.log('\nError installing dependencies. Please run "npm install" inside the dashboard directory');
      });
      child.on('exit', function () {
        console.log('\nSUCCESS !!');
        console.log('\nNew project "%s" successfully created. Now:\n', first);
        console.log(' 1. cd ' + first);
        console.log(' 2. start your server with `atlasboard start`');
        console.log(' 3. visit it at http://localhost:3000\n');
      });
    }
  });
}
// ----------------------------------
// Display component list
// ----------------------------------
else if (command === "list") {
  function parse(package){
    console.log('\t\tPackage "' + path.basename(package.dir) + '":');
    package.items.forEach(function(item){
      console.log('\t\t    - ' + path.basename(item, '.js'));
    });
  }

  return logicCli.list([packagesLocalFolder, packagesAtlasboardFolder], function(err, packages){
    if (err){
      console.error('Error reading package folder');
      return;
    }

    console.log('Available widgets and jobs within all package folders:');
    packages.forEach(function(package){
      console.log(' ' + package.package);
      console.log('\t- Widgets:');
      package.widgets.forEach(parse);

      console.log('\t- Jobs:');
      package.jobs.forEach(parse);
    });
  });
}
// ----------------------------------
// Launch app
// ----------------------------------
else if (command === "start") {
  var port = isNaN(first) ? 3000 : first;
  logicCli.start(port, function(err){ //first parameters can be the port number
    if (err){
      console.error(err);
    }
  });
}
else{
  // ----------------------------------
  // No command found.
  // if we got here we better show the help message
  // ----------------------------------
  var projectPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../..", "package.json")));
  var version = projectPackageJson.version;
  console.log("\nAtlasBoard Version %s\n", version);
  console.log(" LIST OF AVAILABLE COMMANDS:\n");
  var commands = [
    {
      command: "new NAME", 
      description: "Creates a new fully functional dashboard with the name given in NAME whose base lies in the current directory."},
    {
      command: "list", 
      description: "List all available components (widgets or jobs) within all available packages."
    },
    {
      command: "generate (widget/dashboard/job) NAME", 
      description: "Generates a basic widget/dashboard/job with the given NAME when run in an AtlasBoard project base directory." + 
                   "\n\tIn order to create the component in an specific package, use PACKAGE#NAME"
    },
    {
      command: "start", 
      description: "When run in a project's base directory, starts the AtlasBoard server." + 
                   "\n\tUse $ atlasboard start <port> (to specify a port)"
    },
    {
      command: "help", 
      description: "Displays this help text."
    }
];
  commands.forEach(function(item) {
    console.log(" atlasboard %s\n\t%s\n", item.command, item.description);
  });
}