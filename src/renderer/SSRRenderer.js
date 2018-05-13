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

import React from 'react';
import Reconciler from 'react-reconciler';
import emptyObject from 'fbjs/lib/emptyObject';
import omittedCloseTags from './reactUtils/omittedCloseTags';
import createMarkupForStyles from './reactUtils/createMarkupForStyles';
import escapeTextForBrowser from './reactUtils/escapeTextForBrowser';

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
                attributes[key] !== false
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
    scheduleDeferredCallback(callbackID) {},
    cancelDeferredCallback(callbackID) {},

    // Commit hooks, useful mainly for react-dom syntethic events
    prepareForCommit() {},
    resetAfterCommit() {},

    now: () => {},
    useSyncScheduling: true,

    mutation: {
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
        }
    }
};

const SSRRenderer = Reconciler(hostConfig);

function renderToRoot(element, root) {
    return SSRRenderer.updateContainer(element, root, null);
}

export function renderToString(element) {
    let ssrTreeRootNode = new SSRTreeNode(ROOT_TYPE);
    let root = SSRRenderer.createContainer(ssrTreeRootNode);
    renderToRoot(element, root);
    return ssrTreeRootNode.toString();
}

export function renderToStringAsync(element, SSRContextProvider) {
    return new Promise((resolve, reject) => {
        let ssrTreeRootNode = new SSRTreeNode(ROOT_TYPE);
        let root = SSRRenderer.createContainer(ssrTreeRootNode);

        function markSSRDone(cache) {
            resolve({ html: ssrTreeRootNode.toString(), cache });
        }

        renderToRoot(
            <SSRContextProvider markSSRDone={markSSRDone}>
                {element}
            </SSRContextProvider>,
            root
        );
    });
}

export function renderToStaticMarkup(element) {
    let ssrTreeRootNode = new SSRTreeNode(ROOT_STATIC_TYPE);
    let root = SSRRenderer.createContainer(ssrTreeRootNode);
    renderToRoot(element, root);
    return ssrTreeRootNode.toString(true);
}

export function renderToStaticMarkupAsync(element, SSRContextProvider) {
    return new Promise((resolve, reject) => {
        let ssrTreeRootNode = new SSRTreeNode(ROOT_STATIC_TYPE);
        let root = SSRRenderer.createContainer(ssrTreeRootNode);

        function markSSRDone(cache) {
            resolve({ html: ssrTreeRootNode.toString(true), cache });
        }

        renderToRoot(
            <SSRContextProvider markSSRDone={markSSRDone}>
                {element}
            </SSRContextProvider>,
            root
        );
    });
}

export default {
    renderToString,
    renderToStringAsync,
    renderToStaticMarkup,
    renderToStaticMarkupAsync
};
