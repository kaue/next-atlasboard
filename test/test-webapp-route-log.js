var path = require('path'),
    request = require('request'),
    assert = require('assert'),
    fs = require('fs'),
    web_routes = require ('../lib/webapp/routes.js');

describe ('logging route', function(){
  var app;
  var port = 4444;
  var server;

  afterEach(function(){
    server.close();
  });

  function createServer(configFile) {
    app = require('express')();
    var configPath = path.join(process.cwd(), 'test', 'fixtures', 'config', configFile);
    var config = require('../lib/config-manager')(configPath);
    web_routes(app, null, null, config);
    server = app.listen(port);
  }

  describe ('disabled', function(){
    beforeEach(function(){
      createServer('log-disabled.json');
    });

    it('should return error message', function(done){
      request('http://localhost:' + port + '/log', function(err, response, body){
        assert.ok(!err);
        assert.equal(200, response.statusCode);
        assert.ok(body.indexOf('live logging it disabled')>-1);
        done();
      });
    });
  });

  describe ('enabled', function(){
    beforeEach(function(){
      createServer('log-enabled.json');
    });

    it('should render log the proper template', function(done){
      request('http://localhost:' + port + '/log', function(err, response, body){
        assert.ok(!err);
        assert.equal(200, response.statusCode);
        console.log( body)
        assert.ok(body.indexOf('use regex for dynamic filtering')>-1);
        done();
      });
    });
  });

});
