import React from 'react';
import ReactDOM from 'react-dom';
import { createCache, PrimaryCacheContext } from './cache';

function removeCacheElement() {
    const cacheContainer = document.getElementById(
        'react_cache_data_container'
    );
    if (cacheContainer) {
        cacheContainer.parentNode.removeChild(cacheContainer);
    }
}

export function render(app, ...args) {
    const cache = createCache();
    return ReactDOM.render(
        <PrimaryCacheContext.Provider value={cache}>
            {app}
        </PrimaryCacheContext.Provider>,
        ...args
    );
}

export function hydrate(app, ...args) {
    let cache;
    if (window.__REACT_CACHE_DATA__) {
        cache = createCache(window.__REACT_CACHE_DATA__);
    } else {
        console.error(
            'Warning: Did not find any serialized cache-data, trying to hydrate with empty cache.'
        );
        cache = createCache();
    }
    removeCacheElement();
    return ReactDOM.hydrate(
        <PrimaryCacheContext.Provider value={cache}>
            {app}
        </PrimaryCacheContext.Provider>,
        ...args
    );
}
