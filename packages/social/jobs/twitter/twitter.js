module.exports = function(config, dependencies, job_callback) {
  var logger = dependencies.logger;

  if (!config.search){
    return job_callback('no search parameter found');
  }

  var options = {
    url: 'http://search.twitter.com/search.json?q=' + encodeURIComponent(config.search),
    json: true
  };

  dependencies.request(options, function(err, response, JSONbody) {
    if (err || !response || response.statusCode != 200) {
      var err_msg = err || (response ? ("bad statusCode: " + response.statusCode + " from " + options.url) : ("bad response from " + options.url));
      logger.error(err_msg);
      job_callback(err_msg);
    } else {
      job_callback(null, {feed: JSONbody.results, title: config.widgetTitle});
    }
  });
};