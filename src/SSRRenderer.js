import React from 'react';
import Reconciler from 'react-reconciler';
import emptyObject from 'fbjs/lib/emptyObject';
import { SSRContext } from './reactHelpers';
import omittedCloseTags from './reactUtils/omittedCloseTags';
import createMarkupForStyles from './reactUtils/createMarkupForStyles';
import escapeTextForBrowser from './reactUtils/escapeTextForBrowser';

export const ROOT_TYPE = Symbol('ROOT_TYPE');
export const RAW_TEXT_TYPE = Symbol('RAW_TEXT_TYPE');

function isEventListener(propName) {
    return propName.slice(0, 2).toLowerCase() === 'on';
}

export class SSRTreeNode {
    constructor(type, text) {
        this.type = type;
        this.text = text;
        this.attributes = [];
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
        this.attributes.push(name + '="' + value + '"');
    }
    attributesToString() {
        return this.attributes.length ? ' ' + this.attributes.join(' ') : '';
    }
    toString() {
        if (this.type === ROOT_TYPE) {
            return this.children.map(c => c.toString()).join('');
        }
        if (this.type === RAW_TEXT_TYPE) {
            return escapeTextForBrowser(this.text);
        }

        const selfClose = !this.children.length && omittedCloseTags[this.type];
        const startTag = `<${this.type}${this.attributesToString()}${
            selfClose ? '/>' : '>'
        }`;
        const children = this.children.map(c => c.toString()).join('');
        const endTag = selfClose ? '' : `</${this.type}>`;
        return startTag + children + endTag;
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

export function renderToStaticMarkup(element) {
    let ssrTreeRootNode = new SSRTreeNode(ROOT_TYPE);
    let root = SSRRenderer.createContainer(ssrTreeRootNode);
    renderToRoot(element, root);
    return ssrTreeRootNode.toString();
}

export function renderToStaticMarkupAsync(element) {
    return new Promise((resolve, reject) => {
        let ssrTreeRootNode = new SSRTreeNode(ROOT_TYPE);
        let root = SSRRenderer.createContainer(ssrTreeRootNode);

        function markSSRDone() {
            resolve(ssrTreeRootNode.toString());
        }

        renderToRoot(
            <SSRContext.Provider value={markSSRDone}>
                {element}
            </SSRContext.Provider>,
            root
        );
    });
}

export default {
    renderToStaticMarkup,
    renderToStaticMarkupAsync
};
