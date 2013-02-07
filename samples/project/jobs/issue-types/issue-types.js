var request = require('request'),
    pg = require('pg');

module.exports = function(widgets, scheduler, config) {

    var jobFrequency = 20 * 60 * 1000; //job runs once every 20 minutes
    scheduler.schedule(function() {

        var database = config.database;

        /*
         * Enter your connection string here. Something like:
         * "tcp://" + config.globalAuth.salesdb.username + ":" + config.globalAuth.salesdb.password + "@" + database.host + ":" + database.port + "/" + database.database;
         */
        var conString =  "";

        var salesQueryString = 	"SELECT * FROM issues limit 100"

        pg.connect(conString, function(err, client) {
            var issues = [];
            /*
             * Our database details (retrieved from the database defined in the JSON config file) won't work here,
             * so the err if statement will trigger. Normally, we'd go through to the client.query() section when
             * the connection works.
             */
            if (err) {
                //console.log("ERROR connecting to %s:%d at %s", database.database, database.port, database.host);
                issues = [{"issueType" : "Test failures", "frequency" : 28},
                    {"issueType" : "Broken build", "frequency" : 20},
                    {"issueType" : "Usability Issue", "frequency" : 16},
                    {"issueType" : "Compilation Error", "frequency" : 13},
                    {"issueType" : "Out of Memory", "frequency" : 8},
                    {"issueType" : "Null Pointer", "frequency" : 7},
                    {"issueType" : "XSS Vulnerability", "frequency" : 4}];
                widgets.sendData({issues: issues, title: config.widgetTitle});

                return;
            }
            client.query(salesQueryString, function(err, result) {
                //Example operation on query results
                result.rows.forEach(function(row) {
                    issues.push({"issueType" : row.type, "frequency" : row.count});
                });

                widgets.sendData({issues: issues, title: config.widgetTitle});
            });

        });

    }, jobFrequency);

}