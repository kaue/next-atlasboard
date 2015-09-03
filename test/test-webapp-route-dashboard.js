var assert = require('assert');
var path = require('path');
var fs = require('fs');
var widgetRouteDashboard = require('../lib/webapp/routes/dashboard');
var responseHelpers = require('./includes/responseHelpers');

var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");
var packagesAtlasboardFolder = path.join(process.cwd(), "/packages");
var packageWithJustOneDashboard = path.join(process.cwd(), "/test/fixtures/package_with_one_dashboard");
var packagesWithInvalidDashboardFile = path.join(process.cwd(), "/test/fixtures/package_invalid_format");

describe('dashboards', function () {

  it('get all', function (done) {
    var res = {
      render: function (template, data) {
        assert.equal(4, data.dashboards.length);
        done();
      }
    };
    widgetRouteDashboard.listAllDashboards([packagesLocalFolder, packagesAtlasboardFolder], {}, res);
  });

  it('redirects to dashboard page if we only have one', function (done) {
    var res = {
      redirect: function (data) {
        assert.equal(data, "/mydashboard");
        done();
      },
      render: function () {
        done("Not expected");
      }
    };

    widgetRouteDashboard.listAllDashboards([packageWithJustOneDashboard], {}, res);
  });

  it('render one', function (done) {
    var res = {
      render: function (template, data) {
        assert.ok(data.dashboardName);
        assert.ok(data.dashboardConfig);
        done();
      },
      send: function () {
        done("Not expected");
      }
    };
    widgetRouteDashboard.renderDashboard([packagesLocalFolder, packagesAtlasboardFolder], "test_dashboard1", {}, res);
  });


  it('returns 404 if there is a dashboard with an invalid format', function (done) {
    widgetRouteDashboard.renderDashboard([packagesLocalFolder, packagesAtlasboardFolder, packagesWithInvalidDashboardFile], "invalid_json_file",
        {}, responseHelpers.getResponseForSendStatusCode(404, done));
  });


  it('render one - ignore path prefix - prevent path traversal issues', function (done) {
    var res = {
      render: function (template, data) {
        assert.ok(data.dashboardName);
        assert.ok(data.dashboardConfig);
        done();
      },
      send: function () {
        done("Not expected");
      }
    };
    widgetRouteDashboard.renderDashboard([packagesLocalFolder, packagesAtlasboardFolder], "../test_dashboard1", {}, res);
  });

  it('return 404 if dashboard not found', function (done) {
    widgetRouteDashboard.renderDashboard([packagesLocalFolder, packagesAtlasboardFolder], "tttest_dashboard1",
        {}, responseHelpers.getResponseForSendStatusCode(404, done));
  });

});