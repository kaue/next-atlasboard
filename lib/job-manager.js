var fs = require('fs'),
    path = require('path'),
    helpers = require('./helpers'),
    item_manager = require('./item-manager');


module.exports = {

  //----------------------------------------
  // Return the jobs for all available dashboards in all the packages
  //----------------------------------------
  get_jobs : function (packagesPath, configPath, callback) {

    // get all dashboards from packages folder
    item_manager.get(packagesPath, "dashboards", ".json", function(err, dashboard_config_files){
      if (err){
        return callback(err);
      }

      // get all jobs from packages
      item_manager.get(packagesPath, "jobs", ".js", function(err, all_jobs){
        if (err){
          return callback(err);
        }

        var jobs = [];
        var config_path = path.join(configPath,"/dashboard_common.json");
        var general_dashboard_config = {};

        try{
          //general config is optional
          general_dashboard_config = JSON.parse(fs.readFileSync(config_path));
        }
        catch (e){
          console.log("No critical error reading general config file..." + config_path);
        }

        // get each dashboard
        for (var d = 0, dl = dashboard_config_files.length; d < dl ; d++) {
          var dashboard_config_file = dashboard_config_files[d];

          var board_config;
          try {
            board_config = JSON.parse(fs.readFileSync(dashboard_config_file));
          }
          catch(e){
            return callback("Invalid dashboard file : " + dashboard_config_file);
          }

          // get each widget for that dashboard and create a job_worker
          for (var i = 0, l = board_config.layout.widgets.length; i < l ;  i++) {
            var board_item = board_config.layout.widgets[i];
            if (board_item.job) { // widgets can run without a job, displaying just static html.

              var job_worker = {};
              // bind job task
              var candidate_jobs = item_manager.resolve_candidates(all_jobs, board_item.job, "jobs", ".js");
              if (candidate_jobs.length){
                job_worker.task = require(candidate_jobs[0]); //use the first job that matches job_name
              }
              else{
                return callback("No job file found for " + board_item.job + " in " + dashboard_config_file);
              }

              job_worker.dashboard_name = path.basename(dashboard_config_file, '.json');
              job_worker.widget_item = board_item;
              job_worker.job_name = board_item.job;

              // config
              job_worker.config = {};
              if (board_item.config){
                if (board_config.config[board_item.config]){
                  job_worker.config = board_config.config[board_item.config];
                }
                else{
                  //the dashboard doesnt contain that config key. Try to look it up in the general config file
                  if (general_dashboard_config.config[board_item.config]){
                    job_worker.config = general_dashboard_config.config[board_item.config];
                  }
                }
              }
              jobs.push(job_worker);
            }
          }
        }

        callback(null, jobs);
      });
    });
  }
};