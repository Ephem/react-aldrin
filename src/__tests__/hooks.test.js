import React, { useState, useReducer, useContext } from 'react';

import { renderToString } from '../renderer/SSRRenderer';

describe('SSRRenderer', () => {
    describe('basic hooks', () => {
        it('renders useState', async () => {
            function App({ initialState }) {
                const [state, setState] = useState(initialState);
                return <div>{state}</div>;
            }
            const { html } = await renderToString(
                <App initialState="It works!" />
            );
            expect(html).toBe('<div data-reactroot="">It works!</div>');
        });
        it('useEffect');
        it('useContext', async () => {
            const Context = React.createContext('Default');
            function App() {
                const contextValue = useContext(Context);
                return <div>{contextValue}</div>;
            }
            const { html } = await renderToString(
                <Context.Provider value="Correct">
                    <App />
                </Context.Provider>
            );
            expect(html).toBe('<div data-reactroot="">Correct</div>');
        });
    });

    describe('additional hooks', () => {
        it('renders useReducer', async () => {
            const reducer = (state, action) => {
                return 'This is what should show';
            };
            function App({ initialState }) {
                const [state, setState] = useReducer(
                    reducer,
                    initialState,
                    'fakeAction'
                );
                return <div>{state}</div>;
            }
            const { html } = await renderToString(
                <App initialState="It works!" />
            );
            expect(html).toBe(
                '<div data-reactroot="">This is what should show</div>'
            );
        });
        it('useCallback');
        it('useMemo');
        it('useRef');
        it('useImperativeMethods');
        it('useLayoutEffect');
    });
});
