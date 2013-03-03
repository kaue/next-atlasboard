var fs = require('fs'),
    path = require('path'),
    helpers = require('./atlasboard_helpers'),
    item_manager = require('./atlasboard_item_manager');


module.exports = {

  //----------------------------------------
  // Return the jobs for all available dashboards in all the packages
  //----------------------------------------
  get_jobs : function (packagesPath, callback) {

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

                // get each dashboard
                dashboard_config_files.forEach(function(dashboard_config_file) {

                    var board_config = JSON.parse(fs.readFileSync(dashboard_config_file));

                    // get each widget for that dashboard and create a job_worker
                    board_config.layout.widgets.forEach(function(board_item){

                        if (board_item.job) { // widgets can run without a job, displaying just static html.

                            var job_worker = {};

                            // bind job task
                            var candidate_jobs = all_jobs.filter(function(job){return path.basename(job, ".js") === board_item.job;});
                            if (candidate_jobs && candidate_jobs.length){
                                job_worker.task = require(candidate_jobs[0]); //use the first job that matches job_name
                            }

                            job_worker.dashboard_name = path.basename(dashboard_config_file, '.json');
                            job_worker.widget_item = board_item;
                            job_worker.job_name = board_item.job;

                            //config
                            job_worker.config = {};
                            if (board_config.config[board_item.config]){
                                job_worker.config = board_config.config[board_item.config];
                            }

                            jobs.push(job_worker);
                        }
                    });
                });

                callback(null, jobs);
            });
        });
    }
};