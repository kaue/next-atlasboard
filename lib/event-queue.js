var _ = require("underscore");

module.exports = function(io) {
  var eventQueue = {
    // Save the last of every event so we can send them to new clients
    latestEvents: {},

    initialize: function(io) {
      var that = this;
      io.of("/widgets").on("connection", function(socket) {
        socket.on("resend", function (data) {
          if (that.latestEvents[data]) {
            socket.emit(data, that.latestEvents[data]);
          }
        });
      });
    },

    send: function(id, body) {
      this.latestEvents[id] = body;
      io.of("/widgets").emit(id, body);
    }
  };
  eventQueue.initialize(io);
  return eventQueue;
};