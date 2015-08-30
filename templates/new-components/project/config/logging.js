module.exports = {

  "liveLoggingWebAccess": false, // disabled by default for security reasons

  /**
   * https://www.npmjs.com/package/tracer
   */

  "logger": {

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
};