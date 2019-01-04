import React, { Suspense, useState } from 'react';
import { renderToString } from './src/renderer/SSRRenderer';
import { createResource, createCache } from './src/react/cache';

const cache = createCache();

const mockResource = createResource('mock', () => {
    return new Promise(resolve => {
        setTimeout(() => resolve('Text2'), 3000);
    });
});

const Inner = () => {
    const text = mockResource.read(cache);
    return <div>{text}</div>;
};

const FirstInner = () => {
    const [state, setState] = useState('Loading...');
    return (
        <Suspense maxDuration={5000} fallback={state}>
            <Inner />
        </Suspense>
    );
};

const App = () => {
    return (
        <div>
            <FirstInner />
        </div>
    );
};

function render() {
    let startTime = Date.now();
    console.log('Start');
    renderToString(<App />).then(({ markup }) => {
        console.log('Render took', Date.now() - startTime);
        console.log('HTML', markup);
    });
}

render();
