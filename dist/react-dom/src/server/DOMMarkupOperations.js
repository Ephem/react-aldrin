'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMarkupForID = createMarkupForID;
exports.createMarkupForRoot = createMarkupForRoot;
exports.createMarkupForProperty = createMarkupForProperty;
exports.createMarkupForCustomAttribute = createMarkupForCustomAttribute;

var _DOMProperty = require('../shared/DOMProperty');

var _quoteAttributeValueForBrowser = require('./quoteAttributeValueForBrowser');

var _quoteAttributeValueForBrowser2 = _interopRequireDefault(_quoteAttributeValueForBrowser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Operations for dealing with DOM properties.
 */

/**
 * Creates markup for the ID property.
 *
 * @param {string} id Unescaped ID.
 * @return {string} Markup string.
 */
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function createMarkupForID(id) {
  return _DOMProperty.ID_ATTRIBUTE_NAME + '=' + (0, _quoteAttributeValueForBrowser2.default)(id);
}

function createMarkupForRoot() {
  return _DOMProperty.ROOT_ATTRIBUTE_NAME + '=""';
}

/**
 * Creates markup for a property.
 *
 * @param {string} name
 * @param {*} value
 * @return {?string} Markup string, or null if the property was invalid.
 */
function createMarkupForProperty(name, value) {
  const propertyInfo = (0, _DOMProperty.getPropertyInfo)(name);
  if (name !== 'style' && (0, _DOMProperty.shouldIgnoreAttribute)(name, propertyInfo, false)) {
    return '';
  }
  if ((0, _DOMProperty.shouldRemoveAttribute)(name, value, propertyInfo, false)) {
    return '';
  }
  if (propertyInfo !== null) {
    const attributeName = propertyInfo.attributeName;
    const type = propertyInfo.type;

    if (type === _DOMProperty.BOOLEAN || type === _DOMProperty.OVERLOADED_BOOLEAN && value === true) {
      return attributeName + '=""';
    } else {
      return attributeName + '=' + (0, _quoteAttributeValueForBrowser2.default)(value);
    }
  } else if ((0, _DOMProperty.isAttributeNameSafe)(name)) {
    return name + '=' + (0, _quoteAttributeValueForBrowser2.default)(value);
  }
  return '';
}

/**
 * Creates markup for a custom property.
 *
 * @param {string} name
 * @param {*} value
 * @return {string} Markup string, or empty string if the property was invalid.
 */
function createMarkupForCustomAttribute(name, value) {
  if (!(0, _DOMProperty.isAttributeNameSafe)(name) || value == null) {
    return '';
  }
  return name + '=' + (0, _quoteAttributeValueForBrowser2.default)(value);
}