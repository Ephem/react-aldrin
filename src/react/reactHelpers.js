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

        this.state = {
            context: {
                markSSRDone: this.markSSRDone,
                cache
            }
        };
    }

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

        let data = this.props.resource.get(
            this.props.cache,
            this.props.resourceKey
        );
        this.state = { isLoading: false, data };
    }
    componentDidMount() {
        if (!this.state.data && !this.state.isLoading) {
            this.setState({ isLoading: true });
            let res = this.props.resource.read(
                this.props.cache,
                this.props.resourceKey
            );
            if (res instanceof Promise) {
                res.then(data => this.setState({ isLoading: false, data }));
            } else if (res) {
                this.setState({ isLoading: false, data: res });
            }
        }
    }
    render() {
        return this.props.children(this.state.data);
    }
}

export const Fetcher = React.forwardRef((props, ref) => (
    <SSRContext.Consumer>
        {({ cache }) => <FetcherInner {...props} cache={cache} ref={ref} />}
    </SSRContext.Consumer>
));
