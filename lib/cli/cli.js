#!/usr/bin/env node
var commands = require('./commands'),
    fs = require('fs'),
    path = require('path');

function showHelp(){
  var projectPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../..", "package.json")));
  console.log("\nAtlasBoard Version %s\n", projectPackageJson.version);
  console.log("usage: atlasboard [command] [options]\n");
  console.log("LIST OF AVAILABLE COMMANDS:\n");

  for (var c in commands){
    console.log(c, ':\n  ', commands[c].descr, '\n  ', 'ex: ', commands[c].example, '\n');
  }
}

var args = process.argv; // node, atlasboard, command, args
var command = args[2]; // command name
var commandArguments = args.slice(3);

if (commands[command]) {
  commands[command].run(commandArguments, function(err, output){
    if (err) console.error(err);
  });
}
else {
  showHelp();
}