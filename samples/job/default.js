module.exports = function(widgets, config, dependencies) {
    var text = "Hello World!";

    //We're sending the data as an object to any widget listening to this "job" here
    widgets.sendData({title: config.widgetTitle, text: text});
};
