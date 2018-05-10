import React from 'react';
import { renderToStaticMarkupAsync } from './SSRRenderer';
import { MarkSSRDone } from './reactHelpers';

const Inner = () => (
    <span>
        Inner<MarkSSRDone />
    </span>
);

class App extends React.Component {
    state = { loaded: false };
    componentDidMount() {
        let self = this;
        setTimeout(() => this.setState({ loaded: true }), 1000);
    }
    render() {
        if (!this.state.loaded) {
            return null;
        }
        return <Inner />;
    }
}

renderToStaticMarkupAsync(<App />).then(markup => {
    console.log(markup);
});
