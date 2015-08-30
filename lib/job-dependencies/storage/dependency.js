module.exports = function (jobWorker){
  var fsStorageClass = require('./implementations/fs-storage.js');
  return new fsStorageClass(jobWorker.id, {});
};