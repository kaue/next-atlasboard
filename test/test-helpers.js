var assert = require ('assert'),
    helpers = require ('../lib/helpers'),
    path = require ('path');

describe ('helpers', function(){

  describe('sanitizePath', function(){
    it('should sanitize string input', function(done){
      assert.ok("wibble", helpers.sanitizePath("wibble"));
      assert.ok("wibble", helpers.sanitizePath("../wibble"));
      done();
    });

    it('should sanitize number input', function(done){
      assert.ok("wibble", helpers.sanitizePath(4444));
      done();
    });
  });

  describe('getJSONFromFile', function(){
    it('should return default value if file not found', function(done){
      var defaultValue = {};
      var filePath = 'invalid_path.txt';
      assert.equal(defaultValue, helpers.getJSONFromFile(filePath, defaultValue));
      assert.equal("test", helpers.getJSONFromFile(filePath, "test"));
      done();
    });

    it('should return default value if file is not valid JSON', function(done){
      var defaultValue = {};
      var filePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'invalid_config.json');
      assert.equal(defaultValue, helpers.getJSONFromFile(filePath, defaultValue));
      assert.equal("test", helpers.getJSONFromFile(filePath, "test"));
      done();
    });

    it('should return default value if file is not valid JSON', function(done){
      var filePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'valid_config.json');
      var content = helpers.getJSONFromFile(filePath, {});
      assert.equal("val1", content.key1);
      done();
    });

  });

});