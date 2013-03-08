//= jquery
//= console-helper
//= jquery.gridster.with-extras
//= underscore

$(function() {

    var default_handlers = {
        error : function (el, data){
            $(".spinner", el).hide();
            $('.content', el).html("<div class='error'>" + data.error + "</div>");
        },
        init : function (el, data){
            $("<img class=\"spinner\" src=\"images/spinner.gif\">").insertBefore($('.content', el));
        },
        pre_data : function (el, data){
            $(".spinner", el).hide();
        },
        post_data : function (el, data){

        }
    };

    if (!$("#widgets-container").length)
        return;

    function bind(widgetsSocket){
        $(".gridster ul").gridster({
            widget_margins: [gridsterGutter, gridsterGutter],
            widget_base_dimensions: [(width - 6 * gutter) / 6, (height - 4 * gutter) / 4]
        })
        .children("li").each(function(index, li) {
            var widgetId = $(li).attr("data-widget-id");
            var eventId = $(li).attr("data-event-id");

            $(li).load("/widgets/" + widgetId, function() {

                if (Widgets[widgetId]){ //make sure this widget is activable

                    // attach init handler and init
                    if (!Widgets[widgetId].onInit) {
                        Widgets[widgetId].onInit = default_handlers.init;
                    }
                    Widgets[widgetId].onInit(li);

                    // attach err handler
                    if (!Widgets[widgetId].onError) {
                        Widgets[widgetId].onError = default_handlers.error;
                    }

                    // only add the event listener once the widget HTML is loaded
                    widgetsSocket.on(eventId, function (data) {
                        var f = data.error ? Widgets[widgetId].onError : Widgets[widgetId].onData;

                        default_handlers.pre_data(li);

                        f($(li), data);

                        default_handlers.post_data(li);
                    });

                    console.log("Sending resend for " + eventId);
                    // trigger the server to send the last event for the given event id again
                    widgetsSocket.emit("resend", eventId);
                }
            });
        });
    }

    var gutter = parseInt($("#main-container").css("paddingTop"), 10) * 2;
    var gridsterGutter = gutter/2;
    var height = 1080 - $("#widgets-container").offset().top - gridsterGutter;
    var width = $("#widgets-container").width();
    var try_reconnect_timer;
    var try_to_reconnect_every = 10000;


    var options = {
        'reconnect': true,
        'reconnection delay': 500,
        'max reconnection attempts': 10
    };
    var socket_widget_channel = io.connect('/widgets', options);

    // undo delete io.connect

    bind(socket_widget_channel);


    socket_widget_channel.on("connect", function() {
      console.log('reconnected');
    });

    socket_widget_channel.on("disconnect", function() {
      console.log('disconnected');
    });

    var serverInfo;
    socket_widget_channel.on("serverinfo", function(newServerInfo) {
        if (!serverInfo) {
            serverInfo = newServerInfo;
        } else if (newServerInfo.startTime > serverInfo.startTime) {
            window.location.reload();
        }
    });
});
