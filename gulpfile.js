var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var bower_files = require('bower-files')({
  overrides: {
    gridster: {
      main: './dist/jquery.gridster.with-extras.js',
      dependencies: {}
    },
    rickshaw: {
      main: './dist/rickshaw.js',
      dependencies: {}
    }
  }
});

gulp.task('bower-js', function() {
  return gulp.src(bower_files.ext('js').files)
      .pipe(plugins.filter('*.js'))
      .pipe(plugins.uglify())
      .pipe(plugins.concat('vendor.js'))
      .pipe(gulp.dest('assets/build'));
});
