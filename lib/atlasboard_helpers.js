var fs = require('fs');

module.exports = {
    get_first_existing_file : function get_first_existing_file() {
        if (!arguments){
            return null;
        }

        for (var i = arguments.length - 1; i >= 0; i--) {
            if (fs.existsSync(arguments[i])) {
                return arguments[i];
            }
        }
    },

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
    }
};