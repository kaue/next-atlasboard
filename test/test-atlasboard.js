var assert = require ('assert');
var atlasboard = require ('../lib/atlasboard');

describe ('atlasboard', function(){
  describe ('start', function(){
    it('should start without errors', function(done){
      atlasboard();
      done();
    });
  });
});
