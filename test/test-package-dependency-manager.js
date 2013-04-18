var assert = require ('assert'),
    packageDependencyManager = require ('../lib/package-dependency-manager'),
    path = require ('path');

describe ('package dependency manager', function(){

  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");

  describe('load dependencies for packages', function(){

    it('should load dependencies for package.json found in packages folder', function(done){
      packageDependencyManager.installDependencies([packagesLocalFolder], function(err){
        done(err);
      });
    });

  });

});