import React, { Suspense } from 'react';
//import ReactDOMServer from 'react-dom/server';
//import { renderToString, renderToStaticMarkup } from '../SSRRenderer';
import { createRoot } from './src/renderer/SSRRenderer';
import { createResource, createCache } from './src/react/cache';

const cache = createCache();

const mockResource = createResource(
    'mock',
    () => {
        return new Promise(resolve => {
            setTimeout(() => resolve('Text2'), 3000);
        });
    },
    undefined,
    true
);

const Inner = () => {
    const text = mockResource.read(cache);
    return <div>{text}</div>;
};

const FirstInner = () => (
    <Suspense ms={5000} fallback={'Loading...'}>
        <Inner />
    </Suspense>
);

const App = () => {
    return (
        <div>
            <FirstInner />
        </div>
    );
};

async function render() {
    let root = createRoot();
    let startTime = Date.now();
    console.log('Start');
    await root.render(<App />).then(({ html }) => {
        console.log('Render took', Date.now() - startTime);
        console.log('HTML', html);
    });
}

render();
