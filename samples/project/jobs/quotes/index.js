var _ = require('underscore');

module.exports = function(widgets, scheduler, config) {
    var jobFrequency = 8 * 1000; // Job fires once every 10 seconds

    scheduler.schedule(function() {

        var quotes = config.quotes;
        quotes = _.shuffle(quotes);
        var display = [];
        for (var i = 0; i < config.limit && i < quotes.length; i++) {
            display.push(quotes[i]);
        }

        widgets.sendData({quotes: display, title: config.widgetTitle});

    }, jobFrequency);

}