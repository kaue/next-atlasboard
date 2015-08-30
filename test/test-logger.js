var assert = require('assert');
var loggerFactory = require('../lib/logger');

describe('logger', function () {

  var logger = require('../lib/logger')();

  it('should contain all required method', function () {
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

      logger = loggerFactory(jobMock, ioMock);
      logger.error('hola');
    });
  });
});