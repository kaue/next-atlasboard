var assert = require ('assert');
var web_logic = require ('../lib/webapp/logic.js');
var path = require ('path');

function getResponseForSendFile (expectedFileContains, done){
  var res = {
    type: function (data){
      assert.equal("application/javascript", data);
    },

    sendfile: function (file){
      assert.ok(file.indexOf(expectedFileContains)>-1);
      done();
    },

    write: function (data){
      done("not expected");
    },

    end: function (data){
      done("not expected");
    }
  };

  return res;
}

function getResponseForSendStatusCode (statusCode, done){
  var res = {
    type: function (data){

    },

    sendfile: function (file){
      done('not expected');
    },

    write: function (data){
      done("not expected");
    },

    end: function (data){
      done("not expected");
    },
    send: function (status, data){
      assert.equal(statusCode, status);
      done();
    }
  };
  return res;
}

function getResponseWriteEnd (contains, mime, done){
  var bundle_file = "";
  var res = {
    type: function (data){
      if (mime){
        assert.equal(mime, data);
      }
    },

    sendfile: function (file){
      done("not expected");
    },

    write: function (data){
      bundle_file+=data;
    },

    end: function (data){
      if (contains){
        if (!Array.isArray(contains)){
          contains = [contains];
        }
        contains.forEach(function(match){
          assert.ok(bundle_file.indexOf(match) > -1);
        });
      }
      done();
    }
  };
  return res;
}

describe ('web_server', function(){

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
          {}, getResponseForSendStatusCode(404, done));
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
          {}, getResponseForSendStatusCode(404, done));
    });

  });


  describe ('javascript assets', function(){

    describe ('for dashboard', function(){

      it('return javascript assets for a certain dashboard', function(done){
        web_logic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "test_dashboard1", {}, getResponseWriteEnd("Peity", "application/javascript", done));
      });

      it('returns error when requesting javascript assets for a dashboard that doesn\'t exist', function(done){
        web_logic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
          "tttttest_dashboard1", {}, getResponseForSendStatusCode(404, done));
      });

      it('returns error when requesting javascript assets for a dashboard with incorrect format', function(done){
        web_logic.renderJsDashboard([packagesWithInvalidDashboardFile], wallboard_assets_folder,
            "invalid_json_file", {},  getResponseForSendStatusCode(404, done));
      });

      it('handles request when requesting javascript assets for a dashboard with no customJS field', function(done){
        web_logic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "test_dashboard2", {},  getResponseForSendStatusCode(200, done));
      });

      it('handles when requesting javascript assets and file is not found', function(done){
        web_logic.renderJsDashboard([packagesLocalFolder, packagesAtlasboardFolder], wallboard_assets_folder,
            "other_test_dashboard1", {}, getResponseWriteEnd(null, "application/javascript", done));
      });


      it('return javascript assets for a certain widget', function(done){
        web_logic.renderJsWidget([packagesLocalFolder, packagesAtlasboardFolder], "blockers", {},
            getResponseForSendFile("widgets/blockers/blockers.js", done));
      });


      it('ignore path prefix - prevent path traversal issues', function(done){
        web_logic.renderJsWidget([packagesLocalFolder, packagesAtlasboardFolder], "../../blockers", {},
            getResponseForSendFile("widgets/blockers/blockers.js", done));
      });
    });
  });


  describe ('widget', function(){

    //todo: improve this tests
    it('return html and css', function(done){
      web_logic.renderHtmlWidget([packagesLocalFolder, packagesAtlasboardFolder], "blockers",
          {}, getResponseWriteEnd(["body", "<style>"], "text/html", done));
    });

    it('ignore path prefix - prevent path traversal issues', function(done){
      web_logic.renderHtmlWidget([packagesLocalFolder, packagesAtlasboardFolder], "../../blockers",
          {}, getResponseWriteEnd(["body", "<style>"], "text/html", done));
    });


    it('return error 404 if widget not found', function(done){
      web_logic.renderHtmlWidget([packagesLocalFolder, packagesAtlasboardFolder], "bbblockers",
          {}, getResponseForSendStatusCode(404, done));
    });

  });

  describe ('widget resources', function(){

    var localPackagesPath = path.join(process.cwd(),'test', 'fixtures', 'packages');

    it('should return 400 if resource input is undefined', function(done){
      web_logic.renderWidgetResource(localPackagesPath, undefined,
          {}, getResponseForSendStatusCode(400, done));
    });

    it('should return 400 if resource input is empty', function(done){
      web_logic.renderWidgetResource(localPackagesPath, '/',
          {}, getResponseForSendStatusCode(400, done));
    });

    it('should return 400 if resource contains more than 3 separators', function(done){
      web_logic.renderWidgetResource(localPackagesPath, 'package/widget/other/resource',
          {}, getResponseForSendStatusCode(400, done));
    });

    it('should return 400 if resource contains less than 3 separators', function(done){
      web_logic.renderWidgetResource(localPackagesPath, 'package/resource',
          {}, getResponseForSendStatusCode(400, done));
    });

    it('should return resource if path is correct', function(done){
      web_logic.renderWidgetResource(localPackagesPath, 'otherpackage1/blockers/resource.txt',
          {}, getResponseForSendFile('resource.txt', done));
    });

  });

});