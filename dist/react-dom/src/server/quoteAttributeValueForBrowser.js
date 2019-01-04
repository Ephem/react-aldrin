'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _escapeTextForBrowser = require('./escapeTextForBrowser');

var _escapeTextForBrowser2 = _interopRequireDefault(_escapeTextForBrowser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Escapes attribute value to prevent scripting attacks.
 *
 * @param {*} value Value to escape.
 * @return {string} An escaped string.
 */
function quoteAttributeValueForBrowser(value) {
  return '"' + (0, _escapeTextForBrowser2.default)(value) + '"';
} /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

exports.default = quoteAttributeValueForBrowser;