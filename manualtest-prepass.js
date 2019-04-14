import React, { Suspense, useState, useEffect } from 'react';
import { renderPrepass } from './src/renderer/PrePassRenderer';
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

    // Effect should not be fired
    useEffect(() => console.log('Effect!'));

    return (
        <Suspense maxDuration={5000} fallback={state}>
            <Inner />
        </Suspense>
    );
};

class App extends React.Component {
    componentDidMount() {
        // componentDidMount should not be called
        console.log('Mount');
    }
    render() {
        return (
            <div>
                <FirstInner />
            </div>
        );
    }
}

function render() {
    let startTime = Date.now();
    console.log('Start');
    renderPrepass(<App />).then(() => {
        console.log('Render took', Date.now() - startTime);
        console.log('Cache', cache.serialize());
    });
}

render();
