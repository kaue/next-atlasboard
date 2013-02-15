module.exports = function(widgets, scheduler, config) {
    var refreshTime = 10 * 60 * 1000; //The job will run once every refreshTime milliseconds

    scheduler.schedule(function() {
        var text = "Hello World!";

        //We're sending the data as an object to any widget listening to this "job" here
        widgets.sendData({title: config.widgetTitle, text: text});

    }, config.interval || refreshTime);
}
