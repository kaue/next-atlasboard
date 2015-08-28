//= jquery
//= jquery.gridster.with-extras
//= underscore

$(function() {

  function resizeBaseLineBasedOnWidgetWith ($el){
    var RATIO = 0.035; // ratio width vs font-size. i.e: for a 400 width widget, 400 * 0.035 = 14px font size as baseline
    var divWidth = $el.width();
    var newFontSize = divWidth * RATIO;
    $('.content.auto-font-resize', $el).css({"font-size" : newFontSize + 'px'});
  }

  var defaultHandlers = { // they can be overwritten by widget´s custom implementation
    onError : function (el, data){
      console.error(data);
    },
    onInit : function (el, data){
      $(el).parent().children().hide();
      $(el).parent().children(".spinner").fadeIn();
      resizeBaseLineBasedOnWidgetWith($(el));
    }
  };

  var widgetMethods = { // common methods that all widgets implement
    log : function (data){
      socket.emit('log', {widgetId : this.eventId, data : data}); // emit to logger
    }
  };

  var globalHandlers = { // global pre-post event handlers
    onPreError : function (el, data){
      var $errorContainer = $(el).children(".widget-error");
      if (data && data.error === 'disabled'){
        $errorContainer.html('<span class="disabled">DISABLED</span>');
      } else {
        $errorContainer.html('<span class="error">&#9888;</span>');
      }

      if (!$errorContainer.is(':visible')) {
        $(el).children().hide();
        $errorContainer.fadeIn();
      }
    },

    onPreData : function (el, data){
      if (!$('.widget-container', el).is(':visible')){
        $(el).children().fadeOut(500);
        $(el).children(".widget-container").fadeIn(1000);
      }
    }
  };

  if (!$("#widgets-container").length){
    return;
  }

  function logError (widget, err){
    var errMsg = 'ERROR on ' + widget.eventId + ': ' + err;
    console.error(errMsg);
    socket.emit('log', {widgetId : widget.eventId, error : errMsg}); // emit to logger
  }

  function bindWidget(io, li){
    var widgetId = encodeURIComponent($(li).attr("data-widget-id"));
    var eventId = $(li).attr("data-event-id");

    var $errorContainer = $("<div>").addClass("widget-error").appendTo($(li)).hide();

    var spinner = new Spinner({className: 'spinner', color:'#fff', width:5, length:15, radius: 25, lines: 12,  speed:0.7}).spin();
    $("<div>").addClass("spinner").append(spinner.el).appendTo($(li)).hide();

    var $widgetContainer = $("<div>").addClass("widget-container").appendTo($(li)).hide();

    // fetch widget html and css
    $widgetContainer.load("/widgets/" + widgetId, function() {

      // fetch widget js
      $.get('/widgets/' + widgetId + '/js', function(js) {

        var widgetJS;
        try{
          eval('widgetJS = ' + js);
          widgetJS.eventId = eventId;
          widgetJS = $.extend({}, defaultHandlers, widgetJS);
          widgetJS = $.extend({}, widgetMethods, widgetJS);
          widgetJS.onInit($widgetContainer[0]);
        }
        catch (e){
          logError(widgetJS, e);
        }

        io.on(eventId, function (data) { //bind socket.io event listener
          if (data.error){
            globalHandlers.onPreError.apply(widgetJS, [$(li), data]);
          } else {
            globalHandlers.onPreData.apply(widgetJS, [$(li)]);
          }

          var f = data.error ? widgetJS.onError : widgetJS.onData;
          var $container = data.error ? $errorContainer : $widgetContainer;
          try{
            f.apply(widgetJS, [$container, data]);
          }
          catch (e){
            logError(widgetJS, e);
          }
        });

        io.emit("resend", eventId);
      });
    });
  }

  function buildUI(mainContainer, gridsterContainer){
    var gutter = parseInt(mainContainer.css("paddingTop"), 10) * 2;
    var gridsterGutter = gutter/2;
    var height = 1080 - mainContainer.offset().top - gridsterGutter;
    var width = mainContainer.width();
    var vertical_cells = grid_rows, horizontal_cells = grid_columns;
    var widgetSize = {
      w: (width - horizontal_cells * gutter) / horizontal_cells,
      h: (height - vertical_cells * gutter) / vertical_cells
    };

    gridsterContainer.gridster({
      'widget_margins': [gridsterGutter, gridsterGutter],
      'widget_base_dimensions': [widgetSize.w, widgetSize.h]
    });

    // Handle browser resize
    var initialWidth = mainContainer.outerWidth();
    var initialHeight = mainContainer.outerHeight();

    $(window).resize(function() {
        var scaleFactorWidth = $(window).width() / initialWidth;
        var scaleFactorHeight = $(window).height() / initialHeight;
        mainContainer.css("transform", "scale(" + Math.min(scaleFactorWidth, scaleFactorHeight) + ")");
    }).resize();

  }

  function bindSocket (io, gridsterContainer){
    gridsterContainer.children("li").each(function(index, li) {
      $(li).empty();
      bindWidget(io, li);
    });
  }

  //----------------------
  // Main
  //----------------------

  // disable caching for now as chrome somehow screws things up sometimes
  $.ajaxSetup({cache: false});

  var mainContainer = $("#main-container");
  var gridsterContainer = $(".gridster ul");

  buildUI(mainContainer, gridsterContainer);

  var serverInfo;
  var socket = io.connect();

  socket.on("connect", function() {

    console.log('connected');
    $('#main-container').removeClass("disconnected");

    bindSocket(socket, gridsterContainer);

    socket.on("disconnect", function() {
      $('#main-container').addClass("disconnected");
      console.log('disconnected');
    });

    // reconnect
    socket.on('reconnecting', function () {
      console.log('reconnecting...');
    });

    socket.on('reconnect_failed', function () {
      console.log('reconnected FAILED');
    });

    socket.on("serverinfo", function(newServerInfo) {
      if (!serverInfo) {
        serverInfo = newServerInfo;
      } else if (newServerInfo.startTime > serverInfo.startTime) {
        window.location.reload();
      }
    });
  });
});