"use strict";

var atlasboard = require('atlasboard');
atlasboard({port: process.env.ATLASBOARD_PORT || 3000, install: true}, function (err) {
  if (err) {
    throw err;
  }
});