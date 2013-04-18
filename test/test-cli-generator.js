var assert = require ('assert');
var path = require ('path');
var cli_generator = require ('../lib/cli/logic');
var rm = require ("rimraf");
var fs = require ("fs");

describe ('cli commands', function(){

  var temp_folder = "test/tmp";
  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");

  //make sure temp folder is deleted even if tests fail (before and after)
  before(function(done){
    rm(temp_folder, done);
  });

  after(function(done){
    rm(temp_folder, done);
  });

  describe ('new', function(){

    it('should create a new project ok', function(done){
      cli_generator.newProject("samples/project", temp_folder, function(err){
        assert.ok(!err, err);
        assert.ok(fs.existsSync(path.join(temp_folder, "package.json")));
        assert.ok(fs.existsSync(path.join(temp_folder, "globalAuth.json")));
        assert.ok(fs.existsSync(path.join(temp_folder, "assets")));
        assert.ok(fs.existsSync(path.join(temp_folder, "packages")));
        assert.ok(fs.existsSync(path.join(temp_folder, "packages", "default", "dashboards")));
        done();
      });
    });

    it('should return error if invalid path', function(done){
      cli_generator.newProject("samples/project", '/etc/', function(err){
        assert.ok(err);
        done();
      });
    });

    it('should not create a new project from a folder where a atlasboard project already exists', function(done){
      cli_generator.newProject("samples/project", temp_folder, function(err){
        assert.ok(err);
        done();
      });
    });

    it('should have a valid config file', function(done){ //avoid shiping an invalid config file
      var config_path_contents = fs.readFileSync(path.join(temp_folder, "config", "dashboard_common.json"));
      var JSONconfig = JSON.parse(config_path_contents);
      assert.ok(JSONconfig.config);
      done();
    });

  });


  describe ('generate', function(){

    it('should return error if bad resource type provided', function(done){
      cli_generator.generate("/ba/ddir", "default", "widgettt", "mywidget", function(err){
        assert.ok(err.indexOf("Invalid generator")>-1, err);
        done();
      });
    });

    it('should return error if no project exists in the provided path', function(done){
      cli_generator.generate("/b/addir", "default", "widget", "mywidget", function(err){
        assert.ok(err.indexOf("no project exists")>-1, err);
        done();
      });
    });

    it('should return error if unsafe item name is provided', function(done){
      cli_generator.generate(temp_folder, "default", "widget", "../mywidget", function(err){
        assert.ok(err.indexOf("invalid")>-1, err);
        done();
      });
    });

    it('should return error if no item name is provided', function(done){
      cli_generator.generate(temp_folder, "default", "widget", "", function(err){
        assert.ok(err.indexOf("invalid")>-1, err);
        done();
      });
    });

    it('should create widget successfully', function(done){
      cli_generator.generate(temp_folder, "default", "widget", "newcalendar", function(err, data){
        assert.ok(!err, err);
        var result_path = path.join(temp_folder, "packages", "default", "widgets", "newcalendar");
        assert.ok(fs.existsSync(result_path));
        assert.equal(data.path, result_path);
        done();
      });
    });

    it('should return error if widget already exists', function(done){
      cli_generator.generate(temp_folder, "default", "widget", "newcalendar", function(err){
        assert.ok(err, err);
        done();
      });
    });

    it('should create job successfully', function(done){
      cli_generator.generate(temp_folder, "default", "job", "newcalendar", function(err, data){
        assert.ok(!err);
        var result_path = path.join(temp_folder, "packages", "default", "jobs", "newcalendar");
        assert.ok(fs.existsSync(result_path));
        assert.equal(data.path, result_path);
        done();
      });
    });

    it('should return error if job already exists', function(done){
      cli_generator.generate(temp_folder, "default", "job", "newcalendar", function(err){
        assert.ok(err, err);
        done();
      });
    });

    it('should create dashboard successfully', function(done){
      cli_generator.generate(temp_folder, "default", "dashboard", "newdashboard", function(err, data){
        assert.ok(!err, err);
        var dashboard_folder = path.join(temp_folder, "packages", "default", "dashboards");
        var dashbboard_file = path.join(dashboard_folder, "newdashboard.json");
        assert.ok(fs.existsSync(dashbboard_file));
        assert.equal(data.path, dashboard_folder);
        assert.equal(data.outputFiles.length, 1);
        assert.equal(data.outputFiles[0], dashbboard_file);
        done();
      });
    });

    it('should return error if dashboard already exists', function(done){
      cli_generator.generate(temp_folder, "default", "dashboard", "newdashboard", function(err){
        assert.ok(err, err);
        done();
      });
    });

  });

  describe ('list', function(){
    it('should list available components', function(done){
      cli_generator.list(packagesLocalFolder, function(err, lists){

        assert.ok(Array.isArray(lists));
        assert.equal(lists.length, 1);
        assert.equal(lists[0].package, packagesLocalFolder);

        assert.equal(lists[0].widgets.length, 2);

        assert.ok(lists[0].widgets[0].dir.indexOf('/test/fixtures/packages/default')>-1);
        assert.equal(lists[0].widgets[0].items.length, 0);

        assert.ok(lists[0].widgets[1].dir.indexOf('/test/fixtures/packages/otherpackage1')>-1);
        assert.equal(lists[0].widgets[1].items.length, 1);
        assert.ok(lists[0].widgets[1].items[0].indexOf('test/fixtures/packages/otherpackage1/widgets/blockers/blockers.js')>-1);

        assert.equal(lists[0].jobs.length, 2);

        assert.ok(lists[0].jobs[0].dir.indexOf('/test/fixtures/packages/default')>-1);
        assert.equal(lists[0].jobs[0].items.length, 3);
        assert.ok(lists[0].jobs[0].items[0].indexOf('/test/fixtures/packages/default/jobs/job1/job1.js')>-1);

        assert.ok(lists[0].jobs[1].dir.indexOf('/test/fixtures/packages/otherpackage1')>-1);
        assert.equal(lists[0].jobs[1].items.length, 3);
        assert.ok(lists[0].jobs[1].items[0].indexOf('/test/fixtures/packages/otherpackage1/jobs/job1/job1.js')>-1);

        done();
      });
    });

    it('should handle invalid package folders', function(done){
      var emptyPackagesFolder = 'test/config';
      cli_generator.list(emptyPackagesFolder, function(err, lists){
        assert.ifError(err);
        assert.equal(lists.length, 0);
        done();
      });
    });

    it('should not repeat results', function(done){
      cli_generator.list([packagesLocalFolder, packagesLocalFolder, packagesLocalFolder], function(err, lists){
        assert.ifError(err);
        assert.equal(lists.length, 1);
        done();
      });
    });

  });
});