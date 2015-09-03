var assert = require('assert');
var path = require('path');
var fs = require('fs');
var widgetRouteLogic = require('../lib/webapp/routes/widget');
var responseHelpers = require('./includes/responseHelpers');

var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/package_widget_stylus_support");
var packagesAtlasboardFolder = path.join(process.cwd(), "/packages");

describe('widget', function () {

  it('should return html and css', function (done) {
    widgetRouteLogic.renderHtmlWidget([packagesLocalFolder, packagesAtlasboardFolder], "blockers",
        {}, responseHelpers.getResponseWriteEnd(["body", "<style>", "font-family: Comics Sans;"], "text/html", done));
  });

  it('should return html and stylus', function (done) {
    widgetRouteLogic.renderHtmlWidget([packagesLocalFolder, packagesAtlasboardFolder], "blockers_only_stylus",
        {}, responseHelpers.getResponseWriteEnd(["body", "<style>", "font-family: Arial"], "text/html", done));
  });

  it('should return html, stylus and css', function (done) {
    widgetRouteLogic.renderHtmlWidget([packagesLocalFolder, packagesAtlasboardFolder], "blockers_both_css_and_stylus",
        {}, responseHelpers.getResponseWriteEnd(["body", "<style>", "font-family: Arial", "font-family: Comics Sans"], "text/html", done));
  });

  it('should ignore path prefix - prevent path traversal issues', function (done) {
    widgetRouteLogic.renderHtmlWidget([packagesLocalFolder, packagesAtlasboardFolder], "../../blockers",
        {}, responseHelpers.getResponseWriteEnd(["body", "<style>"], "text/html", done));
  });

  it('should return error if widget not found', function (done) {
    widgetRouteLogic.renderHtmlWidget([packagesLocalFolder, packagesAtlasboardFolder], "bbblockers",
        {}, responseHelpers.getResponseForSendStatusCode(500, done));
  });
});

describe('widget resources', function () {

  var localPackagesPath = path.join(process.cwd(), 'test', 'fixtures', 'packages');

  it('should return 400 if resource input is undefined', function (done) {
    widgetRouteLogic.renderWidgetResource(localPackagesPath, undefined,
        {}, responseHelpers.getResponseForSendStatusCode(400, done));
  });

  it('should return 400 if resource input is empty', function (done) {
    widgetRouteLogic.renderWidgetResource(localPackagesPath, '/',
        {}, responseHelpers.getResponseForSendStatusCode(400, done));
  });

  it('should return 400 if resource contains more than 3 separators', function (done) {
    widgetRouteLogic.renderWidgetResource(localPackagesPath, 'package/widget/other/resource',
        {}, responseHelpers.getResponseForSendStatusCode(400, done));
  });

  it('should return 400 if resource contains less than 3 separators', function (done) {
    widgetRouteLogic.renderWidgetResource(localPackagesPath, 'package/resource',
        {}, responseHelpers.getResponseForSendStatusCode(400, done));
  });

  it('should return resource if path is correct', function (done) {
    widgetRouteLogic.renderWidgetResource(localPackagesPath, 'otherpackage1/blockers/resource.txt',
        {}, responseHelpers.getResponseForSendFile('resource.txt', done));
  });

  it('return javascript assets for a certain widget', function (done) {
    widgetRouteLogic.renderJsWidget([packagesLocalFolder, packagesAtlasboardFolder], "blockers", {},
        responseHelpers.getResponseForSendFile("widgets/blockers/blockers.js", done));
  });

  it('ignore path prefix - prevent path traversal issues', function (done) {
    widgetRouteLogic.renderJsWidget([packagesLocalFolder, packagesAtlasboardFolder], "../../blockers", {},
        responseHelpers.getResponseForSendFile("widgets/blockers/blockers.js", done));
  });
});

describe('css namespacing', function () {

  var localCssPath = path.join(process.cwd(), 'test', 'fixtures', 'css');

  function getCss(filename) {
    return fs.readFileSync(path.join(localCssPath, filename));
  }

  function assertContains(source, match, msg) {
    return assert.ok(source.indexOf(match) > -1, msg);
  }

  function assertNotContains(source, match, msg) {
    return assert.ok(source.indexOf(match) === -1, msg);
  }

  it('should namespace CSS selectors', function () {
    var res = responseHelpers.getResponseWriteBasic();
    var css = getCss('basic.css');
    widgetRouteLogic._addNamespace(css, res, 'test-namespace');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] #id {', '#id');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] tag {', 'tag');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] #multiple .things {', 'multiple identifiers');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] .comma,', 'comma-separated rules (1)');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] .separated {', 'comma-separated rules (2)');
  });

  it('should handle basic media queries', function () {
    var res = responseHelpers.getResponseWriteBasic();
    var css = getCss('media.css');
    widgetRouteLogic._addNamespace(css, res, 'test-namespace');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] .normal {', 'outside the media query');
    assertContains(res.written, '@media print {', 'media query definition is unchanged');
    assertNotContains(res.written, 'li[data-widget-id="test-namespace"] @media print {', 'media query definition is not namespaced');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] .simple {', 'inside the media query');
  });

  it('should handle complex media queries', function () {
    var res = responseHelpers.getResponseWriteBasic();
    var css = getCss('media.css');
    widgetRouteLogic._addNamespace(css, res, 'test-namespace');
    assertContains(res.written, '@media (-webkit-max-device-pixel-ratio: 1.5), (max-device-pixel-ratio: 1.5) {', 'media query definition is unchanged');
    assertNotContains(res.written, 'li[data-widget-id="test-namespace"] @media (-webkit-max-device-pixel-ratio: 1.5), (max-device-pixel-ratio: 1.5) {', 'media query definition is not namespaced');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] .complex {', 'inside the media query');
  });

  it('should handle comments', function () {
    var res = responseHelpers.getResponseWriteBasic();
    var css = getCss('comments.css');
    widgetRouteLogic._addNamespace(css, res, 'test-namespace');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] .before {', 'before a comment');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] .after {', 'after a comment');
    assertContains(res.written, 'li[data-widget-id="test-namespace"] .contains {', 'containing a comment');
  });

  it('should handle keyframes', function () {
    var res = responseHelpers.getResponseWriteBasic();
    var css = getCss('keyframes.css');
    widgetRouteLogic._addNamespace(css, res, 'test-namespace');
    assertContains(res.written, '@keyframes standards {', 'standard syntax is valid');
    assertNotContains(res.written, 'li[data-widget-id="test-namespace"] @keyframes vendor-prefixed {', 'standard syntax is not namespaced');
    assertContains(res.written, '@-webkit-keyframes vendor-prefix {', 'vendor-prefixed syntax is valid');
    assertNotContains(res.written, 'li[data-widget-id="test-namespace"] @-webkit-keyframes vendor-prefix {', 'vendor-prefixed syntax is not namespaced');
    assertContains(res.written, '0% {\n    width: 1px;\n  }', 'keep frames untouched');
  });

  it('should handle font declarations', function () {
    var res = responseHelpers.getResponseWriteBasic();
    var css = getCss('font-face.css');
    widgetRouteLogic._addNamespace(css, res, 'test-namespace');
    assertContains(res.written, '@font-face {', 'is valid');
    assertNotContains(res.written, 'li[data-widget-id="test-namespace"] @font-face {', 'not namespaced');
  });

});