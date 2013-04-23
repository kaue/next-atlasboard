var fs = require('fs'),
    path = require('path'),
    helpers = require('./helpers'),
    item_manager = require('./item-manager'),
    extend = require("xtend"),
    logger = require('./logger')();


function readDashboard (dashboardFilePath){
  var board_config = JSON.parse(fs.readFileSync(dashboardFilePath));

  if (!board_config.layout){
    throw('No layout field found in ' + dashboardFilePath);
  }

  if (!board_config.layout.widgets){
    throw('No widgets field found in ' + dashboardFilePath);
  }
  return board_config;
}


module.exports = {
  //----------------------------------------
  // Return the jobs for all available dashboards in all the packages
  //----------------------------------------
  get_jobs : function (packagesPath, configPath, callback) {

    // ----------------------------------------------
    // get all dashboards from all packages folder
    // ----------------------------------------------
    item_manager.get(packagesPath, "dashboards", ".json", function(err, dashboard_config_files){
      if (err){
        return callback(err);
      }

      // ----------------------------------------------
      // get all jobs from those packages
      // ----------------------------------------------
      item_manager.get(packagesPath, "jobs", ".js", function(err, all_jobs){
        if (err){
          return callback(err);
        }

        var jobs = [];
        var config_path = path.join(configPath,"/dashboard_common.json");
        var general_dashboard_config = {};

        // ----------------------------------------------
        // general config is optional, but if it exists it needs to be a valid file
        // ----------------------------------------------
        if (fs.existsSync(config_path)){
          try{
            general_dashboard_config = JSON.parse(fs.readFileSync(config_path)).config;
            if (!general_dashboard_config) throw 'invalid format. config property not found';
          }
          catch (e){
            return callback("ERROR reading general config file..." + config_path);
          }
        }

        // ----------------------------------------------
        // process each dashboard
        // ----------------------------------------------
        for (var d = 0, dl = dashboard_config_files.length; d < dl ; d++) {

          var board_config;
          try {
            board_config = readDashboard(dashboard_config_files[d]);
          }
          catch (e){
            return callback (e);
          }

          for (var i = 0, l = board_config.layout.widgets.length; i < l ;  i++) {

            // ----------------------------------------------
            // read individual widgets 
            // ----------------------------------------------
            var board_item = board_config.layout.widgets[i];

            if (board_item.job) { // widgets can run without a job, displaying just static html.

              // ----------------------------------------------
              // bind job definition to an actual job
              // ----------------------------------------------
              var candidate_jobs = item_manager.resolve_candidates(all_jobs, board_item.job, "jobs", ".js");
              if (!candidate_jobs.length){
                return callback("No job file found for " + board_item.job + " in " + dashboard_config_files[d]);
              }

              var job_worker = {
                task : require(candidate_jobs[0]),
                dashboard_name : path.basename(dashboard_config_files[d], '.json'),
                widget_item : board_item,
                job_name : board_item.job,
                // config (extend global config with dashboard specific one)              
                config : extend(general_dashboard_config[board_item.config], board_config.config[board_item.config])
              };

              jobs.push(job_worker);
            }
          }
        }

        callback(null, jobs);
      });
    });
  }
};