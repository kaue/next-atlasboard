module.exports = function(widgets, scheduler, config) {
    var jobFrequency = 7 * 1000; //Fires once every 7 seconds

    scheduler.schedule(function() {

        //To generate a line graph, simply create an array of numbers and send it through to the linegraph widget
        var salesData = getSalesData(15);
        widgets.sendData({linegraph: salesData, title: config.widgetTitle, dataDisplay: "soldThisMonth"});



    }, jobFrequency);

}

function getSalesData(days) {
    //Generates some random numbers
    var results = [];

    for (var i = 0; i < days; i++) {
        results[i] = 100 + (-30 + Math.floor(Math.random() * 60));
    }

    return results;

}