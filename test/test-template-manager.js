var assert = require ('assert');
var path = require ('path');
var templateManager = require('../lib/template-manager');

describe ('template manager', function(){

  it('should resolve global location of template', function(done) {
    templateManager.resolveTemplateLocation("dashboard.ejs", function(err, location){
      assert.equal(path.join(__dirname, "../templates", "dashboard.ejs"), location);
      done();
    });
  });

});