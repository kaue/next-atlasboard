//= jquery
//= console-helper
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
      socket_log.emit('log', {widgetId : this.eventId, data : data}); // emit to logger
    }
  };

  var globalHandlers = { // global pre-post event handlers
    onPreError : function (el, data){
      var $errorContainer = $(el).children(".widget-error");
      if (data && data.error === 'disabled'){
        $errorContainer.html('<span class="disabled">DISABLED</span>');
      } else {
        $errorContainer.html('<span class="error">⚠</span>');
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

  if (!$("#widgets-container").length)
      return;

  function log_error (widget, err){
    var errMsg = 'ERROR on ' + widget.eventId + ': ' + err;
    console.error(errMsg);
    socket_log.emit('log', {widgetId : widget.eventId, error : errMsg}); // emit to logger
  }

  function bind_widget(io, li){
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

        var widget_js;
        try{
          eval('widget_js = ' + js);
          widget_js.eventId = eventId;
          widget_js = $.extend({}, defaultHandlers, widget_js);
          widget_js = $.extend({}, widgetMethods, widget_js);
          widget_js.onInit($widgetContainer[0]);
        }
        catch (e){
          log_error(widget_js, e);
        }

        io.on(eventId, function (data) { //bind socket.io event listener
          if (data.error){
            globalHandlers.onPreError.apply(widget_js, [$(li), data]);
          } else {
            globalHandlers.onPreData.apply(widget_js, [$(li)]);
          }

          var f = data.error ? widget_js.onError : widget_js.onData;
          var $container = data.error ? $errorContainer : $widgetContainer;
          try{
            f.apply(widget_js, [$container, data]);
          }
          catch (e){
            log_error(widget_js, e);
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
      widget_margins: [gridsterGutter, gridsterGutter],
      widget_base_dimensions: [widgetSize.w, widgetSize.h]
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
      bind_widget(io, li);
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

  var options = {
    'reconnect': true,
    'reconnection delay': 1000,
    'reopen delay': 3000,
    'max reconnection attempts': Infinity,
    'reconnection limit': 60000
  };

  //----------------------
  // widget socket
  //----------------------
  var socket_w = io.connect('/widgets', options);

  socket_w.on("connect", function() {

    console.log('connected');
    $('#main-container').removeClass("disconnected");

    bindSocket(socket_w, gridsterContainer);

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
  // log socket
  //----------------------
  var socket_log = io.connect('/log', options);
  socket_log.on("connect", function() {
    console.log('log socket connected');
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

var Widgets = {}; //support legacy widgets
