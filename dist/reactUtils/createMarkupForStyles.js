'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = createMarkupForStyles;

var _memoizeStringOnly = require('fbjs/lib/memoizeStringOnly');

var _memoizeStringOnly2 = _interopRequireDefault(_memoizeStringOnly);

var _hyphenateStyleName = require('fbjs/lib/hyphenateStyleName');

var _hyphenateStyleName2 = _interopRequireDefault(_hyphenateStyleName);

var _dangerousStyleValue = require('./dangerousStyleValue');

var _dangerousStyleValue2 = _interopRequireDefault(_dangerousStyleValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const processStyleName = (0, _memoizeStringOnly2.default)(function (styleName) {
    return (0, _hyphenateStyleName2.default)(styleName);
}); /**
     * Copyright (c) 2018-present, Fredrik Höglund
     * 
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     * 
     * This file is very heavily based on code from the React-project,
     * used under the MIT License below:
     * 
     * Copyright (c) 2013-2018, Facebook, Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
    
     * The above copyright notice and this permission notice shall be included in all
     * copies or substantial portions of the Software.
    
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
     * SOFTWARE.
     */

function createMarkupForStyles(styles) {
    let serialized = '';
    let delimiter = '';
    for (const styleName in styles) {
        if (!styles.hasOwnProperty(styleName)) {
            continue;
        }
        const isCustomProperty = styleName.indexOf('--') === 0;
        const styleValue = styles[styleName];

        if (styleValue != null) {
            serialized += delimiter + processStyleName(styleName) + ':';
            serialized += (0, _dangerousStyleValue2.default)(styleName, styleValue, isCustomProperty);

            delimiter = ';';
        }
    }
    return serialized || null;
}