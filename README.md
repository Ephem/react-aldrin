# Experimental React Serverside Renderer

> Warning: This renderer does not aim to be a drop in replacement for the official React SSR renderer. Also, it might break when React is updated and will probably not be compatible with upcomming React APIs such as Suspense. View it as an experiment and use it at your own risk.

The official React renderer is a standalone implementation of React that for various reasons does not use the reconciler that the other renderers use. This project aims to implement a React serverside renderer on top of the reconciler as an experiment and learning experience.

Since the normal reconciler will be used, lifecycle events that are normally only called on the clientside (such as componentDidMount) will get called on the serverside using this renderer. The implication of this is that you will need to write your applications slightly different with this renderer and your existing applications will likely break if you try to use it.

Since the normal lifecycle events gets called and this renderer can re-render the application, this should also unlock some interesting patterns where serverside data-fetching could be baked into the applications, as opposed to having to happen before the rendering process.

Author: **Fredrik Höglund** [@EphemeralCircle](https://twitter.com/EphemeralCircle)
