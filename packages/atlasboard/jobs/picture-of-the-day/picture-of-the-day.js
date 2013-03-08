var $ = require('cheerio');

module.exports = function(widgets, config, dependencies) {
    var logger = dependencies.logger;
    var options = {
        url: config.url
    };

    dependencies.request(options, function(err, response, body) {
        if (err || !response || response.statusCode != 200) {
            logger.error(err || "ERROR: Couldn't access the web page at " + options.url);
            widgets.sendData({error: "error loading picture" });
        } else {
            var result = $('.primary_photo img', body).attr('src');
            widgets.sendData({imageSrc: result, title: config.widgetTitle });
        }
    });
};
