var ical = require('ical'),
    _ = require('underscore');

module.exports = function(widgets, scheduler, config) {
    var jobFrequency = 15 * 60 * 1000; //fires once every 15 minutes
    var maxEntries = config.maxEntries;
    var formatDate = function(date) {
        var d = date.getDate();
        var m = date.getMonth()+1;
        return '' + (m<=9?'0'+m:m) + '/' + (d<=9?'0'+d:d);
    };


    scheduler.schedule(function() {
        ical.fromURL(config.calendarUrl, {}, function(err, data){

            var events = _.sortBy(data, function(event) { return event.start; });
            events = _.filter(events, function(event) { return event.end >= new Date(); });

            var result = [];
            var counter = 0;
            events.forEach(function(event) {
                if (counter < maxEntries) {
                    counter++;
                    result.push({startDate: formatDate(event.start), endDate: formatDate(event.end), summary: event.summary});
                }
            });

            widgets.sendData({events: result, title: config.widgetTitle});
        })
    }, jobFrequency);
}
