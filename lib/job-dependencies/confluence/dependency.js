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
        },
        json: true,
      };

      jobWorker.dependencies.request.get(opts, function(err, response, body) {
        if (err) {
          return cb(err);
        }

        if (response.statusCode !== 200) {
          return cb(new Error(response.statuCode + " error fetching page"));
        }

        cb(null, {
          title: body.title,
          content: body.body.view.value
        });
      });
    }
  }
};
