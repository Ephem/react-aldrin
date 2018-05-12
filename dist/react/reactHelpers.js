'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MarkSSRDone = exports.SSRContext = undefined;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function noop() {}

const SSRContext = exports.SSRContext = _react2.default.createContext(noop);

class CallDoneOnMount extends _react2.default.Component {
    componentDidMount() {
        this.props.done();
    }
    render() {
        return null;
    }
}

const MarkSSRDone = exports.MarkSSRDone = () => _react2.default.createElement(
    SSRContext.Consumer,
    null,
    markSSRDone => _react2.default.createElement(CallDoneOnMount, { done: markSSRDone })
);