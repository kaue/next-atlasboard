var assert = require ('assert');
var loadGlobalAuth = require ('../lib/global-auth');

describe ('global auth', function() {
  it('handles missing files gracefully', function() {
    var globalAuth = loadGlobalAuth('/i/dont/exist');
    assert.ok(Object.keys(globalAuth).length === 0);
  });

  it('expands environment variables in values correctly', function() {
    process.env.TEST_USER = "testuser";
    process.env.TEST_PASSWORD = "testpass";
    var globalAuth = loadGlobalAuth("test/fixtures/global-auth/valid-with-env.json");
    assert.equal(globalAuth.foo.username, "testuser");
    assert.equal(globalAuth.foo.password, "before_testpass_after");
  });
});