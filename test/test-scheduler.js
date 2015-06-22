var assert = require ('assert'),
    sinon = require ('sinon'),
    Scheduler = require('../lib/scheduler');

describe ('scheduler', function(){

  var widgets;
  var scheduler;
  var stub;
  var clock;
  var mockJobWorker;

  beforeEach(function(done){
    clock = sinon.useFakeTimers();
    widgets = {sendData: function(){}};
    mockJobWorker = {
      widget_item: { job: 'dummy' },
      config:{interval: 3000},
      task : function(){},
      dependencies : {
        logger : {
          warn: function (){},
          error: function (){},
          log: function (){}
        }
      }
    };

    stub = sinon.stub(mockJobWorker, "task", function(config, dependencies, cb) {
      cb(null, {});
    });
    done();
  });

  afterEach(function(done){
    stub.restore();
    clock.restore();
    done();
  });

  it('should execute the job when "start" is executed', function(done){
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    mockJobWorker.task = function (){
      done();
    };
    scheduler.start(mockJobWorker, widgets);
  });

  it('should schedule a job to be executed in the future in intervals of time', function(done){
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    clock.tick(3000);
    clock.tick(3000);
    assert.ok(stub.calledThrice);
    done();
  });

  it('should set 1 sec as the minimum interval period', function(done){
    mockJobWorker.config.interval = 10; // really low interval (ms)
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    clock.tick(1000);
    clock.tick(1000);
    assert.ok(stub.calledThrice);
    done();
  });

  it('should set 60 sec if interval is not provided', function(done){
    mockJobWorker.config.interval = null;
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    clock.tick(60000);
    clock.tick(60000);
    assert.ok(stub.calledThrice);
    done();
  });

  it('should allow job workers to maintain state across calls', function(done){
    mockJobWorker.task = function (config, dependencies, cb){
      this.counter = (this.counter || 0) + 1;
      cb(null, {});
    };
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    clock.tick(3000);
    clock.tick(3000);
    assert.equal(3, mockJobWorker.counter);
    done();
  });

  it('should schedule when received an empty data parameter', function(done){
    mockJobWorker.task = function (config, dependencies, cb){
      cb(null);
    };
    widgets.sendData = function(){
      done();
    };
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
  });

  it('should handle and log asynchronous errors', function(done){
    mockJobWorker.task = function (config, dependencies, cb){
      cb('error');
    };
    mockJobWorker.dependencies.logger.error = function(error){
      assert.ok(error);
      done();
    };
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
  });

  it('should notify client on asynchronous errors', function(done){
    mockJobWorker.task = function (config, dependencies, cb){
      cb('error');
    };
    widgets.sendData = function(data){
      assert.ok(data.error);
      done();
    };
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
  });

  it('should allow a grace period to raise errors if retryOnErrorTimes is defined', function(done){
    mockJobWorker.config.retryOnErrorTimes = 3;
    var numberJobExecutions = 0;
    var numberCallsSendDataWithErrors = 0;
    var numberCallsSendDataWithSuccess = 0;

    widgets.sendData = function (data) {
      if (data.error) {
        numberCallsSendDataWithErrors++;
      } else {
        numberCallsSendDataWithSuccess++;
      }
    };

    mockJobWorker.task = function (config, dependencies, cb){
      if (numberJobExecutions === 0) {
        cb();
      }
      else {
        cb('err');
      }
      numberJobExecutions++;
    };

    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    clock.tick(3000);
    clock.tick(3000/3);
    clock.tick(3000/3);
    assert.equal(4, numberJobExecutions);
    assert.equal(1, numberCallsSendDataWithErrors);
    done();
  });

  it('should handle synchronous errors in job execution', function(done){
    mockJobWorker.task = sinon.stub().throws('err');
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    assert.ok(mockJobWorker.task.calledOnce);
    done();
  });

  it('should notify client when synchronous error occurred during job execution', function(done){
    mockJobWorker.task = sinon.stub().throws('err');
    widgets.sendData = function(data){
      assert.ok(data.error);
      done();
    };
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    assert.ok(mockJobWorker.task.calledOnce);
  });

  it('should notify client on first synchronous error during job execution even when retryAttempts are configured', function(done){
    mockJobWorker.task = sinon.stub().throws('err');
    mockJobWorker.config.retryOnErrorTimes = 3;
    widgets.sendData = function(data){
      assert.ok(data.error);
      done();
    };
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    assert.ok(mockJobWorker.task.calledOnce);
  });

  it('should schedule task even if there was a synchronous error', function (done) {
    mockJobWorker.task = sinon.stub().throws('err');

    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    clock.tick(3000);
    // we expect the initial call plus one call every second (one third of the original interval in recovery mode)
    assert.equal(4, mockJobWorker.task.callCount);
    done();
  });

  it('should not schedule more than one job when job execution takes long time', function(done) {
    mockJobWorker.task = function() {};
    var stub = sinon.stub(mockJobWorker, "task", function (config, dependencies, cb) {
      setTimeout(function() {
        cb(null, {});
      }, 10000);
    });
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
    clock.tick(13000);
    clock.tick(13000);
    assert.ok(stub.calledThrice);
    done();
  });

  it('should warn if multiple job callbacks are executed', function(done) {
    mockJobWorker.task = function(config, dependencies, job_callback){
      job_callback(null, {});
      job_callback(null, {});
    };
    mockJobWorker.dependencies.logger.warn = function (msg) {
      assert.ok(msg.indexOf('job_callback executed more than once') > -1);
      done();
    };
    scheduler = new Scheduler(mockJobWorker, widgets, {});
    scheduler.start(mockJobWorker, widgets);
  });

});
