var assert = require ('assert');
var path = require ('path');
var item_manager = require('../lib/item-manager');

describe ('item_manager', function(){

  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");
  var packagesAtlasboardFolder = path.join(process.cwd(), "/packages");
  var packageWithDisabledDashboards = path.join(process.cwd(), "/test/fixtures/package_with_disabled_dashboards");

  describe ('dashboards', function(){

    it('should have the right number of dashboards', function(done){
      item_manager.get([packagesLocalFolder, packagesAtlasboardFolder], "dashboards", ".json", function(err, dashboards){
        assert.ok(!err, err);
        assert.equal(4, dashboards.length);
        done();
      });
    });

    it('should not read dashboards with invalid extensions', function(done){
      item_manager.get([packagesLocalFolder, packagesAtlasboardFolder], "dashboards", ".json", function(err, dashboards){
        assert.ok(!err, err);
        dashboards.forEach(function(item){
          assert.ok(path.extname(item) === ".json");
        });
        done();
      });
    });

    it('should not read disabled dashboards', function(done){
      item_manager.get([packageWithDisabledDashboards], "dashboards", ".json", function(err, dashboards){
        assert.ok(!err, err);
        assert.equal(1, dashboards.length);
        done();
      });
    });

  });

  describe ('jobs', function(){

    it('should have the right number of jobs', function(done){
      item_manager.get([packagesLocalFolder], "jobs", ".js", function(err, jobs){
        assert.ok(!err, err);
        assert.equal(6, jobs.length);
        done();
      });
    });

    it('should return jobs by package', function(done){
      item_manager.getByPackage([packagesLocalFolder], "jobs", ".js", function(err, packages){
        assert.ok(!err, err);

        assert.equal(2, packages.length);

        assert.equal(packagesLocalFolder + '/default', packages[0].dir);
        assert.equal(3, packages[0].items.length);

        assert.equal(packagesLocalFolder + '/otherpackage1', packages[1].dir);
        assert.equal(3, packages[1].items.length);

        done();
      });
    });

    it('should ignore wrong directories', function(done){
      item_manager.getByPackage([packagesLocalFolder, "wrongdirecto/ry"], "jobs", ".js", function(err, packages){
        assert.ok(!err, err);

        assert.equal(2, packages.length);
        done();
      });
    });

    it('should be able to pick up the right job with namespacing (1)', function(done){
      item_manager.get_first([packagesLocalFolder], "otherpackage1#job1", "jobs", ".js", function(err, job_path){
        assert.ok(!err, err);
        assert.ok(job_path);
        var job = require (job_path);
        var result = job();
        assert.equal ("otherpackage1#job1", result);
        done();
      });
    });

    it('should be able to pick up the right job with namespacing (2)', function(done){
      item_manager.get_first([packagesLocalFolder], "default#job1", "jobs", ".js", function(err, job_path){
        assert.ok(!err, err);
        assert.ok(job_path);
        var job = require (job_path);
        var result = job();
        assert.equal ("default#job1", result);
        done();
      });
    });

  });

  describe ('widgets', function(){
    it('should have the right number of widgets', function(done){
      item_manager.get([packagesLocalFolder], "widgets", ".js", function(err, widgets){
        assert.ok(!err, err);
        assert.equal(1, widgets.length);
        done();
      });
    });
  });

});