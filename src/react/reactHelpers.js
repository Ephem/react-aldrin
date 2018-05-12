import React from 'react';

function noop() {}

export const SSRContext = React.createContext(noop);

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
        {markSSRDone => <CallDoneOnMount done={markSSRDone} />}
    </SSRContext.Consumer>
);
