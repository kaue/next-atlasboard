var assert = require ('assert');
var atlasboard = require ('../lib/atlasboard');

describe ('atlasboard', function(){
  describe ('start', function(){
    it('should start without errors', function(done){
      atlasboard(4000);
      done();
    });

    it('should throw error if port is not specified', function(done){
      //http://www.adaltas.com/blog/2013/03/27/test-uncaughtException-error-mocha/
      var list = process.listeners ('uncaughtException');
      process.removeAllListeners('uncaughtException');
      process.on('uncaughtException', function (error) {
        process.removeAllListeners('uncaughtException');
        for (var i = list.length - 1; i >= 0; i--) {
          process.on('uncaughtException', list[i]);
        }
        done();
      });
      atlasboard();
    });

  });
});
