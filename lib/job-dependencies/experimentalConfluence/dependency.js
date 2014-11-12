// This dependency is experimental and not suitable for general consumption. The API available here is liable to change
// without notice.
module.exports = function (jobWorker, io, globalConfig){
  return {
    getPage: function(instance, pageId, cb) {
      var instanceConfig = jobWorker.config.globalAuth[instance];
      if (!instanceConfig) {
        throw new Error("Instance " + instance + " has no configuration in globalAuth");
      }

      var opts = {
        url: instanceConfig.url + "/rest/api/content/" + pageId,
        auth: {
          user: instanceConfig.username,
          pass: instanceConfig.password
        },
        qs: {
          expand: "body.view"
        }
      };

      jobWorker.dependencies.easyRequest.JSON(opts, function(err, body) {
        if (err) {
          return cb(err);
        }

        cb(null, {
          title: body.title,
          content: body.body.view.value
        });
      });
    }
  }
};
