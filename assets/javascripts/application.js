//= jquery
//= console-helper
//= jquery.gridster.with-extras
//= underscore

$(function() {

  var defaultHandlers = {
    onError : function (el, data){
      $('.content', el).html("<div class='error'>" + data.error + "</div>");
    },
    onInit : function (el, data){
      $("<img class=\"spinner\" src=\"images/spinner.gif\">").insertBefore($('.content', el));
    },
    onPreData : function (el, data){
      $(".spinner", el).hide();
    }
  };

  if (!$("#widgets-container").length)
      return;

  function bind_widget(widgetsSocket, li){
    var widgetId = encodeURIComponent($(li).attr("data-widget-id"));
    var eventId = $(li).attr("data-event-id");

    // fetch widget html and css
    $(li).load("/widgets/" + widgetId, function() {

      // fetch widget js
      $.get("/widgets/" + widgetId + '/js', function(js) {

        var widget_js = eval(js);
        $.extend(widget_js, defaultHandlers);

        widget_js.onInit(li);

        widgetsSocket.on(eventId, function (data) { //bind socket.io event listener
            var f = data.error ? widget_js.onError : widget_js.onData;
            defaultHandlers.onPreData(li);
            f($(li), data);
        });

        widgetsSocket.emit("resend", eventId);
        console.log("Sending resend for " + eventId);
      });
    });
  }

  function bind_ui(widgetsSocket){
    var gutter = parseInt($("#main-container").css("paddingTop"), 10) * 2;
    var gridsterGutter = gutter/2;
    var height = 1080 - $("#widgets-container").offset().top - gridsterGutter;
    var width = $("#widgets-container").width();
    var vertical_cells = 4, horizontal_cells = 6;
    var widgetSize = {
      w: (width - horizontal_cells * gutter) / horizontal_cells,
      h: (height - vertical_cells * gutter) / vertical_cells
    };

    $(".gridster ul").gridster({
      widget_margins: [gridsterGutter, gridsterGutter],
      widget_base_dimensions: [widgetSize.w, widgetSize.h]
    })
    .children("li").each(function(index, li) {
      bind_widget(widgetsSocket, li);
    });
  }

  var options = {
    'reconnect': true,
    'reconnection delay': 500,
    'max reconnection attempts': 10
  };

  //----------------------
  // widget socket
  //----------------------
  var socket_w = io.connect('/widgets', options);

  bind_ui(socket_w);

  socket_w.on("connect", function() {
    console.log('reconnected');
  });

  socket_w.on("disconnect", function() {
    console.log('disconnected');
  });

  //----------------------
  // status socket
  //----------------------
  var socket_s = io.connect('/', options);
  var serverInfo;
  socket_s.on("serverinfo", function(newServerInfo) {
    if (!serverInfo) {
      serverInfo = newServerInfo;
    } else if (newServerInfo.startTime > serverInfo.startTime) {
      window.location.reload();
    }
  });
});
