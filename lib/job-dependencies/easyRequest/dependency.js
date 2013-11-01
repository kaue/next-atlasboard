
/**

easyRequest

- Provides a layer of abstraction to easily query HTTP endpoints.
- It does all the error handling (bad response, authentication failed, bad json response, etc).
*/

module.exports = function (jobWorker, io, globalConfig){
  var request = require('request');
  
  return {

    /**
      Provides an abstraction over request to query HTTP endpoints
      expecting the response in JSON format.
    */
    JSON: function(options, callback){
      
      request(options, function(err, response, body){
        if (err || !response || response.statusCode != 200) {
          var error_msg = (err || (response ? ("bad statusCode: " + response.statusCode) : "bad response")) + " from " + options.url;
          return callback(error_msg);
        }
        else {
          var jsonBody;
          try {
            jsonBody = JSON.parse(body);
          }
          catch (e) {
            return callback('invalid json response');
          }
        }
        callback(null, jsonBody);
      });
    }
  };
};