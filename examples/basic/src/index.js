import React, { Suspense, createContext } from 'react';
import ReactDOM from 'react-dom';

import { createResource, createCache, useContext } from '../../../src/react';

const CacheContext = createContext();

const catFacts = createResource('catFacts', () =>
    fetch('https://cat-fact.herokuapp.com/facts/random').then(res => res.json())
);

function CatFact() {
    const cache = useContext(CacheContext);
    const fact = catFacts.read(cache);

    return <p>Random cat fact: {fact.text}</p>;
}

function App() {
    return (
        <div>
            <Suspense fallback={'Loading...'}>
                <CatFact />
            </Suspense>
        </div>
    );
}

if (typeof window !== 'undefined') {
    const cacheData = window.CACHE_DATA;
    const cache = createCache();
    cache.deserialize(cacheData);

    ReactDOM.hydrate(
        <CacheContext.Provider value={cache}>
            <App />
        </CacheContext.Provider>,
        document.getElementById('react-app')
    );
}

module.exports = {
    App,
    CacheContext
};
