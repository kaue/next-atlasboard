/**

easyRequest

- Provides a layer of abstraction to easily query HTTP endpoints.
- It does all the error handling (bad response, authentication failed, bad json response, etc).
*/

module.exports = function (){
  var request = require('request');

  function queryRequest (options, callback) {
    request(options, function(err, response, body){
      var errMsg = null;
      if (err || !response || response.statusCode != 200) {
        errMsg = (err || (response ? ("bad statusCode: " + response.statusCode) : "bad response")) + " from " + options.url;
      }
      callback(errMsg, body, response);
    });
  }
  
  return {

    /**
      Provides an abstraction over request to query HTTP endpoints
      expecting the response in JSON format.
    */

    JSON: function(options, callback){
      queryRequest(options, function (err, body, response){
        var jsonBody;
        try {
          jsonBody = JSON.parse(body);
        }
        catch (e) {
          if (!err) {
            err = 'invalid json response';
          }
        }
        callback(err, jsonBody, response);
      });
    },

    /**
      Provides an abstraction over request to query HTTP endpoints
      expecting the response in plain text or HTML format.
    */

    HTML: queryRequest
  };
};