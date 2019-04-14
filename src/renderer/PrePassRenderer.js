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

import './reactMonkeyPatch';

// For now the scheduler uses requestAnimationFrame,
// so we need to polyfill it
import 'raf/polyfill';
import React from 'react';
import Reconciler from 'react-reconciler';
import * as ReactScheduler from 'scheduler';
import emptyObject from 'fbjs/lib/emptyObject';

import DispatcherModifier from './DispatcherModifier';

export const ROOT_TYPE = Symbol('ROOT_TYPE');
export const RAW_TEXT_TYPE = Symbol('RAW_TEXT_TYPE');

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
        return { type };
    },

    // appendChild for direct children
    appendInitialChild(parentInstance, child) {},

    // Actually set the attributes and text content to the domElement and check if
    // it needs focus, which will be eventually set in `commitMount`
    finalizeInitialChildren(element, type, props) {
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
        return { type: RAW_TEXT_TYPE, text };
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
    commitTextUpdate(textInstance, oldText, newText) {},
    resetTextContent(textInstance) {},
    appendChild(parentInstance, child) {},

    // appendChild to root container
    appendChildToContainer(parentInstance, child) {},
    insertBefore(parentInstance, child, beforeChild) {},
    insertInContainerBefore(parentInstance, child, beforeChild) {},
    removeChild(parentInstance, child) {},
    removeChildFromContainer(parentInstance, child) {},

    // These are todo and not well understood on the server
    hideInstance() {},
    hideTextInstance() {},
    unhideInstance() {},
    unhideTextInstance() {}
};

const SSRRenderer = Reconciler(hostConfig);

function ReactRoot() {
    this._internalTreeRoot = { type: ROOT_TYPE };
    const root = SSRRenderer.createContainer(this._internalTreeRoot, true);
    this._internalRoot = root;
}
ReactRoot.prototype.render = function(children) {
    return new Promise(resolve => {
        SSRRenderer.updateContainer(
            children,
            this._internalRoot,
            null,
            resolve
        );
    });
};
ReactRoot.prototype.unmount = function() {
    return new Promise(resolve => {
        SSRRenderer.updateContainer(null, this._internalRoot, null, resolve);
    });
};

function createRoot() {
    return new ReactRoot();
}

export function renderPrepass(element) {
    return createRoot().render(
        <DispatcherModifier>{element}</DispatcherModifier>
    );
}

export default {
    renderPrepass
};
