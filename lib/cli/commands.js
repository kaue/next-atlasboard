#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
    helpers = require('../helpers'),
    logic_cli = require('./logic'),
    argv = require('optimist').argv;

// ----------------------------------------
//  Main
// ----------------------------------------
var params = argv._;
var command = params[0];
var first = helpers.sanitizePath(params[1]);
var second = helpers.sanitizePath(params[2]);
var templatesDir = path.join(__dirname, "../..", "samples");

// ----------------------------------
// Generate
// ----------------------------------
if (command == "generate") {
  return logic_cli.generate(process.cwd(), "default", first, second, function(err){
    if (err){
      console.error(err);
    }
  });
}
// ----------------------------------
// New item
// ----------------------------------
else if (command == "new") {
  var srcDir = path.join(templatesDir, "project");
  var destDir = path.join(process.cwd(), first);

  return logic_cli.new_project (srcDir, destDir, function(err){
    if (err){
      console.error(err);
    }
    else{
      process.chdir(first);
      var child_process = require('child_process');
      var child = child_process.spawn('npm', ["install"], {stdio: 'inherit'});
      console.log ('Installing npm dependencies...');
      child.on('exit', function () {
        console.log('\nSUCCESS !!');
        console.log('\nNew project %s successfully created. Now:\n');
        console.log(' 1. cd ' + first);
        console.log(' 2. start your server with `atlasboard start`');
        console.log(' 3. visit it at http://localhost:4444\n');
      });
    }
  });
}
// ----------------------------------
// Launch app
// ----------------------------------
else if (command == "start") {
  return logic_cli.start();
}
else{
  // ----------------------------------
  // No command found.
  // if we got here we better show the help message
  // ----------------------------------
  var projectPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../..", "package.json")));
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