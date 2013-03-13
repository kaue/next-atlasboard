//= jquery
//= console-helper
//= jquery.gridster.with-extras
//= underscore

$(function() {

  //----------------------
  // Alert for timeouts per widget
  //----------------------
  function check_last_server_communication (){
    $(".gridster ul").children("li").each(function(index, li) {
      var lastUpdate = $(li).attr('last-update');
      var elapsedEl = '.widget-title span.widget-elapsed';

      if (lastUpdate){
        var elapsed = ((+new Date()) - lastUpdate) / 1000;
        var str_elapsed = '';
        var offline = false;

        if (elapsed > 60 * 60){
          str_elapsed = ' <span class="alert alert_high">&gt;1h</span>';
        }
        else if (elapsed > 20 * 60){
          offline = true;
          str_elapsed = ' <span class="alert alert_high">&gt;20m</span>';
        }
        else if (elapsed > 10 * 60){
          offline = true;
          str_elapsed = ' <span class="alert alert_low">&gt;10m</span>';
        }
        else if (elapsed > 5 * 60){
          offline = true;
          str_elapsed = ' <span class="alert alert_normal">&gt;5m</span>';
        }

        if ($(elapsedEl, li).length === 0){
          $('.widget-title', li).append('<span class="widget-elapsed"></span>');
        }
        $('.widget-title span.widget-elapsed', li).html(str_elapsed);

        if (offline){ // fade widget
          $(li).addClass('offline');
        }
        else{
          $(li).removeClass('offline');
        }
      }

    });
  }

  var defaultHandlers = { //they can be overwritten by widget´s custom implementation
    onError : function (el, data){
      $('.content', el).html("<div class='error'>" + data.error + "</div>");
      console.log(data);
    },
    onInit : function (el, data){
      $("<img class=\"spinner\" src=\"images/spinner.gif\">").insertBefore($('.content', el));
    }
  };

  var globalHandlers = { //global pre-post event handlers
    onPreError : function (el, data){
      $(el).addClass('onerror');
      $(".spinner", el).hide();
    },

    onPreData : function (el, data){
      $(el).removeClass('onerror');
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
            if (data.error){
              globalHandlers.onPreError($(li), data);
            }
            globalHandlers.onPreData(li);
            f($(li), data);

            // save timestamp
            $(li).attr("last-update", +new Date());
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
    'reconnection delay': 5000,
    'reopen delay': 3000,
    'max reconnection attempts': 100
  };

  //----------------------
  // widget socket
  //----------------------
  var socket_w = io.connect('/widgets', options);

  socket_w.on("connect", function() {

    console.log('connected');
    $('#main-container').removeClass("disconnected");

    bind_ui(socket_w);

    socket_w.on("disconnect", function() {
      $('#main-container').addClass("disconnected");
      console.log('disconnected');
    });

    // reconnect
    socket_w.on('reconnecting', function () {
      console.log('reconnecting...');
    });

    socket_w.on('reconnect_failed', function () {
      console.log('reconnected FAILED');
    });

  });


  //----------------------
  // Server timeout notifications
  //----------------------
  setInterval(check_last_server_communication, 5000);

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
