/**
 * Event Queue
 *
 * @param io
 * @constructor
 */

function EventQueue(io) {
  this.io = io;
  this.latestEvents = {};
  var self = this;

  io.on("connection", function (socket) {
    socket.on("resend", function (data) {
      if (self.latestEvents[data]) {
        socket.emit(data, self.latestEvents[data]);
      }
    });

    // broadcast logs
    socket.on("log", function (data) {
      socket.broadcast.emit('client', data);
    });
  });
}

exports = module.exports = EventQueue;

/**
 * Send widget data to clients
 * @param id
 * @param data
 */

EventQueue.prototype.send = function (id, data) {
  this.latestEvents[id] = data;
  this.io.emit(id, data); // emit to widget
  this.io.emit('client', {widgetId: id, data: data}); // emit to logger
};