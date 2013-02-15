var pg = require('pg');

module.exports = function(widgets, scheduler, config) {

    var jobFrequency = 20 * 60 * 1000; //job runs once every 20 minutes
    scheduler.schedule(function() {

        issues = [{"issueType" : "Test failures", "frequency" : 28},
            {"issueType" : "Broken build", "frequency" : 20},
            {"issueType" : "Usability Issue", "frequency" : 16},
            {"issueType" : "Compilation Error", "frequency" : 13},
            {"issueType" : "Out of Memory", "frequency" : 8},
            {"issueType" : "Null Pointer", "frequency" : 7},
            {"issueType" : "XSS Vulnerability", "frequency" : 4}];

        widgets.sendData({issues: issues, title: config.widgetTitle});

    }, jobFrequency);

}