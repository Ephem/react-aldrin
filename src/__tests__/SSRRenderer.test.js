import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { renderToStaticMarkup } from '../SSRRenderer';

function expectStaticMarkupToMatch(app) {
    expect(renderToStaticMarkup(app)).toBe(
        ReactDOMServer.renderToStaticMarkup(app)
    );
}

describe('SSRRenderer', () => {
    describe('renderToStaticMarkup', () => {
        it('should render an empty div', () => {
            expectStaticMarkupToMatch(<div />);
        });
        it('should render a div with text content', () => {
            expectStaticMarkupToMatch(<div>Some content</div>);
        });
        it('should render a div with literal text content', () => {
            expectStaticMarkupToMatch(<div>{'Some content'}</div>);
        });
        it('should render a div with a nested span', () => {
            expectStaticMarkupToMatch(
                <div>
                    <span />
                </div>
            );
        });
        it('should render a div with a two nested span and text', () => {
            expectStaticMarkupToMatch(
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
            expectStaticMarkupToMatch([<div key={1} />, <div key={2} />]);
        });
        it('should render multiple roots with fragment', () => {
            expectStaticMarkupToMatch(
                <React.Fragment>
                    <div />
                    <div />
                </React.Fragment>
            );
        });
        it('should support self-closed tags', () => {
            expectStaticMarkupToMatch(<input />);
        });
        it('should render with id', () => {
            expectStaticMarkupToMatch(<div id="1" />);
        });
        it('should render with other attributes', () => {
            expectStaticMarkupToMatch(<input type="button" value="Show" />);
        });
        it('should render with className', () => {
            expectStaticMarkupToMatch(<div className="first second third" />);
        });
        it('should render with styles', () => {
            expectStaticMarkupToMatch(
                <div style={{ color: 'red', display: 'inline-block' }} />
            );
        });
        it('should automatically insert px for correct styles', () => {
            expectStaticMarkupToMatch(<div style={{ width: 10 }} />);
        });
        it('should not render with event listeners', () => {
            expectStaticMarkupToMatch(
                <div onClick={() => {}} onclick="alert('Noo');" />
            );
        });
    });
});
