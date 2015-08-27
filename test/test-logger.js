var assert = require('assert');

describe('logger', function () {

  var logger = require('../lib/logger')();

  it('should contain a log method', function (done) {
    assert.equal('function', typeof logger.log);
    done();
  });

  it('should contain a trace method', function (done) {
    assert.equal('function', typeof logger.trace);
    done();
  });

  it('should contain a debug method', function (done) {
    assert.equal('function', typeof logger.debug);
    done();
  });

  it('should contain an info method', function (done) {
    assert.equal('function', typeof logger.info);
    done();
  });

  it('should contain a warn method', function (done) {
    assert.equal('function', typeof logger.warn);
    done();
  });

  it('should contain an error method', function (done) {
    assert.equal('function', typeof logger.error);
    done();
  });

  describe('io dependency', function () {
    var jobMock = {};
    var ioMock = {};

    it.only('should should emit to io sink', function (done) {
      ioMock = {
        emit: function () {
          done();
        }
      };

      logger = require('../lib/logger')(jobMock, ioMock);
      logger.error('hola');
    });
  });
});