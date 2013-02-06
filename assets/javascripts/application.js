//= jquery
//= console-helper
//= jquery.gridster.with-extras
//= underscore

$(function() {
    if (!$("#widgets-container").length)
        return

    var gutter = parseInt($("#main-container").css("paddingTop")) * 2;
    var gridsterGutter = gutter/2;
    var height = 1080 - $("#widgets-container").offset().top - gridsterGutter;
    var width = $("#widgets-container").width();

    var widgetsSocket = io.connect("/widgets");

    $(".gridster ul").gridster({
        widget_margins: [gridsterGutter, gridsterGutter],
        widget_base_dimensions: [(width - 6 * gutter) / 6, (height - 4 * gutter) / 4]
    })
    .children("li").each(function(index, li) {
        var widgetId = $(li).attr("data-widget-id");
        var eventId = $(li).attr("data-event-id");

        $(li).load("/widgets/" + widgetId, function() {
            // only add the event listener once the widget HTML is loaded
            widgetsSocket.on(eventId, function (data) {
                Widgets[widgetId].onData($(li), data);
            })
            console.log("Sending resend for " + eventId);
            // trigger the server to send the last event for the given event id again
            widgetsSocket.emit("resend", eventId);
        });
    })

    var socket = io.connect();
    var serverInfo;
    socket.on("serverinfo", function(newServerInfo) {
        if (!serverInfo) {
            serverInfo = newServerInfo;
        } else if (newServerInfo.startTime > serverInfo.startTime) {
            window.location.reload();
        }
    })
});
