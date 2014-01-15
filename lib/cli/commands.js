var path = require('path'),
    logicCli = require('./commands-logic');

var DEFAULT_PACKAGE_FOLDER = 'default';

module.exports = {

  /**
   * generate
   * 
   * Generates an Atlasboard component
   */

  generate: {

    descr: "Generates a basic widget/dashboard/job with the given NAME when run in an AtlasBoard project base directory.",
    example: "atlasboard generate (widget/dashboard/job) NAME",

    run: function (args, cb) { // check for the right arguments

           if (args.length < 3) {
              cb && cb('Missing arguments');
              return;
           }

           var packageFolder = DEFAULT_PACKAGE_FOLDER;
           var itemName = args[2];
           if (itemName.indexOf('#') > -1){ //package namespacing
             packageFolder = itemName.split('#')[0];
             itemName = itemName.split('#')[1];
           }
           return logicCli.generate(process.cwd(), packageFolder, args[1], itemName, function(err){
             cb && cb(err);
           });
         }
  },

  /**
   * new
   * 
   * Creates an Atlasboard component
   */

  new: {

    descr: "Creates a new fully functional dashboard with the name given in NAME whose base lies in the current directory.",
    example: "atlasboard new NAME",

    run: function (args, cb) {

           if (args.length < 2) {
              cb && cb('Missing arguments');
              return;
           }

           var templatesDir = path.join(__dirname, "../..", "samples");
           var srcDir = path.join(templatesDir, "project");
           var destDir = path.join(process.cwd(), args[1]); // TODO check for args or exit. Also add cb
           return logicCli.newProject (srcDir, destDir, function(err){
             if (err){
               cb && cb(err);
               return;
             }
             
             process.chdir(args[1]);
             var childProcess = require('child_process');
             var child = childProcess.spawn('npm', ["install", "--production"], {stdio: 'inherit'});
             console.log ('Installing npm dependencies...');
             child.on('error', function () {
               console.log('\nError installing dependencies. Please run "npm install" inside the dashboard directory');
               cb && cb('Error installing dependencies');
             });
             child.on('exit', function () {
               console.log('\nSUCCESS !!');
               console.log('\nNew project "%s" successfully created. Now:\n', first);
               console.log(' 1. cd ' + first);
               console.log(' (optional: you can import the Atlassian package by running "git init;git submodule add https://bitbucket.org/atlassian/atlasboard-atlassian-package packages/atlassian"');
               console.log(' 2. start your server with `atlasboard start`');
               console.log(' 3. visit it at http://localhost:3000\n');
               cb && cb();
             });
          });
        }
  },

  /**
   * list
   * 
   * List of all Atlasboard components (widgets or jobs) within all available packages
   */

  list: {

    descr: "List all available components (widgets or jobs) within all available packages",
    example: "atlasboard list",

    run: function (args, cb) {

           function parse(package){
             console.log('\t\tPackage "' + path.basename(package.dir) + '":');
             package.items.forEach(function(item){
               console.log('\t\t    - ' + path.basename(item, '.js'));
             });
           }

           var packagesLocalFolder = path.join(process.cwd(), "/packages");
           var packagesAtlasboardFolder = path.join(__dirname, "../../packages");
           return logicCli.list([packagesLocalFolder, packagesAtlasboardFolder], function(err, packages){
             if (err){
               cb && cb('Error reading package folder');
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
             cb && cb();
           });
         }
  },

  /**
   * start
   * 
   * When run in a project's base directory, starts the AtlasBoard server. 
   */

  start: {

    descr: "When run in a project's base directory, starts the AtlasBoard server. " + 
           "Use $ atlasboard start <port> (to specify a port)",
    example: "atlasboard start 3333",

    run: function (args, cb) {
           var port = isNaN(args[1]) ? 3000 : args[1];
           logicCli.start({port: port}, function(err){
             cb && cb(err);
           });
         }
  }
};
