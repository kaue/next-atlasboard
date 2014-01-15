var assert = require ('assert');
var path = require ('path');
var rm = require ('rimraf');
var fs = require ('fs');
var async = require('async');
var proxyquire =  require('proxyquire');
var commands = proxyquire('../lib/cli/commands', {
    './logic': {
        'generate' : function(){
          console.log('hola caracola');
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

    it('should exit with errors if bad arguments are passed', function(done){
      var args = ['generate'];
      commands.new.run(args, function(err) {
        assert.ok(err);
        done();
      });
    });

  });

  describe ('new', function(){

    it('should exit with errors if bad arguments are passed', function(done){
      var args = ['new'];
      commands.new.run(args, function(err) {
        assert.ok(err);
        done();
      });
    });

  });
});