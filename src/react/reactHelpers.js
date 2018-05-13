/**
 * Copyright (c) 2018-present, Fredrik Höglund
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { createCache } from './cache';

function noop() {}

export const SSRContext = React.createContext({
    markSSRDone: noop
});

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

export class SSRContextProvider extends React.Component {
    constructor(props) {
        super(props);

        let cache = createCache(noop);

        if (props.cacheData) {
            cache.deserialize(props.cacheData);
        }

        this.markSSRDone = () => {
            if (props.markSSRDone) {
                props.markSSRDone(cache);
            }
        };

        this.requestCounter = 0;
        this.state = {
            context: {
                increaseRequests: this.increaseRequests,
                decreaseRequests: this.decreaseRequests,
                markSSRDone: this.markSSRDone,
                cache
            }
        };
    }

    increaseRequests = () => {
        this.requestCounter += 1;
    };

    decreaseRequests = () => {
        this.requestCounter -= 1;
        if (this.requestCounter === 0) {
            this.markSSRDone(this.state.context.cache);
        }
    };

    render() {
        return (
            <SSRContext.Provider value={this.state.context}>
                {this.props.children}
            </SSRContext.Provider>
        );
    }
}

export class FetcherInner extends React.Component {
    constructor(props) {
        super(props);

        let data;
        let error;
        try {
            data = this.props.resource.get(
                this.props.cache,
                this.props.resourceKey
            );
        } catch (e) {
            error = e;
        }

        this.state = { isLoading: false, data, error };
    }
    componentDidMount() {
        if (!this.state.data && !this.state.isLoading) {
            this.setState({ isLoading: true }, () => {
                this.props.increaseRequests();
                let res;
                let error;
                try {
                    res = this.props.resource.read(
                        this.props.cache,
                        this.props.resourceKey
                    );
                } catch (e) {
                    error = e;
                }
                if (error) {
                    this.setState({ isLoading: false, error }, () => {
                        this.props.decreaseRequests();
                    });
                } else if (res instanceof Promise) {
                    res
                        .then(data => {
                            this.setState({ isLoading: false, data }, () => {
                                this.props.decreaseRequests();
                            });
                        })
                        .catch(error => {
                            this.setState({ isLoading: false, error }, () => {
                                this.props.decreaseRequests();
                            });
                        });
                } else if (res) {
                    this.setState({ isLoading: false, data: res }, () => {
                        this.props.decreaseRequests();
                    });
                }
            });
        }
    }
    render() {
        return this.props.children({
            data: this.state.data,
            error: this.state.error
        });
    }
}

export const Fetcher = React.forwardRef((props, ref) => (
    <SSRContext.Consumer>
        {({ cache, increaseRequests, decreaseRequests }) => (
            <FetcherInner
                {...props}
                cache={cache}
                increaseRequests={increaseRequests}
                decreaseRequests={decreaseRequests}
                ref={ref}
            />
        )}
    </SSRContext.Consumer>
));
