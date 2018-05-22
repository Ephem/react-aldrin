'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SSRTreeNode = exports.RAW_TEXT_TYPE = exports.ROOT_STATIC_TYPE = exports.ROOT_TYPE = undefined;
exports.createRoot = createRoot;
exports.renderToString = renderToString;
exports.renderToStringAsync = renderToStringAsync;
exports.renderToStaticMarkup = renderToStaticMarkup;
exports.renderToStaticMarkupAsync = renderToStaticMarkupAsync;

require('raf/polyfill');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactReconciler = require('react-reconciler');

var _reactReconciler2 = _interopRequireDefault(_reactReconciler);

var _reactScheduler = require('react-scheduler');

var ReactScheduler = _interopRequireWildcard(_reactScheduler);

var _emptyObject = require('fbjs/lib/emptyObject');

var _emptyObject2 = _interopRequireDefault(_emptyObject);

var _omittedCloseTags = require('./reactUtils/omittedCloseTags');

var _omittedCloseTags2 = _interopRequireDefault(_omittedCloseTags);

var _createMarkupForStyles = require('./reactUtils/createMarkupForStyles');

var _createMarkupForStyles2 = _interopRequireDefault(_createMarkupForStyles);

var _escapeTextForBrowser = require('./reactUtils/escapeTextForBrowser');

var _escapeTextForBrowser2 = _interopRequireDefault(_escapeTextForBrowser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The latest suspense-ready version of the react-reconciler
// has not been published to npm yet, so for this to work,
// it needs to be built and npm linked from the React master
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

// For now the react-scheduler uses requestAnimationFrame,
// so we need to polyfill it
const ROOT_TYPE = exports.ROOT_TYPE = Symbol('ROOT_TYPE');
// The scheduler does not exist as a separate npm-package yet,
// it needs to be built and npm linked from the React master
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
        const attributesArray = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = Object.keys(attributes)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                const key = _step.value;

                if (attributes.hasOwnProperty(key) && attributes[key] != null && attributes[key] !== false) {
                    let value = attributes[key];
                    if (value === true) {
                        value = '';
                    }
                    attributesArray.push(key + '="' + value + '"');
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return attributesArray.length ? ' ' + attributesArray.join(' ') : '';
    }
    toString(staticMarkup, previousWasText, isRoot, selectedValue) {
        let renderAttributes = this.attributes;
        let selectSelectedValue;
        let childrenMarkup;
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
        childrenMarkup = childrenMarkup || getMarkupForChildren(this.children, staticMarkup, selectSelectedValue);
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
            } else if (propName === 'style') {
                element.setAttribute(propName, (0, _createMarkupForStyles2.default)(propValue));
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
    scheduleDeferredCallback: ReactScheduler.scheduleWork,
    cancelDeferredCallback: ReactScheduler.cancelScheduledWork,

    // Commit hooks, useful mainly for react-dom syntethic events
    prepareForCommit() {},
    resetAfterCommit() {},

    now: ReactScheduler.now,
    isPrimaryRenderer: true,
    //useSyncScheduling: true,

    mutation: {
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
        }
    }
};

const SSRRenderer = (0, _reactReconciler2.default)(hostConfig);

function ReactRoot() {
    const ssrTreeRootNode = new SSRTreeNode(ROOT_TYPE);
    this._internalTreeRoot = ssrTreeRootNode;
    const root = SSRRenderer.createContainer(ssrTreeRootNode, true);
    this._internalRoot = root;
}
ReactRoot.prototype.render = function (children) {
    const root = this._internalRoot;
    const work = new ReactWork(this._internalTreeRoot);
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

function ReactWork(root) {
    this._callbacks = null;
    this._didCommit = false;
    // TODO: Avoid need to bind by replacing callbacks in the update queue with
    // list of Work objects.
    this._onCommit = this._onCommit.bind(this);
    this._internalRoot = root;
}
ReactWork.prototype.then = function (onCommit) {
    if (this._didCommit) {
        onCommit({ html: this._internalRoot.toString() });
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
        callback({ html: this._internalRoot.toString() });
    }
};

function createRoot() {
    return new ReactRoot();
}

function renderToRoot(element, root) {
    return SSRRenderer.updateContainer(element, root, null);
}

function renderToString(element) {
    let ssrTreeRootNode = new SSRTreeNode(ROOT_TYPE);
    let root = SSRRenderer.createContainer(ssrTreeRootNode);
    renderToRoot(element, root);
    return ssrTreeRootNode.toString();
}

function renderToStringAsync(element, SSRContextProvider) {
    return new Promise((resolve, reject) => {
        let ssrTreeRootNode = new SSRTreeNode(ROOT_TYPE);
        let root = SSRRenderer.createContainer(ssrTreeRootNode);

        function markSSRDone(cache) {
            resolve({ html: ssrTreeRootNode.toString(), cache });
        }

        renderToRoot(_react2.default.createElement(
            SSRContextProvider,
            { markSSRDone: markSSRDone },
            element
        ), root);
    });
}

function renderToStaticMarkup(element) {
    let ssrTreeRootNode = new SSRTreeNode(ROOT_STATIC_TYPE);
    let root = SSRRenderer.createContainer(ssrTreeRootNode);
    renderToRoot(element, root);
    return ssrTreeRootNode.toString(true);
}

function renderToStaticMarkupAsync(element, SSRContextProvider) {
    return new Promise((resolve, reject) => {
        let ssrTreeRootNode = new SSRTreeNode(ROOT_STATIC_TYPE);
        let root = SSRRenderer.createContainer(ssrTreeRootNode);

        function markSSRDone(cache) {
            resolve({ html: ssrTreeRootNode.toString(true), cache });
        }

        renderToRoot(_react2.default.createElement(
            SSRContextProvider,
            { markSSRDone: markSSRDone },
            element
        ), root);
    });
}

exports.default = {
    createRoot,
    renderToString,
    renderToStringAsync,
    renderToStaticMarkup,
    renderToStaticMarkupAsync
};