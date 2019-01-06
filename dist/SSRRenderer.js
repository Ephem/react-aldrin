'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SSRTreeNode = exports.RAW_TEXT_TYPE = exports.ROOT_STATIC_TYPE = exports.ROOT_TYPE = undefined;
exports.renderToString = renderToString;
exports.renderToStaticMarkup = renderToStaticMarkup;

require('raf/polyfill');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactReconciler = require('react-reconciler');

var _reactReconciler2 = _interopRequireDefault(_reactReconciler);

var _scheduler = require('scheduler');

var ReactScheduler = _interopRequireWildcard(_scheduler);

var _emptyObject = require('fbjs/lib/emptyObject');

var _emptyObject2 = _interopRequireDefault(_emptyObject);

var _omittedCloseTags = require('./react-dom/src/shared/omittedCloseTags');

var _omittedCloseTags2 = _interopRequireDefault(_omittedCloseTags);

var _isCustomComponent = require('./react-dom/src/shared/isCustomComponent');

var _isCustomComponent2 = _interopRequireDefault(_isCustomComponent);

var _escapeTextForBrowser = require('./react-dom/src/server/escapeTextForBrowser');

var _escapeTextForBrowser2 = _interopRequireDefault(_escapeTextForBrowser);

var _DOMMarkupOperations = require('./react-dom/src/server/DOMMarkupOperations');

var _createMarkupForStyles = require('./reactUtils/createMarkupForStyles');

var _createMarkupForStyles2 = _interopRequireDefault(_createMarkupForStyles);

var _DispatcherModifier = require('./DispatcherModifier');

var _DispatcherModifier2 = _interopRequireDefault(_DispatcherModifier);

var _react3 = require('../react');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) 2018-present, Fredrik Höglund
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Some of the code in this file is copied or adapted from the React project,
 * used under the license below:
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

// For now the scheduler uses requestAnimationFrame,
// so we need to polyfill it
const ROOT_TYPE = exports.ROOT_TYPE = Symbol('ROOT_TYPE');
const ROOT_STATIC_TYPE = exports.ROOT_STATIC_TYPE = Symbol('ROOT_STATIC_TYPE');
const RAW_TEXT_TYPE = exports.RAW_TEXT_TYPE = Symbol('RAW_TEXT_TYPE');

function isEventListener(propName) {
    return propName.slice(0, 2).toLowerCase() === 'on';
}

function getMarkupForChildren(children, staticMarkup, selectedValue) {
    const childrenMarkup = [];
    for (let i = 0, l = children.length; i < l; i += 1) {
        const previousWasText = i > 0 && children[i - 1].type === RAW_TEXT_TYPE;
        childrenMarkup.push(children[i].toString(staticMarkup, previousWasText, undefined, selectedValue));
    }
    return childrenMarkup.join('');
}

const RESERVED_PROPS = {
    children: null,
    dangerouslySetInnerHTML: null,
    suppressContentEditableWarning: null,
    suppressHydrationWarning: null
};

class SSRTreeNode {
    constructor(type, text) {
        this.children = [];

        this.type = type;
        this.text = text;
        this.attributes = {};
    }

    appendChild(child) {
        this.children.push(child);
    }
    insertBefore(child, beforeChild) {
        this.children.splice(this.children.indexOf(beforeChild, 0, child));
    }
    removeChild(child) {
        this.children = this.children.filter(c => c !== child);
    }
    setText(text) {
        this.text = text;
    }
    setAttribute(name, value) {
        this.attributes[name] = value;
    }
    attributesToString(attributes) {
        let ret = '';
        for (const key in attributes) {
            if (!attributes.hasOwnProperty(key)) {
                continue;
            }
            let value = attributes[key];
            if (value == null) {
                continue;
            }
            if (key === 'style') {
                value = (0, _createMarkupForStyles2.default)(value);
            }
            let markup = null;
            if ((0, _isCustomComponent2.default)(this.type.toLowerCase(), attributes)) {
                if (!RESERVED_PROPS.hasOwnProperty(key)) {
                    markup = (0, _DOMMarkupOperations.createMarkupForCustomAttribute)(key, value);
                }
            } else {
                markup = (0, _DOMMarkupOperations.createMarkupForProperty)(key, value);
            }
            if (markup) {
                ret += ' ' + markup;
            }
        }
        return ret;
    }
    toString(staticMarkup, previousWasText, isRoot, selectedValue) {
        let renderAttributes = this.attributes;
        let selectSelectedValue;
        let childrenMarkup;
        const rawInnerHtml = this.attributes.dangerouslySetInnerHTML && this.attributes.dangerouslySetInnerHTML.__html;
        if (this.type === ROOT_STATIC_TYPE) {
            let markup = getMarkupForChildren(this.children, staticMarkup);
            return markup;
        }
        if (this.type === ROOT_TYPE) {
            return this.children.map(c => c.toString(staticMarkup, undefined, true)).join('');
        }
        if (this.type === RAW_TEXT_TYPE) {
            if (!staticMarkup && previousWasText) {
                return '<!-- -->' + (0, _escapeTextForBrowser2.default)(this.text);
            }
            return (0, _escapeTextForBrowser2.default)(this.text);
        }
        if (this.type === 'input') {
            if (renderAttributes.defaultValue || renderAttributes.defaultChecked) {
                renderAttributes = Object.assign({}, renderAttributes, {
                    value: renderAttributes.value != null ? renderAttributes.value : renderAttributes.defaultValue,
                    defaultValue: undefined,
                    checked: renderAttributes.Checked != null ? renderAttributes.Checked : renderAttributes.defaultChecked,
                    defaultChecked: undefined
                });
            }
        } else if (this.type === 'select') {
            if (renderAttributes.value || renderAttributes.defaultValue) {
                selectSelectedValue = renderAttributes.value || renderAttributes.defaultValue;
                renderAttributes = Object.assign({}, renderAttributes, {
                    value: undefined,
                    defaultValue: undefined
                });
            }
        } else if (this.type === 'textarea') {
            if (renderAttributes.value || renderAttributes.defaultValue) {
                this.appendChild(new SSRTreeNode(RAW_TEXT_TYPE, renderAttributes.value || renderAttributes.defaultValue));
                renderAttributes = Object.assign({}, renderAttributes, {
                    value: undefined,
                    defaultValue: undefined
                });
            }
        } else if (this.type === 'option') {
            childrenMarkup = getMarkupForChildren(this.children, staticMarkup, selectSelectedValue);
            let selected = null;
            if (selectedValue != null) {
                let value = renderAttributes.value != null ? renderAttributes.value : childrenMarkup;
                if (Array.isArray(selectedValue)) {
                    for (let i = 0; i < selectedValue.length; i++) {
                        if (selectedValue[i] === value) {
                            selected = true;
                            break;
                        }
                    }
                } else {
                    selected = selectedValue === value;
                }
                renderAttributes = Object.assign({}, {
                    selected
                }, renderAttributes);
            }
        }

        const selfClose = !this.children.length && _omittedCloseTags2.default[this.type];
        const startTag = `<${this.type}${this.attributesToString(renderAttributes)}${isRoot ? ' data-reactroot=""' : ''}${selfClose ? '/>' : '>'}`;
        childrenMarkup = rawInnerHtml || childrenMarkup || getMarkupForChildren(this.children, staticMarkup, selectSelectedValue);
        const endTag = selfClose ? '' : `</${this.type}>`;
        return startTag + childrenMarkup + endTag;
    }
}

exports.SSRTreeNode = SSRTreeNode;
const hostConfig = {
    getRootHostContext(rootInstance) {
        return _emptyObject2.default;
    },
    getChildHostContext(parentHostContext, type) {
        return _emptyObject2.default;
    },

    // Useful only for testing
    getPublicInstance(inst) {
        return inst;
    },

    // Create the DOMElement, but attributes are set in `finalizeInitialChildren`
    createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
        return new SSRTreeNode(type);
    },

    // appendChild for direct children
    appendInitialChild(parentInstance, child) {
        parentInstance.appendChild(child);
    },

    // Actually set the attributes and text content to the domElement and check if
    // it needs focus, which will be eventually set in `commitMount`
    finalizeInitialChildren(element, type, props) {
        Object.keys(props).forEach(propName => {
            const propValue = props[propName];

            if (propName === 'children') {
                if (typeof propValue === 'string' || typeof propValue === 'number') {
                    element.appendChild(new SSRTreeNode(RAW_TEXT_TYPE, propValue));
                }
            } else if (propName === 'className') {
                element.setAttribute('class', propValue);
            } else if (!isEventListener(propName)) {
                element.setAttribute(propName, propValue);
            }
        });
        return false;
    },

    // Calculate the updatePayload
    prepareUpdate(domElement, type, oldProps, newProps) {},

    shouldSetTextContent(type, props) {
        return type === 'textarea' || typeof props.children === 'string' || typeof props.children === 'number';
    },
    shouldDeprioritizeSubtree(type, props) {},
    createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
        return new SSRTreeNode(RAW_TEXT_TYPE, text);
    },
    scheduleDeferredCallback: ReactScheduler.unstable_scheduleCallback,
    cancelDeferredCallback: ReactScheduler.unstable_cancelCallback,
    shouldYield: ReactScheduler.unstable_shouldYield,

    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,

    setTimeout: setTimeout,
    clearTimeout: clearTimeout,

    noTimeout: -1,

    // Commit hooks, useful mainly for react-dom syntethic events
    prepareForCommit() {},
    resetAfterCommit() {},

    now: ReactScheduler.unstable_now,
    isPrimaryRenderer: true,
    //useSyncScheduling: true,

    supportsMutation: true,
    commitUpdate(domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {},
    commitMount(domElement, type, newProps, internalInstanceHandle) {},
    commitTextUpdate(textInstance, oldText, newText) {
        textInstance.setText(newText);
    },
    resetTextContent(textInstance) {
        textInstance.setText('');
    },
    appendChild(parentInstance, child) {
        parentInstance.appendChild(child);
    },

    // appendChild to root container
    appendChildToContainer(parentInstance, child) {
        parentInstance.appendChild(child);
    },
    insertBefore(parentInstance, child, beforeChild) {
        parentInstance.insertBefore(child, beforeChild);
    },
    insertInContainerBefore(parentInstance, child, beforeChild) {
        parentInstance.insertBefore(child, beforeChild);
    },
    removeChild(parentInstance, child) {
        parentInstance.removeChild(child);
    },
    removeChildFromContainer(parentInstance, child) {
        parentInstance.removeChild(child);
    },

    // These are todo and not well understood on the server
    hideInstance() {},
    hideTextInstance() {},
    unhideInstance() {},
    unhideTextInstance() {}
};

const SSRRenderer = (0, _reactReconciler2.default)(hostConfig);

function ReactRoot({ staticMarkup = false } = {}) {
    const rootType = staticMarkup ? ROOT_STATIC_TYPE : ROOT_TYPE;
    const ssrTreeRootNode = new SSRTreeNode(rootType);
    this._internalTreeRoot = ssrTreeRootNode;
    const root = SSRRenderer.createContainer(ssrTreeRootNode, true);
    this._internalRoot = root;
    this._staticMarkup = staticMarkup;
}
ReactRoot.prototype.render = function (children) {
    const root = this._internalRoot;
    const work = new ReactWork(this._internalTreeRoot, {
        staticMarkup: this._staticMarkup
    });
    SSRRenderer.updateContainer(children, root, null, work._onCommit);
    return work;
};
ReactRoot.prototype.unmount = function () {
    const root = this._internalRoot;
    const work = new ReactWork(this._internalTreeRoot);
    callback = callback === undefined ? null : callback;
    SSRRenderer.updateContainer(null, root, null, work._onCommit);
    return work;
};

function ReactWork(root, { staticMarkup = false } = {}) {
    this._callbacks = null;
    this._didCommit = false;
    // TODO: Avoid need to bind by replacing callbacks in the update queue with
    // list of Work objects.
    this._onCommit = this._onCommit.bind(this);
    this._internalRoot = root;
    this._staticMarkup = staticMarkup;
}
ReactWork.prototype.then = function (onCommit) {
    if (this._didCommit) {
        onCommit(this._internalRoot.toString(this._staticMarkup));
        return;
    }
    let callbacks = this._callbacks;
    if (callbacks === null) {
        callbacks = this._callbacks = [];
    }
    callbacks.push(onCommit);
};
ReactWork.prototype._onCommit = function () {
    if (this._didCommit) {
        return;
    }
    this._didCommit = true;
    const callbacks = this._callbacks;
    if (callbacks === null) {
        return;
    }
    // TODO: Error handling.
    for (let i = 0; i < callbacks.length; i++) {
        const callback = callbacks[i];
        callback(this._internalRoot.toString(this._staticMarkup));
    }
};

function createRoot(options) {
    return new ReactRoot(options);
}

function renderToString(element) {
    return new Promise((resolve, reject) => {
        const root = createRoot();
        const cache = (0, _react3.createCache)();
        return root.render(_react2.default.createElement(
            _DispatcherModifier2.default,
            null,
            _react2.default.createElement(
                _react3.PrimaryCacheContext.Provider,
                { value: cache },
                element
            )
        )).then(markup => {
            const cacheData = cache.serialize();
            const innerHTML = `window.__REACT_CACHE_DATA__ = ${cacheData};`;
            const markupWithCacheData = `${markup}<script id="react_cache_data_container">${innerHTML}</script>`;
            resolve({ markup, markupWithCacheData, cache });
        });
    });
}

function renderToStaticMarkup(element) {
    return new Promise((resolve, reject) => {
        const root = createRoot({ staticMarkup: true });
        const cache = (0, _react3.createCache)();
        return root.render(_react2.default.createElement(
            _DispatcherModifier2.default,
            null,
            _react2.default.createElement(
                _react3.PrimaryCacheContext.Provider,
                { value: cache },
                element
            )
        )).then(markup => {
            resolve({ markup, cache });
        });
    });
}

exports.default = {
    renderToString,
    renderToStaticMarkup
};