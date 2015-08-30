/**

easyRequest

- Provides a layer of abstraction to easily query HTTP endpoints.
- It does all the error handling (bad response, authentication failed, bad json response, etc).
*/

module.exports = function (){
  var request = require('request');

  function queryRequest (options, callback) {
    request(options, function(err, response, body){
      if (err || !response || response.statusCode != 200) {
        var errMsg = (err || (response ? ("bad statusCode: " + response.statusCode) : "bad response")) + " from " + options.url;
        callback(errMsg);
      }
      else {
        callback(null, body);
      }
    });
  }
  
  return {

    /**
      Provides an abstraction over request to query HTTP endpoints
      expecting the response in JSON format.
    */
    JSON: function(options, callback){
      queryRequest(options, function (err, body){
        if (err) {
          return callback(err);
        }

        var jsonBody;
        try {
          jsonBody = JSON.parse(body);
        }
        catch (e) {
          return callback('invalid json response');
        }
        callback(null, jsonBody);
      });
    },

    /**
      Provides an abstraction over request to query HTTP endpoints
      expecting the response in plain text or HTML format.
    */
    HTML: function(options, callback){
      queryRequest(options, function (err, body){
        if (err) {
          return callback(err);
        }
        callback(null, body);
      });
    }

  };
};