var path = require('path');

function getFromRootPath(root, args){
  Array.prototype.splice.call(args, 0, 0, root);
  return path.join.apply(null, args);
}

module.exports = {
  fromAtlasboard: function () {
    return getFromRootPath(__dirname, arguments);
  },

  fromLocalWallboard: function () {
    return getFromRootPath(process.cwd(), arguments);
  }
};