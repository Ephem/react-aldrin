import React, { forwardRef } from 'react';
import { render as testRender } from 'react-testing-library';

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

function render(...args) {
    delete process.release.name;
    const res = testRender(...args);
    process.release.name = 'node';
    return res;
}

describe('SSRRenderer', () => {
    describe('basic hooks', () => {
        it('renders useState', async () => {
            function App({ initialState }) {
                const [state, setState] = useState(initialState);
                return <div>{state}</div>;
            }
            const app = <App initialState="It works!" />;
            const { markup } = await renderToString(app);
            expect(markup).toBe('<div data-reactroot="">It works!</div>');

            // Browser test
            const { getByText } = render(app);
            getByText('It works!');
        });
        it('useEffect should be noop on server', async () => {
            const setCalled = jest.fn();
            function App() {
                useEffect(() => {
                    setCalled();
                });
                return <div>It works!</div>;
            }
            const app = <App />;
            const { markup } = await renderToString(<App />);
            expect(markup).toBe('<div data-reactroot="">It works!</div>');
            expect(setCalled).not.toBeCalled();

            // Browser test
            const { getByText, rerender } = render(app);
            getByText('It works!');
            rerender(app);
            expect(setCalled).toBeCalled();
        });
        it('useContext', async () => {
            const Context = React.createContext('Default');
            function App() {
                const contextValue = useContext(Context);
                return <div>{contextValue}</div>;
            }
            const app = (
                <Context.Provider value="Correct">
                    <App />
                </Context.Provider>
            );
            const { markup } = await renderToString(app);
            expect(markup).toBe('<div data-reactroot="">Correct</div>');

            // Browser test, mock console.error to avoid error about using Context in two renderers
            jest.spyOn(console, 'error');
            console.error.mockImplementation(() => {});
            const { getByText } = render(app);
            console.error.mockRestore();
            getByText('Correct');
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
            const app = <App initialState="It works!" />;
            const { markup } = await renderToString(app);
            expect(markup).toBe(
                '<div data-reactroot="">This is what should show</div>'
            );

            // Browser test
            const { getByText } = render(app);
            getByText('This is what should show');
        });
        it('useCallback should return the function sent in on server', async () => {
            const setCalled = jest.fn();
            function App() {
                const cb = useCallback(setCalled);
                expect(cb).toBe(setCalled);
                return <div>It works!</div>;
            }
            const { markup } = await renderToString(<App />);
            expect(markup).toBe('<div data-reactroot="">It works!</div>');
            expect(setCalled).not.toBeCalled();
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
            const { markup } = await renderToString(<App />);
            expect(markup).toBe('<div data-reactroot="">3</div>');
            expect(add).toHaveBeenCalledTimes(1);

            // Browser test
            const { getByText } = render(<App />);
            getByText('3');
            expect(add).toHaveBeenCalledTimes(2);
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
            const { markup } = await renderToString(<App />);
            expect(markup).toBe('<div data-reactroot="">1</div>');

            // Browser test
            const { getByText } = render(<App />);
            getByText('1');
        });
        it('useImperativeMethods should be noop on the server', async () => {
            const setCalled = jest.fn(() => ({ focus: () => {} }));
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
            const { markup } = await renderToString(<App />);
            expect(markup).toBe(
                '<div data-reactroot=""><div>It works!</div></div>'
            );
            expect(setCalled).not.toBeCalled();

            // Browser test
            const { getByText } = render(<App />);
            getByText('It works!');
            expect(setCalled).toHaveBeenCalledTimes(1);
        });
        it('useLayoutEffect should warn in dev and be noop on server', async () => {
            const oldEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            jest.spyOn(console, 'warn');
            console.warn.mockImplementation(() => {});
            const setCalled = jest.fn();
            function App() {
                useLayoutEffect(() => {
                    setCalled();
                });
                return <div>It works!</div>;
            }
            const app = <App />;
            const { markup } = await renderToString(app);
            expect(markup).toBe('<div data-reactroot="">It works!</div>');
            process.env.NODE_ENV = oldEnv;
            await renderToString(app);
            expect(setCalled).not.toBeCalled();
            expect(console.warn).toHaveBeenCalledTimes(1);

            // Browser test
            const { getByText, rerender } = render(app);
            getByText('It works!');
            rerender(app);
            expect(setCalled).toHaveBeenCalledTimes(1);
            expect(console.warn).toHaveBeenCalledTimes(1);

            console.warn.mockRestore();
        });
    });
});
