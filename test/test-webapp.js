var assert = require ('assert');
var path = require ('path');
var fs = require('fs');
var web_logic = require ('../lib/webapp/logic');
var widgetRouteLogic = require ('../lib/webapp/routes/widget');
var responseHelpers = require ('./includes/responseHelpers');

describe ('web server', function(){

  var wallboard_assets_folder = path.join(process.cwd(), "/test/fixtures/assets_folder");
  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");
  var packagesAtlasboardFolder = path.join(process.cwd(), "/packages");
  var packagesWithInvalidDashboardFile = path.join(process.cwd(), "/test/fixtures/package_invalid_format");
  var packageWithJustOneDashboard = path.join(process.cwd(), "/test/fixtures/package_with_one_dashboard");

  describe ('dashboards', function(){

    it('get all', function(done){
      var res = {
        render: function (template, data){
          assert.equal(4, data.dashboards.length);
          done();
        }
      };

      web_logic.listAllDashboards([packagesLocalFolder, packagesAtlasboardFolder], {}, res);
    });

    it('redirects to dashboard page if we only have one', function(done){
      var res = {
        redirect: function (data){
          assert.equal(data, "/mydashboard");
          done();
        },
        render: function (template, data){
          done("Not expected");
        }
      };

      web_logic.listAllDashboards([packageWithJustOneDashboard], {}, res);
    });

    it('render one', function(done){
      var res = {
        render: function (template, data){
          assert.ok(data.dashboardName);
          assert.ok(data.dashboardConfig);
          done();
        },

        send: function (data){
          done("Not expected");
        }
      };

      web_logic.renderDashboard([packagesLocalFolder, packagesAtlasboardFolder], "test_dashboard1", {}, res);
    });


    it('returns 404 if there is a dashboard with an invalid format', function(done){
      web_logic.renderDashboard([packagesLocalFolder, packagesAtlasboardFolder, packagesWithInvalidDashboardFile], "invalid_json_file",
          {}, responseHelpers.getResponseForSendStatusCode(404, done));
    });


    it('render one - ignore path prefix - prevent path traversal issues', function(done){
      var res = {
        render: function (template, data){
          assert.ok(data.dashboardName);
          assert.ok(data.dashboardConfig);
          done();
        },

        send: function (data){
          done("Not expected");
        }
      };

      web_logic.renderDashboard([packagesLocalFolder, packagesAtlasboardFolder], "../test_dashboard1", {}, res);
    });

    it('return 404 if dashboard not found', function(done){
      web_logic.renderDashboard([packagesLocalFolder, packagesAtlasboardFolder], "tttest_dashboard1",
          {}, responseHelpers.getResponseForSendStatusCode(404, done));
    });

  });

  describe ('javascript assets', function(){

    describe ('for dashboard', function(){

      it('return javascript assets for a certain dashboard', function(done){
        web_logic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "test_dashboard1", {}, responseHelpers.getResponseWriteEnd("Peity", "application/javascript", done));
      });

      it('returns error when requesting javascript assets for a dashboard that doesn\'t exist', function(done){
        web_logic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
          "tttttest_dashboard1", {}, responseHelpers.getResponseForSendStatusCode(404, done));
      });

      it('returns error when requesting javascript assets for a dashboard with incorrect format', function(done){
        web_logic.renderJsDashboard([packagesWithInvalidDashboardFile], wallboard_assets_folder,
            "invalid_json_file", {},  responseHelpers.getResponseForSendStatusCode(404, done));
      });

      it('handles request when requesting javascript assets for a dashboard with no customJS field', function(done){
        web_logic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "test_dashboard2", {},  responseHelpers.getResponseWriteEnd(null, "application/javascript", done));
      });

      it('handles when requesting javascript assets and file is not found', function(done){
        web_logic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "other_test_dashboard1", {}, responseHelpers.getResponseWriteEnd(null, "application/javascript", done));
      });

      it('return javascript assets for a certain widget', function(done){
        widgetRouteLogic.renderJsWidget([packagesLocalFolder, packagesAtlasboardFolder], "blockers", {},
            responseHelpers.getResponseForSendFile("widgets/blockers/blockers.js", done));
      });

      it('ignore path prefix - prevent path traversal issues', function(done){
        widgetRouteLogic.renderJsWidget([packagesLocalFolder, packagesAtlasboardFolder], "../../blockers", {},
            responseHelpers.getResponseForSendFile("widgets/blockers/blockers.js", done));
      });
    });
  });
});