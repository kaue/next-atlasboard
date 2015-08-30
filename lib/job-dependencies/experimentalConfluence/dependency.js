// This dependency is experimental and not suitable for general consumption. The API available here is liable to change
// without notice.
module.exports = function (jobWorker){
  function addAuthConfig(auth, opts) {
    var authData = jobWorker.config.globalAuth[auth];
    if (authData && authData.username && authData.password) {
      opts.auth = {
        user: authData.username,
        pass: authData.password
      };
    }
  }

  return {
    getPageById: function(baseUrl, auth, pageId, cb) {
      var opts = {
        url: baseUrl + "/rest/api/content/" + pageId,
        qs: {
          expand: "body.view"
        }
      };
      addAuthConfig(auth, opts);

      jobWorker.dependencies.easyRequest.JSON(opts, function(err, body) {
        if (err) {
          return cb(err);
        }

        cb(null, {
          title: body.title,
          content: body.body.view.value
        });
      });
    },
    // Retrieves page data for the first result that matches given CQL query.
    getPageByCQL: function(baseUrl, auth, query, cb) {
      var opts = {
        url: baseUrl + "/rest/experimental/content",
        qs: {
          expand: "body.view",
          limit: 1,
          cql: query
        }
      };
      addAuthConfig(auth, opts);

      jobWorker.dependencies.easyRequest.JSON(opts, function(err, body) {
        if (err) {
          return cb(err);
        }

        if (body.results.length === 0) {
          return cb(null, new Error("No page matching query " + query));
        }

        var result = body.results[0];
        cb(null, {
          title: result.title,
          content: result.body.view.value,
          webLink: result._links.webui
        });
      });
    }
  };
};
