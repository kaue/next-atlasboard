var assert = require('assert');
var path = require('path');
var fs = require('fs');

describe('sample folder integrity', function () {

  var templateFolder = path.join(process.cwd(), '/templates/new-components');

  describe('template', function () {

    describe('logging config', function () {
      it('should have live logging disabled by default', function (done) {
        var loggingConfigFile = require(path.join(templateFolder, 'project', 'config', 'logging.js'));
        assert.equal(loggingConfigFile.liveLoggingWebAccess, false);
        done();
      });
    });

    describe('dashboard file', function () {
      var dashboardFile = path.join(templateFolder, 'dashboard', 'default.json');
      it('should be valid json', function (done) {
        JSON.parse(fs.readFileSync(dashboardFile));
        done();
      });
    });

    describe('job file', function () {
      var jobFile = path.join(templateFolder, 'job', 'default.js');
      it('should be valid executable', function (done) {
        var job = require(jobFile);

        // the default job uses easyRequest as example, so let's mock it
        var mockedDependencies = {
          easyRequest: {
            HTML: function (options, cb) {
              cb(null, 'hi!');
            }
          }
        };

        job.onRun({}, mockedDependencies, function (err, data) {
          assert.equal('hi!', data.html);
          done();
        });
      });
    });
  });

  describe('project folder', function () {
    var projectFolder = path.join(templateFolder, 'project');

    describe('dashboard file', function () {
      var dashboardFile = path.join(projectFolder, 'packages', 'demo', 'dashboards', 'myfirst_dashboard.json');
      it('should be valid json', function (done) {
        JSON.parse(fs.readFileSync(dashboardFile));
        done();
      });
    });

    describe('global config file', function () {
      var globalConfigFile = path.join(projectFolder, 'config', 'dashboard_common.json');
      it('should be valid json', function (done) {
        JSON.parse(fs.readFileSync(globalConfigFile));
        done();
      });
    });
  });
});