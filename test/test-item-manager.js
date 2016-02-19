var assert = require('assert');
var path = require('path');
var itemManager = require('../lib/item-manager');

describe('item_manager', function () {

  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");
  var packagesAtlasboardFolder = path.join(process.cwd(), "/packages");
  var packagesTestNamespacing = path.join(process.cwd(), "/test/fixtures/package_test_namespacing");
  var packageWithDisabledDashboards = path.join(process.cwd(), "/test/fixtures/package_with_disabled_dashboards");

  describe('resolve location', function () {
    it('should resolve location of dashboards correctly', function () {
      var location = itemManager.resolveLocation("dashboard1", "dashboards", '.json');
      assert.equal(location, "dashboards/dashboard1.json");
    });

    it('should resolve location of jobs correctly', function () {
      var location = itemManager.resolveLocation("job1", "jobs", '.js');
      assert.equal(location, "jobs/job1/job1.js");
    });

    it('should resolve location of widgets correctly', function () {
      var location = itemManager.resolveLocation("widget1", "widgets", '.js');
      assert.equal(location, "widgets/widget1/widget1.js");
    });
  });

  describe('resolve candidates', function () {
    it('should resolve namespaced item', function () {
      var items =
          [
            '/Volumes/SSD/confluence-wallboard/packages/alek-atlassian/widgets/buildoverview/buildoverview.html',
            '/Volumes/SSD/confluence-wallboard/packages/atlassian/widgets/buildoverview/buildoverview.html'
          ];
      var candidates = itemManager.resolveCandidates(items, 'atlassian#buildoverview', 'widgets', '.html');
      assert.equal(candidates.length, 1);
      assert.equal(items[1], candidates[0]);
    });
  });

  describe('dashboards', function () {
    it('should have the right number of dashboards', function (done) {
      itemManager.get([packagesLocalFolder, packagesAtlasboardFolder], "dashboards", ".json", function (err, dashboards) {
        assert.ok(!err, err);
        assert.equal(dashboards.length, 4);
        done();
      });
    });

    it('should not read dashboards with invalid extensions', function (done) {
      itemManager.get([packagesLocalFolder, packagesAtlasboardFolder], "dashboards", ".json", function (err, dashboards) {
        assert.ok(!err, err);
        dashboards.forEach(function (item) {
          assert.ok(path.extname(item) === ".json");
        });
        done();
      });
    });

    it('should not read disabled dashboards', function (done) {
      itemManager.get([packageWithDisabledDashboards], "dashboards", ".json", function (err, dashboards) {
        assert.ok(!err, err);
        assert.equal(dashboards.length, 1);
        done();
      });
    });

  });

  describe('jobs', function () {

    it('should have the right number of jobs', function (done) {
      itemManager.get([packagesLocalFolder], "jobs", ".js", function (err, jobs) {
        assert.ok(!err, err);
        assert.equal(6, jobs.length);
        done();
      });
    });

    it('should return jobs by package', function (done) {
      itemManager.getByPackage([packagesLocalFolder], "jobs", ".js", function (err, packages) {
        assert.ok(!err, err);

        assert.equal(packages.length, 2);

        assert.equal(packagesLocalFolder + '/default', packages[0].dir);
        assert.equal(packages[0].items.length, 3);

        assert.equal(packagesLocalFolder + '/otherpackage1', packages[1].dir);
        assert.equal(packages[1].items.length, 3);

        done();
      });
    });

    it('should ignore wrong directories', function (done) {
      itemManager.getByPackage([packagesLocalFolder, "wrongdirecto/ry"], "jobs", ".js", function (err, packages) {
        assert.ok(!err, err);

        assert.equal(packages.length, 2);
        done();
      });
    });

    it('should be able to pick up the right job with namespacing (1)', function (done) {
      itemManager.getFirst([packagesLocalFolder], "otherpackage1#job1", "jobs", ".js", function (err, job_path) {
        assert.ok(!err, err);
        assert.ok(job_path);
        var job = require(job_path);
        var result = job();
        assert.equal("otherpackage1#job1", result);
        done();
      });
    });

    it('should be able to pick up the right job with namespacing (2)', function (done) {
      itemManager.getFirst([packagesLocalFolder], "default#job1", "jobs", ".js", function (err, job_path) {
        assert.ok(!err, err);
        assert.ok(job_path);
        var job = require(job_path);
        var result = job();
        assert.equal("default#job1", result);
        done();
      });
    });

  });

  describe('widgets', function () {
    it('should have the right number of widgets', function (done) {
      itemManager.get([packagesLocalFolder], "widgets", ".js", function (err, widgets) {
        assert.ok(!err, err);
        assert.equal(widgets.length, 1);
        done();
      });
    });

    it('should be able to pick up the right widget with namespacing', function (done) {
      itemManager.getFirst([packagesTestNamespacing], "cccccc#blockers", "widgets", ".html", function (err, widget_path) {
        assert.ok(!err, err);
        assert.ok(widget_path.indexOf('test/fixtures/package_test_namespacing/cccccc/widgets/blockers/blockers.html') > -1);
        done();
      });
    });
  });
});
