# :moon: Aldrin - An Experimental React Suspense Serverside Renderer

> Note: This project has been successed by https://github.com/Ephem/react-lightyear

With a few important caveats, this project is a working serverside renderer for React, with out of the box support for Suspense data-fetching and hydration.

> :warning: This project is highly experimental and is not suitable for production use

> :warning: This project does not in any way represent future React-APIs, or how the new Fizz server renderer will work

[This blogpost](https://blogg.svt.se/svti/react-suspense-server-rendering/) contains some background on React Suspense and SSR.

## Usage

**Install**

```bash
npm install react-aldrin react@16.7.0-alpha.2 react-dom@16.7.0-alpha.2 --save
```

See [examples/basic](https://github.com/Ephem/react-aldrin/tree/master/examples/basic) for a full working example.

**Fetching data**

```jsx
import React from 'react';
import { createResource, useReadResource } from 'react-aldrin/react';

// Create a resource
const apiUrl = 'http://www.made-up-color-api.com/api/colors/';
const colorResource = createResource('colorResource', colorId =>
    fetch(apiUrl + colorId).then(res => res.text())
);

// This component would have to be wrapped in a
// <Suspense>-component from React
export default function Color({ colorId }) {
    // Read data from the resource, result is automatically cached
    const colorName = useReadResource(colorResource, colorId);

    return <p>This is a color: {colorName}</p>;
}
```

**Server rendering**

```jsx
// Import react-aldrin at the top for monkey-patching to work
import { renderToString } from 'react-aldrin';
import 'isomorphic-fetch';
import React from 'react';
import { App } from './App.js';

(...)

app.get('/', async (req, res) => {
    // Rendering is now async, need to wait for it
    const { markupWithCacheData } = await renderToString(<App />);

    // In this case we are using "markupWithCacheData" which already
    // contains the dehydrated data from the data fetching
    res.render('index', { markupWithCacheData });
});
```

**Hydrate on the client**

```jsx
import { hydrate } from 'react-aldrin/react';
import { App } from './App.js';

// Using hydrate from this package will automatically
// hydrate cache data as well as markup
hydrate(<App />, document.getElementById('react-app'));
```

That's it! You can fetch data as deep in the component tree as you want and it will automatically be fetched within a single render pass and de/rehydrated to the client for you. No more hoisting data dependencies to the route-level (like in Next.js) or double-rendering (like in Apollo).

## :warning: Caveats and limitations

This renderer is built on top of the React Reconciler, as opposed to the official serverside renderer which is a complete standalone implementation. This has a few important implications:

*   In many respects this renderer behaves as if it was a client-renderer!
    *   :open_mouth: Both hooks and lifecycles would normally behave as on the client..
    *   :see_no_evil: ..but these have been monkey patched to not do so
    *   :exclamation: Make sure you import `react-aldrin` at the very start of your application for monkey patching to work
*   Performance is (probably) not what it should be
*   Streaming is impossible
*   Etc..

There are also tons of other unsolved problems and limitations:

*   Cache invalidation strategies
*   Multiple roots sharing a cache
*   Only supports version `16.7.0-alpha.2`
*   Is likely to break with future React updates
*   Built on ugly hacks (secret internals and monkey patching), likely to be buggy

Finally, this renderer only aim to explore possible future code patterns, not any other of the exciting stuff which the React team is also working on, like improved streaming rendering, partial hydration etc! :tada:

> This is not a serious attempt at building a stable renderer, the aim is simply to explore what code patterns _could possibly_ look like with Suspense+SSR.

## API

This package is split into two parts, `react-aldrin` contains the server renderer and `react-aldrin/react` contains helpers for React.

### `react-aldrin`

#### `renderToString(element)`

Asyncronously render a React element to its initial HTML.

Automatically wraps the `element` in a `<PrimaryCacheContext.Provider>` so resources can be used.

**Returns**

This function will return a Promise which resolves to:

```
{
    markup,               // Markup
    markupWithCacheData,  // Markup which includes serialized cache-data
    cache                 // The cache
}
```

#### `renderToStaticMarkup(element)`

Asyncronously render the element to its initial HTML, but without the extra DOM attributes that React uses internally. Since it's not meant to hydrate, this never includes serialized cache-data (though you could do that yourself if needed).

Automatically wraps the `element` in a `<PrimaryCacheContext.Provider>` so resources can be used.

**Returns**

This function will return a Promise which resolves to:

```
{
    markup,  // Markup
    cache    // The cache
}
```

### `react-aldrin/react`

#### `render(element, container[, callback])`

This proxies to the original `ReactDOM.render`.

Automatically wraps the `element` in a `<PrimaryCacheContext.Provider>` so resources can be used. This means it is possible to use this package without the server renderer-part if you would want to.

#### `hydrate(element, container[, callback])`

This proxies to the original `ReactDOM.hydrate`, but it first hydrates the cache-data included in `markupWithCacheData` from `renderToString` and removes it from the DOM to avoid a hydration mismatch.

Automatically wraps the `element` in a `<PrimaryCacheContext.Provider>` so resources can be used.

#### `createResource(resourceName, loadResource[, hash])`

1.  `resourceName` must be a unique name and the same when the server and client renders
2.  `loadResource` is a function that takes an optional `key` as argument and returns a Promise which resolves to data, that is, the function that should be called to load the resource
3.  `hash` is an optional function that is used to hash the `key` used to load some specific data before it is placed in the cache, useful if you want to use keys that are not serializeable by default

**Returns**

A `resource`, see below.

#### `resource`

This represents a resource. It is not meant to be used directly, but instead by passing it into the hook `useReadResource(resource, key)`. You can interact with it directly via a couple of functions by passing in a manually created cache, but this is currently undocumented.

#### `useReadResource(resource, key)`

This is a React-hook that reads from the resource, passing in `key` as argument. Directly returns the data for `key` if it is cached, throws data fetching-Promise and lets React re-render at a later point if data is not in cache. Uses `PrimaryCacheContext` behind the scenes.

#### `PrimaryCacheContext`, `createCache([initialData])` and `cache`

These are available for advanced behaviours like using multiple caches or taking care of cache-serialization and hydration yourself, but they are currently undocumented. This package and its examples are currently focused on showing off the easiest possible and most magical of worlds. :sparkles: :crystal_ball: :sparkles:

## Todo

This list is really incomplete, but I thought I'd list at least a couple of things:

*   Bigger and better examples
*   :white_check_mark:~~Safer serialization of data~~
*   More tests
*   Code cleanup
*   Better build/project setup
*   Better support for preloading, cache invalidation and a bunch of other stuff
*   Documenting currently undocumented APIs
*   Document experiments and lessons learned

Just to be clear, I view this as an experiment and have no ambition to make it production ready. Even so, if you think it's fun, feel free to contribute, open issues or chat me up for a discussion. :smile: :envelope:

I'd also love to hear from you if you experiment with it! :love_letter:

## Acknowledgements

A lot of the code and ideas here are shamelessly borrowed directly from React and the React-team. Thank you so much for all your hard work! :clap: :100:

---

Because it's really important, here is a final disclaimer:

> :warning: This project does not in any way represent future React-APIs, or how the new Fizz server renderer will work

If you do experiment with this, make sure you include similar disclaimers to avoid any fear, uncertainty and doubt.
