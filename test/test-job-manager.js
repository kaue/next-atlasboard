var assert = require ('assert');
var path = require ('path');
var jobs_manager = require('../lib/job-manager');

describe ('job manager', function(){

  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");
  var packagesWithInvalidJob = path.join(process.cwd(), "/test/fixtures/package_invalid_job");
  var packagesWithInvalidDashboard = path.join(process.cwd(), "/test/fixtures/package_invalid_format");
  var packagesWithNoWidgetField = path.join(process.cwd(), "/test/fixtures/package_dashboard_with_no_widgets");
  var packagesWithNoLayoutField = path.join(process.cwd(), "/test/fixtures/package_dashboard_with_no_layout");
  var packagesNoSharedStateForJobs = path.join(process.cwd(), "/test/fixtures/package_job_sharing_state");
  var packageMultipleConfigs = path.join(process.cwd(), "/test/fixtures/package_with_multiple_configs");

  //we use only wallboard local folder, since we don´t want our tests to depend on atlasboard jobs
  //var packagesAtlasboardFolder = path.join(process.cwd(), "/packages");

  var configPath = path.join(process.cwd(), "/test/fixtures/config");
  var invalidConfigPath = path.join(process.cwd(), "/test/fixtures/invalid-config");
  var validJsonWithInvalidFormatConfigPath = path.join(process.cwd(), "/test/fixtures/valid-json-invalid-structure-config");
  var noExistentConfigPath = path.join(process.cwd(), "/test/fixtures/THIS-PATH-DOES-NOT-EXISTS");

  it('should load dashboard', function(done){

    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err, err);
      assert.equal(job_workers.length, 8);

      assert.equal(job_workers[0].dashboard_name, "test_dashboard1");
      assert.equal(job_workers[1].dashboard_name, "test_dashboard1");

      assert.equal(job_workers[2].dashboard_name, "test_dashboard2");
      assert.equal(job_workers[3].dashboard_name, "test_dashboard2");
      assert.equal(job_workers[4].dashboard_name, "test_dashboard2");

      assert.equal(job_workers[5].dashboard_name, "other_test_dashboard1");
      done();
    });
  });

  it('should not load filtered dashboards', function(done){

    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath,
      filters: {
        dashboardFilter: "other_"
      }
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err, err);
      assert.equal(job_workers.length, 3); // 4 job items, 3 valid jobs

      assert.equal(job_workers[0].dashboard_name, "other_test_dashboard1");
      assert.equal(job_workers[1].dashboard_name, "other_test_dashboards2");
      assert.equal(job_workers[2].dashboard_name, "other_test_dashboards2");
      done();
    });
  });

  it('should not load filtered jobs', function(done){

    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath,
      filters: {
        jobFilter: "job1"
      }
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err, err);
      assert.equal(job_workers.length, 3);

      assert.equal(job_workers[0].dashboard_name, "test_dashboard1");
      assert.equal(job_workers[1].dashboard_name, "test_dashboard2");
      assert.equal(job_workers[2].dashboard_name, "other_test_dashboards2");
      done();
    });
  });

  it('should be able to get disable widgets', function(done){
    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err);
      var disabled_jobs = job_workers.filter(function(job){ return job.widget_item.enabled;});
      assert.equal(disabled_jobs.length, 6);
      done();
    });
  });

  it('should not return error if invalid dashboard is found since it has been filtered by item manager before', function(done){
    var options = {
      packagesPath: [packagesWithInvalidDashboard],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err);
      assert.equal(job_workers.length, 0);
      done();
    });
  });

  it('should return error if layout field is not found in dashboard file', function(done){
    var options = {
      packagesPath: [packagesWithNoLayoutField],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(err.indexOf('No layout field found')>-1);
      done();
    });
  });

  it('should return error if widgets field is not found in dashboard file', function(done){
    var options = {
      packagesPath: [packagesWithNoWidgetField],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(err.indexOf('No widgets field found')>-1);
      done();
    });
  });

  it('should return error if invalid job is found on dashboard', function(done){
    var options = {
      packagesPath: [packagesWithInvalidJob],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(err);
      done();
    });
  });

  it('should have an onRun function', function(done){
    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err);
      job_workers.forEach(function(job){
        assert.ok(typeof job.onRun === "function" );
      });
      done();
    });
  });

  it('should have config', function(done){
    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err);
      // job_conf1 is defined in general config file (shared config)
      // the rest of them are defined in the related dashboard file.
      job_workers.forEach(function(job){
        assert.ok(job.config.interval);
      });
      done();
    });
  });

  it('should be able to extend global config file with custom dashboards properties', function(done){
    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err);
      // job_conf1 should have some properties from the global config files
      // and other properties from the dashboard file
      var jobsWithJob1Config = job_workers.filter(function(job){return job.widget_item.config === "job1_conf";});

      assert.equal(jobsWithJob1Config.length, 3);

      // test_dasboard1 has aditional "other_configuration_option_to_extend_test_dashboard1" config key
      assert.ok(jobsWithJob1Config[0].config.interval);
      assert.ok(jobsWithJob1Config[0].config.other_configuration_option_to_extend_test_dashboard1);
      assert.ok(!jobsWithJob1Config[0].config.other_configuration_option_to_extend_test_dashboard2);

      // test_dasboard1 has aditional "other_configuration_option_to_extend_test_dashboard2" config key
      assert.ok(jobsWithJob1Config[1].config.interval);
      assert.ok(!jobsWithJob1Config[1].config.other_configuration_option_to_extend_test_dashboard1);
      assert.ok(jobsWithJob1Config[1].config.other_configuration_option_to_extend_test_dashboard2);

      // other_test_dashboard2 doesn´t have any of those
      assert.ok(jobsWithJob1Config[2].config.interval);
      assert.ok(!jobsWithJob1Config[2].config.other_configuration_option_to_extend_test_dashboard1);
      assert.ok(!jobsWithJob1Config[2].config.other_configuration_option_to_extend_test_dashboard2);

      done();
    });
  });

  it('should have independent states for each job', function(done){
    var options = {
      packagesPath: [packagesNoSharedStateForJobs],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err, err);
      assert.equal(job_workers.length, 2);
      job_workers[0].onRun(null, null, function(err, data){
        assert.ok(!data);
        job_workers[1].onRun(null, null, function(err, data){
          assert.ok(!data);
          done();
        });
      });
    });
  });

  it('should not work with an invalid global config file', function(done){
    var options = {
      packagesPath: [packagesNoSharedStateForJobs],
      configPath: invalidConfigPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(err);
      done();
    });
  });

  it('should not work with an global config file with wrong structure', function(done){
    var options = {
      packagesPath: [packagesNoSharedStateForJobs],
      configPath: validJsonWithInvalidFormatConfigPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(err);
      done();
    });
  });

  it('should work with no global config file', function(done){
    var options = {
      packagesPath: [packagesNoSharedStateForJobs],
      configPath: noExistentConfigPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      assert.ok(!err, err);
      done();
    });
  });

  it('should work with multiple configs', function(done){
    var options = {
      packagesPath: [packageMultipleConfigs],
      configPath: configPath
    };

    jobs_manager.getJobs(options, function(err, job_workers){
      var job = job_workers[0];
      var cfg = job.config;

      assert.equal(cfg.interval, 30000, 'Config B interval should override config A interval');
      assert.equal(cfg.config_a_unique, 'unique-config-1', 'Config A unique value should be available');
      assert.equal(cfg.config_b_unique, 'unique-config-2', 'Config B unique value should be available');
      assert.equal(cfg.jira_server, 'https://jira.atlassian.com', 'Global config value should be available');

      done();
    });
  });

});
