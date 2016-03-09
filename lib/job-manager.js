var fs = require('fs');
var path = require('path');
var util = require('util');
var extend = require('xtend');
var itemManager = require('./item-manager');
var logger = require('./logger')();

/**
 * Return a particular dashboard object
 *
 * @param  {string} dashboardFilePath dashboard path
 * @return {object} dashboard object
 */

function readDashboard(dashboardFilePath) {
  var dashboardConfig = JSON.parse(fs.readFileSync(dashboardFilePath));

  if (!dashboardConfig.layout) {
    throw('No layout field found in ' + dashboardFilePath);
  }

  if (!dashboardConfig.layout.widgets) {
    throw('No widgets field found in ' + dashboardFilePath);
  }
  return dashboardConfig;
}

/**
 * Returns true if dashboard matches a particular regex filter
 *
 * @param  {string} dashboardFullPath dashboard full path
 * @param  {string} filter regex
 * @return {boolean}
 */

function matchDashboardFilter (dashboardFullPath, filter){
  var dashboardName = path.basename(dashboardFullPath);
  return dashboardName.match(filter);
}

/**
 * Returns true if job matches a particular regex filter
 *
 * @param  {string} jobName job name
 * @param  {string} filter regex
 * @return {boolean}
 */

function matchJobFilter (jobName, filter){
  return jobName.match(filter);
}

/**
 * Process all jobs from a dashboard
 *
 * @param  {array} allJobs all available jobs
 * @param  {string} dashboardName dashboard name
 * @param  {object} dashboardConfig dashboard config
 * @param  {object} filters filters, if any
 * @return {array} related jobs
 */
function processDashboard (allJobs, dashboardName, dashboardConfig, filters){
  var jobs = [];
  for (var i = 0, l = dashboardConfig.layout.widgets.length; i < l ;  i++) {
    var jobItem = dashboardConfig.layout.widgets[i];
    if (jobItem.job) { // widgets can run without a job, displaying just static html.
      if (filters.jobFilter){
        if (!matchJobFilter(jobItem.job, filters.jobFilter)){
          continue;
        }
      }

      var candidateJobs = itemManager.resolveCandidates(allJobs, jobItem.job, "jobs", ".js");
      if (!candidateJobs.length){
        throw "  ERROR RESOLVING JOB " +
              "\n   No job file found for \"" + jobItem.job + "\" in " + dashboardName +
              "\n   Did you pulled all the packages dependencies? (they are git submodules)" +
              "\n\n   $ git submodule init"+
              "\n   $ git submodule update\n";
      }

      var job = {
        'dashboard_name' : path.basename(dashboardName, '.json'),
        'widget_item' : jobItem,
        'job_name' : jobItem.job,
        'configKey' : jobItem.config
      };

      var jobRequire = require(candidateJobs[0]);
      if (typeof jobRequire === 'function') {
        job.onRun = jobRequire;
      } else {
        job.onRun = jobRequire.onRun || function(){};
        job.onInit = jobRequire.onInit || function(){};
      }

      jobs.push(job);
    }
  }
  return jobs;
}


module.exports = {

  /**
   * Return the jobs for all available dashboards in all the packages
   *
   * @param  {object}   options  options object
   * @param  {Function} callback
   */

  getJobs : function (options, callback) {

    var packagesPath = options.packagesPath;
    var filters = options.filters || {};

    var configPath = path.join(options.configPath,"/dashboard_common.json");
    var generalDashboardConfig = {};

    var jobs = [];

    // ----------------------------------------------
    // general config is optional, but if it exists it needs to be a valid file
    // ----------------------------------------------
    if (fs.existsSync(configPath)){
      try{
        generalDashboardConfig = JSON.parse(fs.readFileSync(configPath)).config;
        if (!generalDashboardConfig) {
          throw 'invalid format. config property not found';
        }
      }
      catch (e){
        return callback("ERROR reading general config file..." + configPath);
      }
    }

    // ----------------------------------------------
    // get all dashboards from all packages folder
    // ----------------------------------------------
    itemManager.get(packagesPath, "dashboards", ".json", function(err, dashboardConfigFiles){
      if (err){ return callback(err); }

      // ----------------------------------------------
      // get all jobs from those packages
      // ----------------------------------------------
      itemManager.get(packagesPath, "jobs", ".js", function(err, allJobs){
        if (err){ return callback(err); }

        for (var d = 0, dl = dashboardConfigFiles.length; d < dl ; d++) {
          var dashboardName = dashboardConfigFiles[d];

          if (filters.dashboardFilter){
            if (!matchDashboardFilter(dashboardName, filters.dashboardFilter)){
              continue;
            }
          }

          var dashboardConfig;
          var dashboardJobs;
          try {
            dashboardConfig = readDashboard(dashboardName);
            dashboardJobs = processDashboard(allJobs, dashboardName, dashboardConfig, filters);
          }
          catch (e){
            return callback (e);
          }

          // add config to job, extending for the same config key in general config, if any
          dashboardJobs = dashboardJobs.map(function(job){

            // Single configuration
            if(util.isString(job.configKey)) {
              job.config = extend(generalDashboardConfig[job.configKey], dashboardConfig.config[job.configKey]);
            }

            // Multiple configurations:
            //  local overrides global
            //  config n+1 overrides config n
            if(util.isArray(job.configKey)) {
              var configs = job.configKey.map(function(key){
                return extend(generalDashboardConfig[key], dashboardConfig.config[key]);
              });
              job.config = extend.apply(null, configs);
            }

            return job;
          });

          jobs = jobs.concat(dashboardJobs);
        }

        callback(null, jobs);
      });
    });
  }
};