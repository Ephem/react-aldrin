'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _SSRRenderer = require('./SSRRenderer');

Object.keys(_SSRRenderer).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _SSRRenderer[key];
    }
  });
});