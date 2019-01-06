import React, { Suspense } from 'react';
import { hydrate, createResource, useReadResource } from '../../../src/react';

const colorResource = createResource('colorResource', colorId =>
    fetch(`http://localhost:3000/api/colors/${colorId}`).then(res => res.text())
);

function Color({ colorId }) {
    const colorName = useReadResource(colorResource, colorId);

    return <p>This is a color: {colorName}</p>;
}

function App() {
    return (
        <Suspense fallback={'Loading...'}>
            <Color colorId="1" />
            <Color colorId="2" />
            <Color colorId="3" />
        </Suspense>
    );
}

if (typeof window !== 'undefined') {
    hydrate(<App />, document.getElementById('react-app'));
}

module.exports = {
    App
};
