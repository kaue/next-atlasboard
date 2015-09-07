var assert = require('assert');
var path = require('path');
var proxyquire = require('proxyquire');

describe('global auth', function () {

  var loggerMock, globalAuthLoader;

  function getGlobalAuthLoader(loggerMockOptions) {
    loggerMock = function () {
      return loggerMockOptions
    };
    return proxyquire('../lib/global-auth', {
      './logger': loggerMock
    });
  }

  it('should handle missing files gracefully', function (done) {
    globalAuthLoader = getGlobalAuthLoader({
      warn: function (msg) {
        assert.equal(msg.indexOf('Authentication file not found'), 0);
        done();
      }
    });
    var globalAuth = globalAuthLoader('/i/dont/exist');
    assert.ok(Object.keys(globalAuth).length === 0);
  });

  it('should handle invalid configuration file', function (done) {
    globalAuthLoader = getGlobalAuthLoader({
      error: function (msg) {
        assert.ok(msg.indexOf('It may contain invalid json format') > 0);
        done();
      }
    });
    var globalAuth = globalAuthLoader(path.join('test', 'fixtures', 'global-auth', 'invalid-json.json'));
    assert.ok(Object.keys(globalAuth).length === 0);
  });

  it('should expand environment variables in values correctly', function () {
    globalAuthLoader = getGlobalAuthLoader({
      warn: function () {
        assert.fail("warn logging was not expected");
      },
      error: function () {
        assert.fail("error logging was not expected");
      }
    });
    process.env.TEST_USER = "testuser";
    process.env.TEST_PASSWORD = "testpass";
    var globalAuth = globalAuthLoader("test/fixtures/global-auth/valid-with-env.json");
    assert.equal(globalAuth.foo.username, "testuser");
    assert.equal(globalAuth.foo.password, "before_testpass_after");
  });

  it('should warn if env variable not found', function (done) {
    globalAuthLoader = getGlobalAuthLoader({
      warn: function (msg) {
        assert.equal(msg.indexOf('Authentication file referenced var ${MISSING_VAR}'), 0);
        done();
      },
      error: function () {
        assert.fail("error logging was not expected");
      }
    });
    process.env.TEST_PASSWORD = "testpass";
    var globalAuth = globalAuthLoader("test/fixtures/global-auth/valid-with-missing-var.json");
    assert.equal(globalAuth.foo.password, "before_testpass_after");
  });
});