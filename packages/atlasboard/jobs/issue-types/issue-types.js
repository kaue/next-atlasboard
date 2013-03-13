module.exports = function(widgets, config, dependencies, job_callback) {
    issues = [{"issueType" : "Test failures", "frequency" : 28},
        {"issueType" : "Broken build", "frequency" : 20},
        {"issueType" : "Usability Issue", "frequency" : 16},
        {"issueType" : "Compilation Error", "frequency" : 13},
        {"issueType" : "Out of Memory", "frequency" : 8},
        {"issueType" : "Null Pointer", "frequency" : 7},
        {"issueType" : "XSS Vulnerability", "frequency" : 4}];

    widgets.sendData({issues: issues, title: config.widgetTitle});
    job_callback(null);
};