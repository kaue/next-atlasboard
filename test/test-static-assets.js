var path = require('path');
var request = require('request');
var assert = require('assert');
var fs = require('fs');
var express = require('express');
var proxyquire = require('proxyquire');

describe('static assets', function () {
  var app;
  var port = 4444;
  var httpServer;

  before(function () {
    app = express();
    var server = proxyquire('../lib/webapp/server', {
      'path': {
        join: function () {
          if (arguments[1] === 'assets') {
            return path.join(process.cwd(), 'test', 'fixtures', 'assets');
          }
          return path.join.apply(null, arguments);
        }
      }
    });
    httpServer = server(app, {port: port});
  });

  after(function () {
    httpServer.close();
  });

  describe('images', function () {
    it('should return Atlasboard images', function (done) {
      request('http://localhost:' + port + '/images/red-up.png', function (err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        assert.ok(body);
        done();
      });
    });

    it('should not return non existent Atlasboard images', function (done) {
      request('http://localhost:' + port + '/images/red-upxxxxxx.png', function (err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 404);
        done();
      });
    });

    it('should return wallboard images', function (done) {
      request('http://localhost:' + port + '/images/green-down-wallboard-asset.png', function (err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        assert.ok(body);
        done();
      });
    });

    it('should return wallboard images over atlasboard ones if the name is the same', function (done) {
      request('http://localhost:' + port + '/images/red-up.png', function (err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        // this file is not a valid image. It contains just one character to be able to assert
        // that we are fetching the one in the wallboard folder and not the one in atlasboard.
        assert.equal(1, body.length);
        done();
      });
    });
  });

  describe('css and stylus', function () {
    it('should render and return stylus', function (done) {
      request('http://localhost:' + port + '/stylesheets/application.css', function (err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        assert.ok(body);
        done();
      });
    });

    it('should cache stylus output so the second request should be blazing fast', function (done) {
      this.timeout(50);
      request('http://localhost:' + port + '/stylesheets/application.css', function (err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        assert.ok(body);
        done();
      });
    });

    it('should render the output in compiled folder', function (done) {
      var compiledCSSPath = path.join(process.cwd(), '/test/fixtures/assets/compiled/stylesheets/application.css');
      fs.exists(compiledCSSPath, function (exist) {
        assert.ok(exist);
        fs.unlink(compiledCSSPath, function (err) {
          assert.ifError(err);
          done();
        })
      });
    });

  });
});
