var assert = require ('assert');
var path = require ('path');
var rm = require ('rimraf');
var fs = require ('fs');
var async = require('async');
var proxyquire =  require('proxyquire');
var commands = proxyquire('../lib/cli/commands', {
    './commands-logic': {
        'generate' : function(projectDir, defaultPackage, itemType, itemName, callback){
          callback(null);
        },
        'newProject' : function(srcDir, destDir, callback){
          callback(null);
        }
    }
});

describe ('cli commands', function(){

  require('./includes/startup');

  var temp_folder = "test/tmp";
  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");

  //make sure temp folder is deleted even if tests fail (before and after)
  beforeEach(function(done){
    rm(temp_folder, function(){
      fs.mkdir(temp_folder, done);
    });
  });

  afterEach(function(done){
    rm(temp_folder, done);
  });

  describe ('generate', function(){

    it('should exit with errors if no args are passed', function(done){
      var args = [];
      commands.generate.run(args, function(err) {
        assert.ok(err);
        done();
      });
    });

    it('should exit with errors if only element type is passed', function(done){
      var args = ['job'];
      commands.generate.run(args, function(err) {
        assert.ok(err);
        done();
      });
    });

    it('should not exit with errors if correct arguments are passed', function(done){
      var args = ['job', 'test'];
      commands.generate.run(args, function(err) {
        assert.ok(!err, err);
        done();
      });
    });

  });

  describe ('new', function(){

    it('should exit with errors if bad arguments are passed', function(done){
      var args = [];
      commands.new.run(args, function(err) {
        assert.ok(err);
        done();
      });
    });

  });
});