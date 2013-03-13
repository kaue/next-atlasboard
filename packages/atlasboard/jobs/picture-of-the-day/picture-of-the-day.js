var $ = require('cheerio');

module.exports = function(widgets, config, dependencies, job_callback) {
    var logger = dependencies.logger;
    var options = {
        url: config.url
    };

    dependencies.request(options, function(err, response, body) {
        if (err || !response || response.statusCode != 200) {
            var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
            logger.error(err_msg);
            widgets.sendData({error: "error loading picture" });
            job_callback(err_msg);
        } else {
            var result = $('.primary_photo img', body).attr('src');
            widgets.sendData({imageSrc: result, title: config.widgetTitle });
            job_callback(null);
        }
    });
};
