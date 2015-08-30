var assert = require('assert');
var atlasboard = require('../lib/atlasboard');

describe('atlasboard', function () {

  describe('start', function () {
    it('should start without errors', function (done) {
      atlasboard({port: 4000}, function (err) {
        assert.ifError(err);
        done();
      });
    });

    it('should throw error if port is not specified', function (done) {
      assert.throws(function () {
        atlasboard(null);
      });
      done();
    });

  });
});
