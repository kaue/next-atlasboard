var pg = require('postgres');

exports.query = function(connectionString, query, params, callback) {
    // handle case where params are omitted
    if (arguments.length === 2) {
        callback = params;
        params = [];
    }

    pg.connect(connectionString, function(err, client) {
        client.query(query, params, function(err, results) {
            if (err) throw err;
            callback(results);
        });
    });
};