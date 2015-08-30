//-------------------------------
// Filesystem storage implementation
// TODO
//-------------------------------

var util = require('util');

function StorageRedis(options) {
  this.options = options || {};
}

util.inherits(StorageRedis, require('../storage-base'));

StorageRedis.prototype.get = function () {
  throw 'not implemented';
};

StorageRedis.prototype.set = function () {
  throw 'not implemented';
};

module.exports = StorageRedis;