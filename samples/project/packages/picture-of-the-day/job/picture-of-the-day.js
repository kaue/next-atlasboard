var request = require('request'),
    $ = require('cheerio');

module.exports = function(widgets, scheduler, config) {

    var jobFrequency = 20 * 60 * 1000; //job runs once every 20 minutes
    scheduler.schedule(function() {
        var options = {
            url: config.url
        };

        request(options, function(error, response, body) {

            if (!response || response.statusCode != 200) {
                console.log("ERROR: Couldn't access the web page at %s", options.url)
                return;
            } else {
                var result = $('.primary_photo img', body).attr('src');
            }

            widgets.sendData({imageSrc: result, title: config.widgetTitle});
        });
    }, jobFrequency);
}
