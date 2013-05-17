var assert = require ('assert'),
    path = require ('path'),
    rm = require ('rimraf'),
    fs = require ('fs');

describe ('fs-storage', function(){
  var temp_folder = path.join(process.cwd(), "test/tmp");
  var storagePath = path.join(temp_folder, "tmp-storage.json");

  //make sure temp folder is deleted even if tests fail (before and after)
  beforeEach(function(done){
    rm(temp_folder, done);
  });

  afterEach(function(done){
    rm(temp_folder, done);
  });

  it('should set value to storage', function(done){
    var key = 'jobkey1';
    var fsStorageClass = require ('../lib/job-dependencies/storage/implementations/fs-storage');
    var fsStorage = new fsStorageClass(key, {storagePath : storagePath});
    fs.mkdir(temp_folder, function (err, data){
      fsStorage.set('key1', { foo: 'bar'}, function(error, data){
        assert.ifError(error);
        fsStorage.get('key1', function(err, data){
          assert.ifError(error);
          assert.equal(data.foo, 'bar');
          done();
        });
      });
    });
  });

  it('should not interfere with other jobs (isolated storage)', function(done){
    var key1 = 'jobkey1';
    var key2 = 'jobkey2';
    var fsStorageClass = require ('../lib/job-dependencies/storage/implementations/fs-storage');

    var fsStorage1 = new fsStorageClass(key1, {storagePath : storagePath});
    var fsStorage2 = new fsStorageClass(key2, {storagePath : storagePath});

    fs.mkdir(temp_folder, function (err, data){
      fsStorage1.set('key1', { foo: 'bar'}, function(error, data){
        assert.ifError(error);
        fsStorage2.set('key1', { foo: 'foo'}, function(error, data){
          fsStorage1.get('key1', function(err, data){
            assert.ifError(error);
            assert.equal(data.foo, 'bar');
            fsStorage2.get('key1', function(err, data){
              assert.equal(data.foo, 'foo');
              done();
            });
          });
        });
      });
    });
  });

});