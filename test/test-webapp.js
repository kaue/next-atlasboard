var assert = require('assert');
var path = require('path');
var fs = require('fs');
var webLogic = require('../lib/webapp/logic');
var responseHelpers = require('./includes/responseHelpers');

describe('web server', function () {

  var wallboard_assets_folder = path.join(process.cwd(), "/test/fixtures/assets_folder");
  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");
  var packagesAtlasboardFolder = path.join(process.cwd(), "/packages");
  var packagesWithInvalidDashboardFile = path.join(process.cwd(), "/test/fixtures/package_invalid_format");

  describe('javascript assets', function () {

    describe('for dashboard', function () {

      it('return javascript assets for a certain dashboard', function (done) {
        webLogic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "test_dashboard1", {}, responseHelpers.getResponseWriteEnd("Peity", "application/javascript", done));
      });

      it('returns error when requesting javascript assets for a dashboard that doesn\'t exist', function (done) {
        webLogic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "tttttest_dashboard1", {}, responseHelpers.getResponseForSendStatusCode(404, done));
      });

      it('returns error when requesting javascript assets for a dashboard with incorrect format', function (done) {
        webLogic.renderJsDashboard([packagesWithInvalidDashboardFile], wallboard_assets_folder,
            "invalid_json_file", {}, responseHelpers.getResponseForSendStatusCode(404, done));
      });

      it('handles request when requesting javascript assets for a dashboard with no customJS field', function (done) {
        webLogic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "test_dashboard2", {}, responseHelpers.getResponseWriteEnd(null, "application/javascript", done));
      });

      it('handles when requesting javascript assets and file is not found', function (done) {
        webLogic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "other_test_dashboard1", {}, responseHelpers.getResponseWriteEnd(null, "application/javascript", done));
      });
    });
  });
});