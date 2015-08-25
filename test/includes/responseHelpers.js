var assert = require ('assert');

exports = module.exports = (function(){

  function getResponseForSendFile (expectedFileContains, done){
    var res = {
      type: function (data){
        assert.equal("application/javascript", data);
      },

      sendfile: function (file){
        assert.ok(file.indexOf(expectedFileContains)>-1);
        done();
      },

      write: function (data){
        done("not expected");
      },

      end: function (data){
        done("not expected");
      }
    };

    return res;
  }

  function getResponseForSendStatusCode (statusCode, done){
    var res = {
      type: function (data){

      },

      sendfile: function (){
        done('not expected call to res.sendfile');
      },

      write: function (){
        done("not expected call to res.write");
      },

      end: function (){
        done("not expected call to res.end");
      },

      status: function (code) {
        assert.equal(statusCode, code);
        return this;
      },

      send: function (){
        done();
      }
    };
    return res;
  }

  function getResponseWriteEnd (contains, mime, done){
    var bundle_file = "";
    var res = {
      type: function (data){
        if (mime){
          assert.equal(mime, data);
        }
      },

      sendfile: function (file){
        done("not expected");
      },

      write: function (data){
        bundle_file+=data;
      },

      end: function (data){
        if (contains){
          if (!Array.isArray(contains)){
            contains = [contains];
          }
          contains.forEach(function(match){
            console.log(bundle_file)
            assert.ok(bundle_file.indexOf(match) > -1);
          });
        }
        done();
      }
    };
    return res;
  }

  function getResponseWriteBasic() {
    var res = {
      written: '',
      write: function (data) {
        res.written += data;
      }
    };
    return res;
  }

  return {
    getResponseForSendFile:getResponseForSendFile,
    getResponseForSendStatusCode: getResponseForSendStatusCode,
    getResponseWriteEnd: getResponseWriteEnd,
    getResponseWriteBasic: getResponseWriteBasic
  }

})();