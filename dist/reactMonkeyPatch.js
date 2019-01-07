'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const noopLifecycles = ['componentDidMount', 'shouldComponentUpdate', 'getSnapshotBeforeUpdate', 'componentDidUpdate', 'componentWillUpdate', 'UNSAFE_componentWillUpdate', 'componentWillReceiveProps', 'UNSAFE_componentWillReceiveProps', 'componentWillUnmount', 'componentDidCatch'];

const noopStaticLifecycles = ['getDerivedStateFromProps', 'getDerivedStateFromError'];

const noop = () => {};

// Component
const oldComponent = _react2.default.Component;
const oldPrototype = _react2.default.Component.prototype;

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

_react2.default.Component = newComp;
_react2.default.Component.prototype = oldPrototype;

// PureComponent
const oldPureComponent = _react2.default.PureComponent;
const oldPurePrototype = _react2.default.PureComponent.prototype;

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

_react2.default.PureComponent = newPureComp;
_react2.default.PureComponent.prototype = oldPurePrototype;