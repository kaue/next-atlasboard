module.exports = function(config, dependencies, job_callback) {
    var text = "Hello World!";

    // first parameter is error (if any). Second parameter is the job result (if success)
    job_callback(null, {title: config.widgetTitle, text: text});
};
