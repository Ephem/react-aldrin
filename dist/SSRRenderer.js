'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SSRTreeNode = exports.RAW_TEXT_TYPE = exports.ROOT_STATIC_TYPE = exports.ROOT_TYPE = undefined;
exports.renderToString = renderToString;
exports.renderToStringAsync = renderToStringAsync;
exports.renderToStaticMarkup = renderToStaticMarkup;
exports.renderToStaticMarkupAsync = renderToStaticMarkupAsync;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactReconciler = require('react-reconciler');

var _reactReconciler2 = _interopRequireDefault(_reactReconciler);

var _emptyObject = require('fbjs/lib/emptyObject');

var _emptyObject2 = _interopRequireDefault(_emptyObject);

var _reactHelpers = require('./reactHelpers');

var _omittedCloseTags = require('./reactUtils/omittedCloseTags');

var _omittedCloseTags2 = _interopRequireDefault(_omittedCloseTags);

var _createMarkupForStyles = require('./reactUtils/createMarkupForStyles');

var _createMarkupForStyles2 = _interopRequireDefault(_createMarkupForStyles);

var _escapeTextForBrowser = require('./reactUtils/escapeTextForBrowser');

var _escapeTextForBrowser2 = _interopRequireDefault(_escapeTextForBrowser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ROOT_TYPE = exports.ROOT_TYPE = Symbol('ROOT_TYPE');
const ROOT_STATIC_TYPE = exports.ROOT_STATIC_TYPE = Symbol('ROOT_STATIC_TYPE');
const RAW_TEXT_TYPE = exports.RAW_TEXT_TYPE = Symbol('RAW_TEXT_TYPE');

function isEventListener(propName) {
    return propName.slice(0, 2).toLowerCase() === 'on';
}

function getMarkupForChildren(children, staticMarkup) {
    const childrenMarkup = [];
    for (let i = 0, l = children.length; i < l; i += 1) {
        const previousWasText = i > 0 && children[i - 1].type === RAW_TEXT_TYPE;
        childrenMarkup.push(children[i].toString(staticMarkup, previousWasText));
    }
    return childrenMarkup.join('');
}

class SSRTreeNode {
    constructor(type, text) {
        this.children = [];

        this.type = type;
        this.text = text;
        this.attributes = [];
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
        this.attributes.push(name + '="' + value + '"');
    }
    attributesToString() {
        return this.attributes.length ? ' ' + this.attributes.join(' ') : '';
    }
    toString(staticMarkup, previousWasText, isRoot) {
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

        const selfClose = !this.children.length && _omittedCloseTags2.default[this.type];
        const startTag = `<${this.type}${this.attributesToString()}${isRoot ? ' data-reactroot=""' : ''}${selfClose ? '/>' : '>'}`;
        const childrenMarkup = getMarkupForChildren(this.children, staticMarkup);
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
    scheduleDeferredCallback(callbackID) {},
    cancelDeferredCallback(callbackID) {},

    // Commit hooks, useful mainly for react-dom syntethic events
    prepareForCommit() {},
    resetAfterCommit() {},

    now: () => {},
    useSyncScheduling: true,

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

function renderToRoot(element, root) {
    return SSRRenderer.updateContainer(element, root, null);
}

function renderToString(element) {
    let ssrTreeRootNode = new SSRTreeNode(ROOT_TYPE);
    let root = SSRRenderer.createContainer(ssrTreeRootNode);
    renderToRoot(element, root);
    return ssrTreeRootNode.toString();
}

function renderToStringAsync(element) {
    return new Promise((resolve, reject) => {
        let ssrTreeRootNode = new SSRTreeNode(ROOT_TYPE);
        let root = SSRRenderer.createContainer(ssrTreeRootNode);

        function markSSRDone() {
            resolve(ssrTreeRootNode.toString());
        }

        renderToRoot(_react2.default.createElement(
            _reactHelpers.SSRContext.Provider,
            { value: markSSRDone },
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

function renderToStaticMarkupAsync(element) {
    return new Promise((resolve, reject) => {
        let ssrTreeRootNode = new SSRTreeNode(ROOT_STATIC_TYPE);
        let root = SSRRenderer.createContainer(ssrTreeRootNode);

        function markSSRDone() {
            resolve(ssrTreeRootNode.toString(true));
        }

        renderToRoot(_react2.default.createElement(
            _reactHelpers.SSRContext.Provider,
            { value: markSSRDone },
            element
        ), root);
    });
}

exports.default = {
    renderToString,
    renderToStringAsync,
    renderToStaticMarkup,
    renderToStaticMarkupAsync
};