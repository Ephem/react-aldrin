'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class DispatcherModifier extends _react2.default.Component {
    constructor(...args) {
        super(...args);

        const currentDispatcher = _react2.default.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner.currentDispatcher;

        currentDispatcher.useEffect = () => undefined;
        currentDispatcher.useImperativeMethods = () => undefined;
        currentDispatcher.useCallback = cb => cb;
        currentDispatcher.useLayoutEffect = () => {
            if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
                console.warn('useLayoutEffect does nothing on the server, because its effect cannot ' + "be encoded into the server renderer's output format. This will lead " + 'to a mismatch between the initial, non-hydrated UI and the intended ' + 'UI. To avoid this, useLayoutEffect should only be used in ' + 'components that render exclusively on the client.');
            }
            return undefined;
        };
    }
    render() {
        return this.props.children;
    }
}
exports.default = DispatcherModifier; /**
                                       * Copyright (c) 2018-present, Fredrik Höglund
                                       *
                                       * This source code is licensed under the MIT license found in the
                                       * LICENSE file in the root directory of this source tree.
                                       */