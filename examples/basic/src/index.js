import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';

import {
    createResource,
    createCache,
    useContext,
    PrimaryCacheContext
} from '../../../src/react';

const catFacts = createResource('catFacts', () =>
    fetch('https://cat-fact.herokuapp.com/facts/random').then(res => res.json())
);

function CatFact() {
    const cache = useContext(PrimaryCacheContext);
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
    const cache = createCache(window.CACHE_DATA);

    ReactDOM.hydrate(
        <PrimaryCacheContext.Provider value={cache}>
            <App />
        </PrimaryCacheContext.Provider>,
        document.getElementById('react-app')
    );
}

module.exports = {
    App
};
