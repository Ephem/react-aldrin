import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { renderToString, renderToStaticMarkup } from '../SSRRenderer';

function expectMarkupToMatch(app) {
    expect(renderToStaticMarkup(app)).toBe(
        ReactDOMServer.renderToStaticMarkup(app)
    );
    expect(renderToString(app)).toBe(ReactDOMServer.renderToString(app));
}

describe('SSRRenderer', () => {
    it('should render an empty div', () => {
        expectMarkupToMatch(<div />);
    });
    it('should render a div with text content', () => {
        expectMarkupToMatch(<div>Some content</div>);
    });
    it('should render a div with literal text content', () => {
        expectMarkupToMatch(<div>{'Some content'}</div>);
    });
    it('should render a div with a nested span', () => {
        expectMarkupToMatch(
            <div>
                <span />
            </div>
        );
    });
    it('should render multiple text nodes correctly', () => {
        expectMarkupToMatch(
            <div>
                {'Text 1'}
                {'Text 2'}
                {'Text 3'}
            </div>
        );
    });
    it('should escape text correctly', () => {
        expectMarkupToMatch(<div>{`"&'<>`}</div>);
    });
    it('should render a div with a two nested span and text', () => {
        expectMarkupToMatch(
            <div>
                Outer text
                <span>Text 1</span>
                Outer text
                <span>Text 2</span>
                Outer text
            </div>
        );
    });
    it('should render multiple roots with array', () => {
        expectMarkupToMatch([<div key={1} />, <div key={2} />]);
    });
    it('should render multiple roots with fragment', () => {
        expectMarkupToMatch(
            <React.Fragment>
                <div />
                <div />
            </React.Fragment>
        );
    });
    it('should support self-closed tags', () => {
        expectMarkupToMatch(<input />);
    });
    it('should render with id', () => {
        expectMarkupToMatch(<div id="1" />);
    });
    it('should render with other attributes', () => {
        expectMarkupToMatch(<input type="button" value="Show" />);
    });
    it('should render with className', () => {
        expectMarkupToMatch(<div className="first second third" />);
    });
    it('should render with styles', () => {
        expectMarkupToMatch(
            <div style={{ color: 'red', display: 'inline-block' }} />
        );
    });
    it('should automatically insert px for correct styles', () => {
        expectMarkupToMatch(<div style={{ width: 10 }} />);
    });
    it('should not render with event listeners', () => {
        expectMarkupToMatch(<div onClick={() => {}} onclick="alert('Noo');" />);
    });
});
