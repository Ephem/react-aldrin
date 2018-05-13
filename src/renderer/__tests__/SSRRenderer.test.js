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
    it('should render input with defaultValue correctly', () => {
        expectMarkupToMatch(<input defaultValue="value" />);
    });
    it('should render input with defaultChecked correctly', () => {
        expectMarkupToMatch(<input defaultChecked={true} />);
    });
    it('should render textarea with defaultValue', () => {
        expectMarkupToMatch(<textarea defaultValue="Some text here" />);
    });
    it('should render textarea with defaultValue', () => {
        expectMarkupToMatch(<textarea defaultValue="Some text here" />);
    });
    it('should render select without value', () => {
        expectMarkupToMatch(<select value="value" />);
    });
    it('should render select without defaultValue', () => {
        expectMarkupToMatch(<select defaultValue="value" />);
    });
    it('should render select with correct selected option based on value', () => {
        expectMarkupToMatch(
            <select value="Option 2">
                <option>Option 1</option>
                <option>Option 2</option>
            </select>
        );
    });
    it('should render select with correct selected option based on defaultValue', () => {
        expectMarkupToMatch(
            <select value="Option 2">
                <option>Option 1</option>
                <option>Option 2</option>
            </select>
        );
    });
    it('should render select with correct selected multiple options', () => {
        expectMarkupToMatch(
            <select value={['Option 1', 'Option 3']}>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
            </select>
        );
    });
    it('should render select with correct selected multiple options based on value', () => {
        expectMarkupToMatch(
            <select value={['1', '3']}>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
                <option value="3">Option 3</option>
            </select>
        );
    });
});
