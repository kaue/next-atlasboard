var fs = require('fs'),
    path = require('path'),
    helpers = require('./atlasboard_helpers');

function get_job(packagesPath, jobsPath, job_name){
    var job = {};
    //1. look into user jobs. 2. look into packages folder
    var job_path = helpers.get_first_existing_file (path.join(jobsPath, job_name + ".js"),
            path.join(packagesPath, job_name, "job", job_name + ".js"));

    if (job_path){
        job.task = require(job_path);
    } else{
        job.task = function(){};
        console.error("Could not find job file in %s", job_name);
    }
    return job;
}

module.exports = {

  get_jobs : function (dashboardsPath, packagesPath, jobsPath, callback) {

        fs.readdir(dashboardsPath, function(err, dashboard_config_files) {
            if (err){
              return callback (err);
            }
            var jobs = [];

            // get each dashboard
            dashboard_config_files.forEach(function(dashboard_config_file) {

                if (path.extname(dashboard_config_file) === '.json'){ //make sure it is the right extension

                    var board_config = JSON.parse(fs.readFileSync(path.join(dashboardsPath, dashboard_config_file)));

                    // get each widget for that dashboard
                    board_config.layout.widgets.forEach(function(board_item){

                        if (board_item.job) { // widgets can run without a job, displaying just static html.

                            var job_worker = get_job(packagesPath, jobsPath, board_item.job);
                            job_worker.dashboard_name = dashboard_config_file.split('.')[0];
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
                }
            });

            callback(null, jobs);
        });
    }
};