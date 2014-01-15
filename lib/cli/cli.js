#!/usr/bin/env node
var commands = require('./commands'),
    fs = require('fs'),
    path = require('path'),
    argv = require('optimist').argv;

if (commands[argv._[0]]) {
  commands[argv._[0]].run(argv._, function(err, output){
    if (err) console.error(err);
  });
}
else { // show command help
  var projectPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../..", "package.json")));
  console.log("\nAtlasBoard Version %s\n", projectPackageJson.version);
  console.log("usage: atlasboard [command] [options]\n");
  console.log("LIST OF AVAILABLE COMMANDS:\n");

  for (var c in commands){
    console.log(c, ':\n  ', commands[c].descr, '\n  ', 'ex: ', commands[c].example, '\n');
  }
}
