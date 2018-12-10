import React, { Suspense, useState, useReducer, useContext } from 'react';

import { renderToString } from '../renderer/SSRRenderer';
import { createResource, createCache } from '../react/cache';

const CacheContext = React.createContext();

const getResource = (timeout = 10, value = 'Async resource') => {
    let calls = { count: 0 };
    return {
        calls,
        resource: createResource(
            'test-resource',
            () => {
                calls.count += 1;
                return new Promise(resolve => {
                    setTimeout(() => resolve(value), timeout);
                });
            },
            undefined,
            true
        )
    };
};

const CacheFromProp = ({ cache, resource }) => {
    const text = resource.read(cache);
    return text;
};

const CacheFromContext = ({ resource }) => {
    const cache = useContext(CacheContext);
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

        const { html } = await renderToString(
            <SuspenseApp>
                <CacheFromProp cache={cache} resource={resource} />
            </SuspenseApp>
        );
        expect(html).toBe('<div data-reactroot="">Async resource</div>');
    });
    it('renders with fallback if timed out', async () => {
        const cache = createCache();
        const { resource } = getResource(10000);

        const { html } = await renderToString(
            <SuspenseApp timeout={10}>
                <CacheFromProp cache={cache} resource={resource} />
            </SuspenseApp>
        );
        expect(html).toBe('<div data-reactroot="">Loading...</div>');
    });

    it('can use a context to store the cache in order to serialize and later rehydrate it', async () => {
        // Server rendering part of test
        const expectedHtml = '<div data-reactroot="">Async resource</div>';
        const cache = createCache();
        const { resource, calls } = getResource();

        const { html } = await renderToString(
            <CacheContext.Provider value={cache}>
                <SuspenseApp>
                    <CacheFromContext resource={resource} />
                </SuspenseApp>
            </CacheContext.Provider>
        );
        expect(html).toBe(expectedHtml);
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

        const rehydratedCache = createCache();
        rehydratedCache.deserialize(deserialized);

        const rehydratedResult = await renderToString(
            <CacheContext.Provider value={rehydratedCache}>
                <SuspenseApp>
                    <CacheFromContext resource={resource} />
                </SuspenseApp>
            </CacheContext.Provider>
        );

        expect(rehydratedResult.html).toBe(expectedHtml);
        expect(calls.count).toBe(1);
    });
});
