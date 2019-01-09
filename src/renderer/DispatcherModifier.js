/**
 * Copyright (c) 2018-present, Fredrik Höglund
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

export default class DispatcherModifier extends React.Component {
    constructor(...args) {
        super(...args);

        const currentDispatcher =
            React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
                .ReactCurrentDispatcher.current;

        currentDispatcher.useEffect = () => undefined;
        currentDispatcher.useImperativeMethods = () => undefined;
        currentDispatcher.useCallback = cb => cb;
        currentDispatcher.useLayoutEffect = () => {
            if (
                process.env.NODE_ENV === 'development' ||
                process.env.NODE_ENV === 'dev'
            ) {
                console.warn(
                    'useLayoutEffect does nothing on the server, because its effect cannot ' +
                        "be encoded into the server renderer's output format. This will lead " +
                        'to a mismatch between the initial, non-hydrated UI and the intended ' +
                        'UI. To avoid this, useLayoutEffect should only be used in ' +
                        'components that render exclusively on the client.'
                );
            }
            return undefined;
        };
    }
    render() {
        return this.props.children;
    }
}
