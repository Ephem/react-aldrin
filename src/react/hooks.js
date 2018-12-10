import {
    useEffect as reactUseEffect,
    useLayoutEffect as reactUseLayoutEffect,
    useImperativeMethods as reactUseImperativeMethods,
    useCallback as reactUseCallback
} from 'react';

export { useState } from 'react';
export { useReducer } from 'react';
export { useContext } from 'react';
export { useRef } from 'react';
export { useMemo } from 'react';

function isNode() {
    return (
        typeof process !== 'undefined' &&
        typeof process.release !== 'undefined' &&
        process.release.name === 'node'
    );
}

export function useEffect(...args) {
    if (isNode()) {
        return undefined;
    }
    return reactUseEffect(...args);
}

export function useLayoutEffect(...args) {
    if (isNode()) {
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
    }
    return reactUseLayoutEffect(...args);
}

export function useImperativeMethods(...args) {
    if (isNode()) {
        return undefined;
    }
    return reactUseImperativeMethods(...args);
}

export function useCallback(cb, ...rest) {
    if (isNode()) {
        return cb;
    }
    return reactUseCallback(cb, ...rest);
}
