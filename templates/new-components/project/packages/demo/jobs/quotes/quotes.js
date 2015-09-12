var _ = require('underscore');

module.exports = {
  onRun: function (config, dependencies, jobCallback) {
    var quotes = _.first(_.shuffle(config.quotes), config.limit || 10);
    jobCallback(null, {quotes: quotes, title: config.widgetTitle});
  }
};