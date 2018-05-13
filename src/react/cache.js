/**
 * Copyright (c) 2018-present, Fredrik Höglund
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This file is heavily based on code from the React-project,
 * namely simple-cache-provider, used under the MIT License below:
 *
 * Copyright (c) 2014-2018, Facebook, Inc.
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

function noop() {}

const Empty = 0;
const Pending = 1;
const Resolved = 2;
const Rejected = 3;

export function createCache(invalidator) {
    let resourceCache = {};

    function getRecord(resourceName, key) {
        let recordCache = resourceCache[resourceName];
        if (recordCache !== undefined) {
            const record = recordCache[key];
            if (record !== undefined) {
                return record;
            }
        } else {
            recordCache = {};
            resourceCache[resourceName] = recordCache;
        }

        const record = {
            status: Empty,
            suspender: null,
            value: null,
            error: null
        };
        recordCache[key] = record;
        return record;
    }

    function load(emptyRecord, suspender) {
        const pendingRecord = emptyRecord;
        pendingRecord.status = Pending;
        pendingRecord.suspender = suspender;
        suspender.then(
            value => {
                // Resource loaded successfully.
                const resolvedRecord = pendingRecord;
                resolvedRecord.status = Resolved;
                resolvedRecord.suspender = null;
                resolvedRecord.value = value;
            },
            error => {
                // Resource failed to load. Stash the error for later so we can throw it
                // the next time it's requested.
                const rejectedRecord = pendingRecord;
                rejectedRecord.status = Rejected;
                rejectedRecord.suspender = null;
                rejectedRecord.error = error;
            }
        );
    }

    const cache = {
        invalidate() {
            invalidator();
        },
        preload(resource, key, miss, missArg) {
            const record = getRecord(resource.name, key);
            switch (record.status) {
                case Empty:
                    // Warm the cache.
                    const suspender = miss(missArg);
                    load(record, suspender);
                    return;
                case Pending:
                    // There's already a pending request.
                    return;
                case Resolved:
                    // The resource is already in the cache.
                    return;
                case Rejected:
                    // The request failed.
                    return;
            }
        },
        get(resource, key, miss, missArg) {
            const record = getRecord(resource.name, key);
            switch (record.status) {
                case Empty:
                    return undefined;
                case Pending:
                    // There's already a pending request.
                    return record.suspender;
                case Resolved:
                    return record.value;
                case Rejected:
                default:
                    // The requested resource previously failed loading.
                    const error = record.error;
                    throw error;
            }
        },
        read(resource, key, miss, missArg, enableSuspense) {
            const record = getRecord(resource.name, key);
            switch (record.status) {
                case Empty:
                    // Load the requested resource.
                    const suspender = miss(missArg);
                    load(record, suspender);
                    if (enableSuspense) {
                        throw suspender;
                    }
                    return suspender;
                case Pending:
                    // There's already a pending request.
                    if (enableSuspense) {
                        throw record.suspender;
                    }
                    return record.suspender;
                case Resolved:
                    return record.value;
                case Rejected:
                default:
                    // The requested resource previously failed loading.
                    const error = record.error;
                    throw error;
            }
        },
        serialize() {
            function replacer(key, value) {
                if (key === 'suspender') {
                    return undefined;
                }
                return value;
            }
            return JSON.stringify(resourceCache, replacer);
        },
        deserialize(cache) {
            resourceCache = cache;
        }
    };

    return cache;
}

export function createResource(
    resourceName,
    loadResource,
    hash,
    enableSuspense
) {
    const resource = {
        name: resourceName,
        get(cache, key) {
            if (hash === undefined) {
                return cache.get(resource, key, loadResource, key);
            }
            const hashedKey = hash(key);
            return cache.get(resource, hashedKey, loadResource, key);
        },
        read(cache, key) {
            if (hash === undefined) {
                return cache.read(
                    resource,
                    key,
                    loadResource,
                    key,
                    enableSuspense
                );
            }
            const hashedKey = hash(key);
            return cache.read(
                resource,
                hashedKey,
                loadResource,
                ke,
                enableSuspensey
            );
        },
        preload(cache, key) {
            if (hash === undefined) {
                cache.preload(resource, key, loadResource, key);
                return;
            }
            const hashedKey = hash(key);
            cache.preload(resource, hashedKey, loadResource, key);
        }
    };
    return resource;
}
