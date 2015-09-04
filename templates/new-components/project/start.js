"use strict";

var atlasboard = require('atlasboard');
atlasboard({port: 3000, install: true}, function (err) {
  if (err) {
    throw err;
  }
});