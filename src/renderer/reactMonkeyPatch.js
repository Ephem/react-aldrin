import React, { Component } from 'react';

const noopLifecycles = [
    'componentDidMount',
    'shouldComponentUpdate',
    'getSnapshotBeforeUpdate',
    'componentDidUpdate',
    'componentWillUpdate',
    'UNSAFE_componentWillUpdate',
    'componentWillReceiveProps',
    'UNSAFE_componentWillReceiveProps',
    'componentWillUnmount',
    'componentDidCatch'
];

const noopStaticLifecycles = [
    'getDerivedStateFromProps',
    'getDerivedStateFromError'
];

const noop = () => {};

// Component
const oldComponent = React.Component;
const oldPrototype = React.Component.prototype;

const newComp = function Component(props, context, updater) {
    noopLifecycles.forEach(lifecycleName => {
        if (this[lifecycleName]) {
            this[lifecycleName] = noop;
        }
    });
    noopStaticLifecycles.forEach(lifecycleName => {
        if (this.constructor[lifecycleName]) {
            delete this.constructor[lifecycleName];
        }
    });

    oldComponent.call(this, props, context, updater);
};

React.Component = newComp;
React.Component.prototype = oldPrototype;

// PureComponent
const oldPureComponent = React.PureComponent;
const oldPurePrototype = React.PureComponent.prototype;

const newPureComp = function PureComponent(props, context, updater) {
    noopLifecycles.forEach(lifecycleName => {
        if (this[lifecycleName]) {
            this[lifecycleName] = noop;
        }
    });
    noopStaticLifecycles.forEach(lifecycleName => {
        if (this.constructor[lifecycleName]) {
            delete this.constructor[lifecycleName];
        }
    });

    oldPureComponent.call(this, props, context, updater);
};

React.PureComponent = newPureComp;
React.PureComponent.prototype = oldPurePrototype;
