var request = require('request'),
    $ = require('cheerio');

module.exports = function(widgets, scheduler, config) {

    var jobFrequency = 20 * 60 * 1000; //job runs once every 20 minutes
    scheduler.schedule(function() {
        var options = {
            url: config.url
            /*
             * I don't need authorization here, but if I did, I could get my username and password from the globalAuth.json file
             * The contents of this file are accessed via config.globalAuth
             *
            headers: {
                "authorization": "Basic " + new Buffer(config.globalAuth.nasa.username + ":" + config.globalAuth.nasa.password).toString("base64")
            }
            */
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
