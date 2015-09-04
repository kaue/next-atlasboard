var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var eslint = require('gulp-eslint');
var watch = require('gulp-watch');
var bowerFiles = require('bower-files')({
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

var appFiles = ['assets/javascripts/application.js', 'assets/javascripts/plugins/*.js'];

var watch = function () {
  gulp.watch(appFiles, ['build-client-js']);
};

var buildApplicationJS = function () {
  return gulp.src(appFiles)
      .pipe(plugins.filter('*.js'))
      .pipe(plugins.uglify())
      .pipe(plugins.concat('app.js'))
      .pipe(gulp.dest('assets/build'));
};

var buildBowerJS = function () {
  return gulp.src(bowerFiles.ext('js').files)
      .pipe(plugins.filter('*.js'))
      .pipe(plugins.uglify())
      .pipe(plugins.concat('vendor.js'))
      .pipe(gulp.dest('assets/build'));
};

var lintJS = function () {
  return gulp.src([
    'lib/**/*.js',
    'assets/javascripts/*.js'
  ])
      .pipe(eslint({
        'rules': {
          'no-alert': 0,
          'no-bitwise': 0,
          'camelcase': 1,
          'curly': 1,
          'eqeqeq': 0,
          'no-eq-null': 0,
          'guard-for-in': 1,
          'no-empty': 1,
          'no-use-before-define': 0,
          'no-obj-calls': 2,
          'no-unused-vars': 0,
          'new-cap': 1,
          'no-shadow': 0,
          'strict': 0,
          'no-invalid-regexp': 2,
          'comma-dangle': 2,
          'no-undef': 1,
          'no-new': 1,
          'no-extra-semi': 1,
          'no-debugger': 2,
          'no-caller': 1,
          'semi': 1,
          'quotes': 0,
          'no-unreachable': 2
        },
        'globals': {
          '$': false
        },
        'env': {
          'node': true
        }
      }))
      .pipe(eslint.format())
      .pipe(eslint.failOnError());
};

gulp.task('bower-js', buildBowerJS);
gulp.task('build-client-js', buildApplicationJS);
gulp.task('lint', lintJS);

gulp.task('watch', watch);
gulp.task('default', ['lint', 'build-client-js']);