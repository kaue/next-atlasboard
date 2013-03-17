var fs = require('fs');

module.exports = {
  sanitizePath : function(path) {
    if (!path) return;
    var pathArray = path.split("/");
    path = pathArray.pop();
    if (!path || path == "..") {
      console.log("Malicious path detected: %s", path);
      console.log("Renaming to newitem");
      path = "newitem";
    }

    return path.toLowerCase();
  },

  getRndInt: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};