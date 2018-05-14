# Experimental React Serverside Renderer

The official React renderer is a standalone implementation of React that for various (good) reasons does not use the reconciler that the other renderers use. This project ignores those reasons and aims to implement a React serverside renderer on top of the reconciler as an experiment and learning experience.

> Warning: I built this as an experiment and learning experience, code isn't cleaned up, it is missing a lot of validations and error messages and probably has tons of bugs (file issues!). It is not ready for production use and will contain breaking changes in minor releases.

> Warning: This renderer does not aim to be a drop-in replacement for the official React SSR renderer. Also, it might break when React is updated and might not be compatible with upcoming React APIs.

> Note: This renderer calls all the lifecycle-hooks serverside, not just `componentWillMount`.

> Last Note! All that aside, this is really fun stuff to play with if you're into serverside rendering with React, so I encourage you to try it out and play around with it! :)

## Idea

Using the normal reconciler, lifecycle events that are normally only called on the clientside (such as `componentDidMount`) will get called on the serverside using this renderer (this means your apps will probably break if you just switch this in). This in combination with a function injected into the React-context called `markSSRDone` let's this renderer support asynchronous server-rendering via `renderToStringAsync`.

This feature is currently _not_ achieved with Suspense, but instead happens the same way as it does on the client today, via re-rendering changed parts until `markSSRDone` gets called. With some modifications it should be able to support Suspense when it is released properly.

Accompanying the renderer are some React-helpers that can be used to simplify data-fetching that works both on the server and client, with support for de/rehydration of data between them. This is based on the `simple-cache-provider` that is the reference implementation for how fetching will most likely work with Suspense. You can also use the helper-component `<MarkSSRDone />` or implement these things yourself using the low-level API.

If you want more background about my motivation, I recommend this blogpost: [React suspense and server rendering](https://blogg.svt.se/svti/react-suspense-server-rendering/)

## Usage

No npm-package yet, so if you want to play around with this, either clone it or npm-install it directly from GitHub.

### Synchronous rendering

```
import { renderToString, renderToStaticMarkup } from 'react-ssr-renderer';
import App from './App';

let markup = renderToString(<App />);
// OR:
// let markup = renderToStaticMarkup(<App />);

// Do something with markup
```

Besides watching all those lifecycle-hooks get called on the server this is not that exciting honestly, so lets dive into the next part.

### Asynchronous rendering

```
// This works with renderToStaticMarkupAsync as well
import { renderToStringAsync } from 'react-ssr-renderer';
import { SSRContextProvider } from 'react-ssr-renderer/react';
import App from './App';

renderToStringAsync(<App />, SSRContextProvider).then(({ html, cache }) => {
    const cacheAsString = cache.serialize();
    // Do something with html and cacheAsString
});
```

There is a caveat with the above. Somewhere in your app, you have to call `markSSRDone` in order to tell the renderer that the app has finished rendering, else the promise will never resolve. This is not optimal, but thankfully there are several ways to do this which will be described next.

#### MarkSSRDone-component

The `<MarkSSRDone />`-component is the fastest way to get started, its only purpose is to call `markSSRDone`.

```
import { MarkSSRDone } from 'react-ssr-renderer/react';

export default const ComponentThatWillGetRenderedLast = () => {
    return (
        <div>
            <p>When this component renders, you happen to know the app has finished rendering</p>
            <MarkSSRDone />
        </div>
    );
}
```

#### Low-level API

The best way to describe the low-level API is to look at how the `<MarkSSRDone />`-component is implemented:

```
import { SSRContext } from 'react-ssr-renderer/react';

class CallDoneOnMount extends React.Component {
    componentDidMount() {
        this.props.done();
    }
    render() {
        return null;
    }
}

export const MarkSSRDone = () => (
    <SSRContext.Consumer>
        {({ markSSRDone }) => <CallDoneOnMount done={markSSRDone} />}
    </SSRContext.Consumer>
);
```

By using the `<SSRContext.Consumer>` yourself you can get a hold of the `markSSRDone`-function. When you call this, the current tree gets flushed and the rendering-promise resolves. You can provide `markSSRDone` with a cache-parameter that will be available when the promise resolves: `markSSRDone(myCache);`.

#### Fetcher

Most asynchronous work inside the rendering process on the server are usually API-calls to external APIs. If we keep track of the number of active requests, we can safely assume that rendering is done when all of them come back and the component-tree has been updated without triggering any new ones. This is exactly what the `<Fetcher>`-component does.

It's not enough that we are able to trigger and use these API-calls on the server, we also need to send that data to the client in the html, so it can reuse the data without making new requests. The `<Fetcher>`-component does this for you in combination with `createResource`, modified from Reacts experimental `simple-cache-provider`.

```
import axios from 'axios';
import { Fetcher, createResource } from 'react-ssr-renderer/react';

const foodResource = createResource('foodResource', (type) => {
    // This function can be any promise
    return axios
            .get('http://made-up-url.top/api/recipes?type=' + type)
            .then((response) => {
                // Make sure you only return the part you want cached
                return response.data
            });
});

const RecipePresenter = ({ recipe, error }) => {
    if (error) {
        return <Error error={error} />
    }
    if (!data) {
        return <Spinner />;
    }
    return <div>{recipe}</div>;
}

const Recipe = ({ type }) => {
    return (
        <Fetcher resource={foodResource} resourceKey={type}>
            {({ data, error }) => <RecipePresenter recipe={data} error={error} />}
        </Fetcher>
    );
}
```

If you use this `<Fetcher>` for all your data-loading, `markSSRDone` will get called automatically when all requests are done.

> Caveat: In the example above, type happens to be a string. This is used as a key in the cache, so if you need to use complex objects as your resourceKey, you need to provide a hash-function as the third argument to `createResource` that creates a string from your arguments. `JSON.stringify` often works for plain objects, but it creates large keys in the cache that needs to get sent down to the client, so you probably want to actually provide a real hash-function..

Lets revisit the asynchronous example from before:

```
renderToStringAsync(<App />, SSRContextProvider).then(({ html, cache }) => {
    const cacheAsString = cache.serialize();
    // It is now up to you to place `cacheAsString` in the html
    // that gets sent down to the client so it can be rehydrated.
});
```

The `cache` in this example is provided automatically if you use `<Fetcher>`. We need to do one last thing to connect the dots, rehydrating the data on the client:

```
import React from 'react';
import ReactDOM from 'react-dom';
import { SSRContextProvider } from 'react-ssr-renderer/react';

ReactDOM.render(
    <SSRContextProvider cacheData={window.cacheData}>
        <App />
    </SSRContextProvider>
, document.getElementById('root'));
```

On the server the app gets wrapped in `<SSRContextProvider>` automatically when you use `renderToStringAsync`, but on the client you need to do this yourself if you want to rehydrate a cache. Change `window.cacheData` above to wherever you placed your cached data in the previous step.

> Note: All the functionality for the Fetcher is based only on the `markSSRDone`-function, you could implement your own fetchers with request-counting and a cache from scratch if you wanted to.

## Todo

This section could be very long, so I'll just mention a few things:

*   Clean up the code (you know, naming, structure, comments and stuff)..
*   A lot of validation and warnings
*   A lot of edgecases in the renderer
*   A lot more testing, both:
    *   More Jest-tests
    *   Trying the whole thing out in larger projects. I have currently only tested the application in quite small settings.
*   Better documentation
*   Finding a better name
*   Publishing a npm-package (or splitting it into two separate packages)
*   Performance tests

Just to be clear, I view this as an experiment and have no ambition to make it production ready. Even so, if you think it's fun, feel free to contribute, open issues or chat me up for a discussion. :)

## Acknowledgements

*   Thanks to the React-team for all your hard work and for being so approachable, a lot of code is shamelessly borrowed from the React-project
*   Thanks to [jiayihu](https://github.com/jiayihu) for [react-tiny-dom](https://github.com/jiayihu/react-tiny-dom), it was very helpful in understanding the reconciler host-config
*   Thanks to [nitin42](https://github.com/nitin42) for the tutorial [Making-a-custom-React-renderer](https://github.com/nitin42/Making-a-custom-React-renderer) which was equally helpful
*   Thanks most of all my wife, for having patience with me when I get fixated on weird ideas..

## Author

Fredrik Höglund ([@EphemeralCircle](https://twitter.com/EphemeralCircle))

> Note: I'll be at React Europe, feel free to get in touch if you want to grab a coffee!
