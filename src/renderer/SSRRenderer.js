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
import 'raf/polyfill';
import React from 'react';
import Reconciler from 'react-reconciler';
import * as ReactScheduler from 'scheduler';
import emptyObject from 'fbjs/lib/emptyObject';
import omittedCloseTags from './reactUtils/omittedCloseTags';
import createMarkupForStyles from './reactUtils/createMarkupForStyles';
import escapeTextForBrowser from './reactUtils/escapeTextForBrowser';
import { PrimaryCacheContext, createCache } from '../react';

export const ROOT_TYPE = Symbol('ROOT_TYPE');
export const ROOT_STATIC_TYPE = Symbol('ROOT_STATIC_TYPE');
export const RAW_TEXT_TYPE = Symbol('RAW_TEXT_TYPE');

function isEventListener(propName) {
    return propName.slice(0, 2).toLowerCase() === 'on';
}

function getMarkupForChildren(children, staticMarkup, selectedValue) {
    const childrenMarkup = [];
    for (let i = 0, l = children.length; i < l; i += 1) {
        const previousWasText = i > 0 && children[i - 1].type === RAW_TEXT_TYPE;
        childrenMarkup.push(
            children[i].toString(
                staticMarkup,
                previousWasText,
                undefined,
                selectedValue
            )
        );
    }
    return childrenMarkup.join('');
}

const attributeBlacklist = {
    dangerouslySetInnerHTML: true,
    children: true,
    dangerouslySetInnerHTML: true,
    defaultValue: true,
    defaultChecked: true,
    innerHTML: true,
    suppressContentEditableWarning: true,
    suppressHydrationWarning: true
};

export class SSRTreeNode {
    constructor(type, text) {
        this.type = type;
        this.text = text;
        this.attributes = {};
    }
    children = [];
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
        for (const key of Object.keys(attributes)) {
            if (
                attributes.hasOwnProperty(key) &&
                attributes[key] != null &&
                attributes[key] !== false &&
                !attributeBlacklist[key]
            ) {
                let value = attributes[key];
                if (value === true) {
                    value = '';
                }
                attributesArray.push(key + '="' + value + '"');
            }
        }
        return attributesArray.length ? ' ' + attributesArray.join(' ') : '';
    }
    toString(staticMarkup, previousWasText, isRoot, selectedValue) {
        let renderAttributes = this.attributes;
        let selectSelectedValue;
        let childrenMarkup;
        const rawInnerHtml =
            this.attributes.dangerouslySetInnerHTML &&
            this.attributes.dangerouslySetInnerHTML.__html;
        if (this.type === ROOT_STATIC_TYPE) {
            let markup = getMarkupForChildren(this.children, staticMarkup);
            return markup;
        }
        if (this.type === ROOT_TYPE) {
            return this.children
                .map(c => c.toString(staticMarkup, undefined, true))
                .join('');
        }
        if (this.type === RAW_TEXT_TYPE) {
            if (!staticMarkup && previousWasText) {
                return '<!-- -->' + escapeTextForBrowser(this.text);
            }
            return escapeTextForBrowser(this.text);
        }
        if (this.type === 'input') {
            if (
                renderAttributes.defaultValue ||
                renderAttributes.defaultChecked
            ) {
                renderAttributes = Object.assign({}, renderAttributes, {
                    value:
                        renderAttributes.value != null
                            ? renderAttributes.value
                            : renderAttributes.defaultValue,
                    defaultValue: undefined,
                    checked:
                        renderAttributes.Checked != null
                            ? renderAttributes.Checked
                            : renderAttributes.defaultChecked,
                    defaultChecked: undefined
                });
            }
        } else if (this.type === 'select') {
            if (renderAttributes.value || renderAttributes.defaultValue) {
                selectSelectedValue =
                    renderAttributes.value || renderAttributes.defaultValue;
                renderAttributes = Object.assign({}, renderAttributes, {
                    value: undefined,
                    defaultValue: undefined
                });
            }
        } else if (this.type === 'textarea') {
            if (renderAttributes.value || renderAttributes.defaultValue) {
                this.appendChild(
                    new SSRTreeNode(
                        RAW_TEXT_TYPE,
                        renderAttributes.value || renderAttributes.defaultValue
                    )
                );
                renderAttributes = Object.assign({}, renderAttributes, {
                    value: undefined,
                    defaultValue: undefined
                });
            }
        } else if (this.type === 'option') {
            childrenMarkup = getMarkupForChildren(
                this.children,
                staticMarkup,
                selectSelectedValue
            );
            let selected = null;
            if (selectedValue != null) {
                let value =
                    renderAttributes.value != null
                        ? renderAttributes.value
                        : childrenMarkup;
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
                renderAttributes = Object.assign(
                    {},
                    {
                        selected
                    },
                    renderAttributes
                );
            }
        }

        const selfClose = !this.children.length && omittedCloseTags[this.type];
        const startTag = `<${this.type}${this.attributesToString(
            renderAttributes
        )}${isRoot ? ' data-reactroot=""' : ''}${selfClose ? '/>' : '>'}`;
        childrenMarkup =
            rawInnerHtml ||
            childrenMarkup ||
            getMarkupForChildren(
                this.children,
                staticMarkup,
                selectSelectedValue
            );
        const endTag = selfClose ? '' : `</${this.type}>`;
        return startTag + childrenMarkup + endTag;
    }
}

const hostConfig = {
    getRootHostContext(rootInstance) {
        return emptyObject;
    },
    getChildHostContext(parentHostContext, type) {
        return emptyObject;
    },

    // Useful only for testing
    getPublicInstance(inst) {
        return inst;
    },

    // Create the DOMElement, but attributes are set in `finalizeInitialChildren`
    createInstance(
        type,
        props,
        rootContainerInstance,
        hostContext,
        internalInstanceHandle
    ) {
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
                if (
                    typeof propValue === 'string' ||
                    typeof propValue === 'number'
                ) {
                    element.appendChild(
                        new SSRTreeNode(RAW_TEXT_TYPE, propValue)
                    );
                }
            } else if (propName === 'className') {
                element.setAttribute('class', propValue);
            } else if (propName === 'style') {
                element.setAttribute(
                    propName,
                    createMarkupForStyles(propValue)
                );
            } else if (!isEventListener(propName)) {
                element.setAttribute(propName, propValue);
            }
        });
        return false;
    },

    // Calculate the updatePayload
    prepareUpdate(domElement, type, oldProps, newProps) {},

    shouldSetTextContent(type, props) {
        return (
            type === 'textarea' ||
            typeof props.children === 'string' ||
            typeof props.children === 'number'
        );
    },
    shouldDeprioritizeSubtree(type, props) {},
    createTextInstance(
        text,
        rootContainerInstance,
        hostContext,
        internalInstanceHandle
    ) {
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
    commitUpdate(
        domElement,
        updatePayload,
        type,
        oldProps,
        newProps,
        internalInstanceHandle
    ) {},
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

const SSRRenderer = Reconciler(hostConfig);

function ReactRoot({ staticMarkup = false } = {}) {
    const rootType = staticMarkup ? ROOT_STATIC_TYPE : ROOT_TYPE;
    const ssrTreeRootNode = new SSRTreeNode(rootType);
    this._internalTreeRoot = ssrTreeRootNode;
    const root = SSRRenderer.createContainer(ssrTreeRootNode, true);
    this._internalRoot = root;
    this._staticMarkup = staticMarkup;
}
ReactRoot.prototype.render = function(children) {
    const root = this._internalRoot;
    const work = new ReactWork(this._internalTreeRoot, {
        staticMarkup: this._staticMarkup
    });
    SSRRenderer.updateContainer(children, root, null, work._onCommit);
    return work;
};
ReactRoot.prototype.unmount = function() {
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
ReactWork.prototype.then = function(onCommit) {
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
ReactWork.prototype._onCommit = function() {
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

export function renderToString(element) {
    return new Promise((resolve, reject) => {
        const root = createRoot();
        const cache = createCache();
        return root
            .render(
                <PrimaryCacheContext.Provider value={cache}>
                    {element}
                </PrimaryCacheContext.Provider>
            )
            .then(markup => {
                const cacheData = cache.serialize();
                const innerHTML = `window.__REACT_CACHE_DATA__ = ${cacheData};`;
                const markupWithCacheData = `${markup}<script id="react_cache_data_container">${innerHTML}</script>`;
                resolve({ markup, markupWithCacheData, cache });
            });
    });
}

export function renderToStaticMarkup(element) {
    return new Promise((resolve, reject) => {
        const root = createRoot({ staticMarkup: true });
        const cache = createCache();
        return root
            .render(
                <PrimaryCacheContext.Provider value={cache}>
                    {element}
                </PrimaryCacheContext.Provider>
            )
            .then(markup => {
                resolve({ markup, cache });
            });
    });
}

export default {
    renderToString,
    renderToStaticMarkup
};
