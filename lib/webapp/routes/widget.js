var fs = require('fs'),
    path = require('path'),
    stylus = require('stylus'),
    async = require('async'),
    itemManager = require('../../item-manager'),
    logger = require('../../logger')(),
    helpers = require('../../helpers');

function getSafeItemName (item_name){
  return path.basename(item_name).split('.')[0];
}

function addNamespacesCSSToResponse(css, namespace, res) {
  res.write("<style>");
  addNamespace(css, res, namespace);
  res.write("</style>");
}

function addNamespace (css, res, widgetNamespace){
  function namespaceRulesAST (rules) {
    rules.forEach(function (rule) {
      if (rule.selectors) {
        rule.selectors = rule.selectors.map(function (selector) {
          if (selector === '@font-face') {
            return selector;
          }
          return 'li[data-widget-id="' + widgetNamespace + '"] ' + selector;
        });
      }
      // Handle rules within media queries
      if (rule.rules) {
        namespaceRulesAST(rule.rules);
      }
    });
  }

  if (css){
    var cssModule = require('css');
    var cssAST = cssModule.parse(css.toString());
    namespaceRulesAST(cssAST.stylesheet.rules);
    res.write(cssModule.stringify(cssAST));
  }
}

module.exports = {

    STYLUS_VARIABLES_PATH: path.join(__dirname, '../../../assets/stylesheets/variables'),

    // ---------------------------------------------------------------
    // Render specific resource for a widget
    // - resource format: <package>/<widget>/<resource>
    //   ex: atlassian/blockers/icon.png
    // ---------------------------------------------------------------
    renderWidgetResource: function (localPackagesPath, resource, req, res){
      if (!resource){
        return res.send(400, 'resource id not specified');
      }
      //sanitization
      var input = resource.split('/');
      if (input.length !== 3) {
        return res.send(400, 'bad input');
      }
      var packageName = input[0];
      var widgetName = input[1];
      var resourceName = input[2];

      //TODO: add extra sanitization
      var resourcePath = path.join(localPackagesPath, packageName, 'widgets', widgetName, resourceName);
      if (fs.existsSync(resourcePath)){
        res.sendfile(resourcePath);
      }
      else {
        return res.send(404, 'resource not found');
      }
    },

    // ---------------------------------------------------------------
    // Render JS for a specific widget
    // ---------------------------------------------------------------
    renderJsWidget: function (packagesPath, widgetName, req, res){
      res.type("application/javascript");
      widgetName = getSafeItemName(widgetName);
      itemManager.get_first(packagesPath, widgetName, "widgets", ".js", function(err, html_file){
        if (err || !html_file){
          return res.send(400, "Error rendering widget");
        }
        res.sendfile(html_file);
      });
    },

    // ---------------------------------------------------------------
    // Render HTML and styles (CSS/Stylus)
    // ---------------------------------------------------------------
    renderHtmlWidget : function (packagesPath, widgetName, req, res){

      widgetName = getSafeItemName(widgetName);
      var self = this;

      function getFileContents (extension, cb){
        itemManager.get_first(packagesPath, widgetName, "widgets", extension, function (err, path) {
          if (err || !path) {
            return cb(err ? err : 'File does not exist');
          }
          fs.readFile(path, 'utf-8', cb);
        });
      }

      function loadHTML (res, cb) {
        getFileContents(".html", function (err, html) {
          if (!err && html) {
            res.write(html);
          }
          cb(err);
        });
      }

      function loadCSSIfPresent (res, cb){
        getFileContents(".css", function(err, css){
          if (!err && css) {
            addNamespacesCSSToResponse(css, widgetName, res);
          }
          cb(err);
        });
      }

      function loadStylusIfPresent(res, cb) {
        getFileContents(".styl", function(err, stylusContent){
          if (!err && stylusContent) {
            stylus(stylusContent)
                .import(self.STYLUS_VARIABLES_PATH)
                .render(function (err, css) {
                  if (!err) {
                    addNamespacesCSSToResponse(css, widgetName, res);
                  } else {
                    logger.error(err);
                  }
                  cb(err);
                });
          } else {
            cb(err);
          }
        });
      }

      res.type("text/html");

      loadStylusIfPresent(res, function(){
        loadCSSIfPresent(res, function(){
          loadHTML(res, function(err){
            if (err) {
              res.send(500, "Error rendering widget: " + err);
            } else {
              res.end();
            }
          });
        })
      });
    },

    log : function (req, res){
      res.render(path.join(__dirname, "../..", "templates", "dashboard-log.ejs"));
    },

    // For testing only
    _addNamespace: addNamespace
};