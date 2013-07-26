var assert = require ('assert'),
    path = require('path'),
    proxyquire =  require('proxyquire');

function mockChildProcess(){
  return {
    on: function(ev, cb){
      if (ev === 'exit'){
        cb(0);
      }
    }
  };
}

var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/package_dependency_test");

describe ('package dependency manager', function(){

  it('should install dependencies in all packages', function(done){
    var packageDependencyManagerMocked = proxyquire('../lib/package-dependency-manager', {
      'child_process': {
        spawn: function(cmd, args){
          assert.equal('npm', cmd);
          return mockChildProcess();
        }
      }
    });

    packageDependencyManagerMocked.installDependencies([packagesLocalFolder], function(err){
      assert.ifError(err);
      done();
    });
  });

});

