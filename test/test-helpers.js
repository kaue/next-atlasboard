var assert = require('assert');
var path = require('path');
var helpers = require('../lib/helpers');

describe('helpers', function () {

  var INVALID_JSON_PATH = path.join(process.cwd(), 'test', 'fixtures', 'helpers', 'invalid-json.json');
  var VALID_JSON_PATH = path.join(process.cwd(), 'test', 'fixtures', 'helpers', 'valid-json.json');
  var FILE_NOT_EXIST_PATH = 'DOES-NOT-EXISTS.json';

  describe('isPathContainedInRoot', function () {
    it('should contain root', function () {
      assert.ok(helpers.isPathContainedInRoot("/test/wibble", "/test"));
      assert.ok(!helpers.isPathContainedInRoot("/root/test/wibble", "/test"));
    });

    it('should accept relative paths to the process', function () {
      assert.ok(helpers.isPathContainedInRoot("wibble", process.cwd()));
      assert.ok(!helpers.isPathContainedInRoot("/wibble", process.cwd()));
    });

    it('should handle non string types gracefully', function () {
      assert.ok(!helpers.isPathContainedInRoot("/test/wibble", 333));
    });

  });

  describe('areValidPathElements', function () {
    it('should sanitize string input', function () {
      assert.ok(helpers.areValidPathElements("wibble"));
      assert.ok(!helpers.areValidPathElements("../wibble"));
    });

    it('should sanitize arrays of string input', function () {
      assert.ok(helpers.areValidPathElements(["wibble", "other valid"]));
      assert.ok(!helpers.areValidPathElements(["../wibble", "valid"]));
      assert.ok(!helpers.areValidPathElements(["../wibble", "../invalid"]));
    });

    it('should sanitize number input', function () {
      assert.ok(helpers.areValidPathElements(4444));
    });

    //http://docs.nodejitsu.com/articles/file-system/security/introduction
    it('should return invalid path if poison null bytes found', function () {
      assert.ok(!helpers.areValidPathElements("input\0file"));
    });

    it('should return invalid path if .. found', function () {
      assert.ok(!helpers.areValidPathElements("input..file"));
    });

  });

  describe('getJSONFromFile', function () {
    it('should return default value if file not found', function () {
      var defaultValue = {};
      assert.equal(defaultValue, helpers.getJSONFromFile(FILE_NOT_EXIST_PATH, defaultValue));
      assert.equal("test", helpers.getJSONFromFile(FILE_NOT_EXIST_PATH, "test"));
    });

    it('should call callback if file not found', function (done) {
      helpers.getJSONFromFile(FILE_NOT_EXIST_PATH, {}, function (path) {
        assert.equal(FILE_NOT_EXIST_PATH, path);
        done();
      });
    });

    it('should return default value if file is not valid JSON', function () {
      var defaultValue = {};
      assert.equal(helpers.getJSONFromFile(INVALID_JSON_PATH, defaultValue), defaultValue);
      assert.equal(helpers.getJSONFromFile(INVALID_JSON_PATH, "test"), "test");
    });

    it('should call callback if file is not valid JSON', function (done) {
      helpers.getJSONFromFile(INVALID_JSON_PATH, {}, null, function (path) {
        assert.equal(INVALID_JSON_PATH, path);
        done();
      });
    });

    it('should return default value if file is not valid JSON', function () {
      var content = helpers.getJSONFromFile(VALID_JSON_PATH, {});
      assert.equal(content.key1, "val1");
    });

  });

  describe('readJSONFile', function () {
    it('should parse handle non existent paths', function (done) {
      helpers.readJSONFile(FILE_NOT_EXIST_PATH, function (err) {
        assert.equal(err.code, "ENOENT");
        done();
      });
    });

    it('should handle invalid JSON', function (done) {
      helpers.readJSONFile(INVALID_JSON_PATH, function (err) {
        assert.ok(err);
        done();
      });
    });

    it('should parse JSON property', function (done) {
      helpers.readJSONFile(VALID_JSON_PATH, function (err, content) {
        assert.ifError(err);
        assert.equal("val1", content.key1);
        done();
      });
    });

  });

});