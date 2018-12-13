import 'isomorphic-fetch';

import path from 'path';

import React from 'react';
import express from 'express';

import { renderToString } from '../../src/renderer';
import { createCache } from '../../src/react';
import { App, CacheContext } from './src';

const app = express();
const port = 3000;

const createHtml = (markup, cache) => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
</head>

<body>
  <div id="react-app">${markup}</div>
  <script>window.CACHE_DATA = ${cache}</script>
  <script src="main.js"></script>
</body>

</html>
`;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', async (req, res) => {
    const cache = createCache();
    const { html } = await renderToString(
        <CacheContext.Provider value={cache}>
            <App />
        </CacheContext.Provider>
    );
    res.send(createHtml(html, cache.serialize()));
});

app.listen(port, () =>
    console.log(`Basic example app listening on port ${port}!`)
);
