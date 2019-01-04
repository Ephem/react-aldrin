import React, { Suspense, useState, useReducer, useContext } from 'react';

import { renderToString } from '../renderer/SSRRenderer';
import {
    createResource,
    createCache,
    PrimaryCacheContext
} from '../react/cache';

const getResource = (timeout = 10, value = 'Async resource') => {
    let calls = { count: 0 };
    return {
        calls,
        resource: createResource('test-resource', () => {
            calls.count += 1;
            return new Promise(resolve => {
                setTimeout(() => resolve(value), timeout);
            });
        })
    };
};

const CacheFromProp = ({ cache, resource }) => {
    const text = resource.read(cache);
    return text;
};

const CacheFromContext = ({ resource }) => {
    const cache = useContext(PrimaryCacheContext);
    const text = resource.read(cache);
    return text;
};

const SuspenseApp = ({ timeout = 5000, children }) => {
    return (
        <div>
            <Suspense maxDuration={timeout} fallback={'Loading...'}>
                {children}
            </Suspense>
        </div>
    );
};

describe('SSRRenderer resources', () => {
    it('renders with async resource', async () => {
        const cache = createCache();
        const { resource } = getResource();

        const { markup } = await renderToString(
            <SuspenseApp>
                <CacheFromProp cache={cache} resource={resource} />
            </SuspenseApp>
        );
        expect(markup).toBe('<div data-reactroot="">Async resource</div>');
    });
    it('renders with fallback if timed out', async () => {
        const cache = createCache();
        const { resource } = getResource(10000);

        const { markup } = await renderToString(
            <SuspenseApp timeout={10}>
                <CacheFromProp cache={cache} resource={resource} />
            </SuspenseApp>
        );
        expect(markup).toBe('<div data-reactroot="">Loading...</div>');
    });

    it('can use a context to store the cache in order to serialize and later rehydrate it', async () => {
        // Server rendering part of test
        const expectedHtml = '<div data-reactroot="">Async resource</div>';
        const { resource, calls } = getResource();

        const { markup, cache } = await renderToString(
            <SuspenseApp>
                <CacheFromContext resource={resource} />
            </SuspenseApp>
        );
        expect(markup).toBe(expectedHtml);
        expect(calls.count).toBe(1);
        const serialized = cache.serialize();

        // Server rendering ends here, client part of the test starts
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual({
            'test-resource': {
                NO_KEY: {
                    error: null,
                    status: 2,
                    value: 'Async resource'
                }
            }
        });

        const rehydratedCache = createCache(deserialized);

        const { markup: rehydratedResult } = await renderToString(
            <PrimaryCacheContext.Provider value={rehydratedCache}>
                <SuspenseApp>
                    <CacheFromContext resource={resource} />
                </SuspenseApp>
            </PrimaryCacheContext.Provider>
        );

        expect(rehydratedResult).toBe(expectedHtml);
        expect(calls.count).toBe(1);
    });
});
