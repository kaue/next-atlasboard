var assert = require('assert');
var proxyquire = require('proxyquire');
var sinon = require('sinon');

describe('logger', function () {

  function getLogger(configuration, jobMock, ioMock) {
    var loggerFactory = proxyquire('../lib/logger', {
      './config-manager': function () {
        return configuration || {}
      }
    });
    return loggerFactory(jobMock, ioMock);
  }

  it('should contain all required method', function () {
    var logger = getLogger();
    assert.equal('function', typeof logger.log);
    assert.equal('function', typeof logger.trace);
    assert.equal('function', typeof logger.debug);
    assert.equal('function', typeof logger.info);
    assert.equal('function', typeof logger.warn);
    assert.equal('function', typeof logger.error);
  });

  describe('io dependency', function () {
    var jobMock = {};
    var ioMock = {};

    it('should should emit to io sink', function (done) {
      ioMock = {
        emit: function () {
          done();
        }
      };

      var logger = getLogger({}, jobMock, ioMock);
      logger.error('hola');
    });
  });

  describe('read custom configuration', function () {
    afterEach(function () {
      if (typeof console.log.restore === 'function') {
        console.log.restore();
      }
    });

    it('should log trace statements if level is 1', function () {
      sinon.stub(console, 'log');
      var logger = getLogger({logger: {level: 1}});
      logger.trace('test');
      assert.ok(console.log.called);
    });

    it('should not log trace statements if level is 4', function () {
      sinon.stub(console, 'log');
      logger = getLogger({logger: {level: 4}});
      logger.trace('test');
      assert.ok(!console.log.called);
    });
  });
});