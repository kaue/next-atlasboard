module.exports = (function() {

  return {

    // https://www.npmjs.com/package/tracer

    "format": [
      "{{timestamp}} <{{title}}> {{message}} ({{file}})",
      {
        // error template
        "error": "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}"
      }
    ],
    "dateformat": "HH:MM:ss.L",
    "level": 3
  }

})();