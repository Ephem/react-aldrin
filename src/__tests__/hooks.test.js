import React, { Suspense, forwardRef } from 'react';

import {
    useState,
    useReducer,
    useContext,
    useEffect,
    useLayoutEffect,
    useImperativeMethods,
    useRef,
    useCallback,
    useMemo
} from '../react/';
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
        it('useEffect should be noop', async () => {
            let called = false;
            const setCalled = () => (called = true);
            function App() {
                useEffect(() => {
                    setCalled();
                });
                return <div>It works!</div>;
            }
            const { html } = await renderToString(<App />);
            expect(html).toBe('<div data-reactroot="">It works!</div>');
            expect(called).toBe(false);
        });
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
        it('useCallback should return the function sent in but not call it', async () => {
            let called = false;
            const setCalled = () => (called = true);
            function App() {
                const cb = useCallback(setCalled);
                expect(cb).toBe(setCalled);
                return <div>It works!</div>;
            }
            const { html } = await renderToString(<App />);
            expect(html).toBe('<div data-reactroot="">It works!</div>');
            expect(called).toBe(false);
        });
        it('useMemo should work', async () => {
            const add = jest.fn((a, b) => a + b);
            function App() {
                const a = 1;
                const b = 2;
                const value = useMemo(() => add(a, b), [a, b]);

                let [state, setState] = useState('Initial');

                if (state === 'Initial') {
                    setState('Next');
                }

                return <div>{value}</div>;
            }
            const { html } = await renderToString(<App />);
            expect(html).toBe('<div data-reactroot="">3</div>');
            expect(add.mock.calls.length).toBe(1);
        });
        it('useRef should work', async () => {
            function App() {
                const [state, setState] = useState();
                const ref = useRef(0);

                if (ref.current === 0) {
                    ref.current += 1;
                    setState('New');
                }

                return <div>{ref.current}</div>;
            }
            const { html } = await renderToString(<App />);
            expect(html).toBe('<div data-reactroot="">1</div>');
        });
        it('useImperativeMethods should be noop', async () => {
            let called = false;
            const setCalled = () => {
                called = true;
                return { focus: () => {} };
            };
            function App() {
                return (
                    <div>
                        <InnerWithRef />
                    </div>
                );
            }
            function Inner() {
                const ref = useRef();
                useImperativeMethods(ref, setCalled);
                return <div ref={ref}>It works!</div>;
            }
            const InnerWithRef = forwardRef(Inner);
            const { html } = await renderToString(<App />);
            expect(html).toBe(
                '<div data-reactroot=""><div>It works!</div></div>'
            );
            expect(called).toBe(false);
        });
        it('useLayoutEffect should warn in dev and be noop', async () => {
            const oldEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            jest.spyOn(console, 'warn');
            console.warn.mockImplementation(() => {});
            let called = false;
            const setCalled = () => (called = true);
            function App() {
                useLayoutEffect(() => {
                    setCalled();
                });
                return <div>It works!</div>;
            }
            const { html } = await renderToString(<App />);
            expect(html).toBe('<div data-reactroot="">It works!</div>');
            process.env.NODE_ENV = oldEnv;
            await renderToString(<App />);
            expect(called).toBe(false);
            expect(console.warn.mock.calls.length).toBe(1);
            console.warn.mockRestore();
        });
    });
});

describe('Hooks in the browser', () => {
    describe('basic', () => {
        it('useState');
        it('useEffect');
        it('useContext');
    });
    describe('additional', () => {
        it('useReducer');
        it('useCallback');
        it('useMemo');
        it('useRef');
        it('useImperativeMethods');
        it('useLayoutEffect');
    });
});
