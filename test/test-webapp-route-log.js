var path = require('path');
var request = require('request');
var assert = require('assert');
var fs = require('fs');
var express = require('express');
var proxyquire = require('proxyquire');

describe('logging route', function () {
  var app;
  var port = 4444;
  var server;

  var uri = 'http://localhost:' + port + '/log';

  afterEach(function () {
    server.close();
  });

  function createServerWithLoggingSettings(enabled, cb) {
    var routes = proxyquire('../lib/webapp/routes', {
      '../config-manager': function () {
        return {
          liveLoggingWebAccess: enabled
        }
      }
    });
    app = express();
    routes(app, null, null, {});
    server = app.listen(port, cb);
  }

  it('should return error message', function (done) {
    createServerWithLoggingSettings(false, function () {
      request(uri, function (err, response, body) {
        assert.ifError(err);
        assert.equal(403, response.statusCode);
        assert.ok(body.indexOf('Live logging it disabled') > -1);
        done();
      });
    });
  });

  it('should render log the proper template', function (done) {
    createServerWithLoggingSettings(true, function () {
      request(uri, function (err, response, body) {
        assert.ifError(err);
        assert.equal(200, response.statusCode);
        assert.ok(body.indexOf('use regex for dynamic filtering') > -1);
        done();
      });
    });
  });

});
