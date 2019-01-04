import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { renderToString, renderToStaticMarkup } from '../SSRRenderer';

async function expectMarkupToMatch(app) {
    const staticOutput = renderToStaticMarkup(app);
    const output = renderToString(app);
    const expectedStatic = ReactDOMServer.renderToStaticMarkup(app);
    const expectedMarkup = ReactDOMServer.renderToString(app);
    expect((await staticOutput).markup).toBe(expectedStatic);
    expect((await output).markup).toBe(expectedMarkup);
}

describe('SSRRenderer', () => {
    it('should render an empty div', async () => {
        await expectMarkupToMatch(<div />);
    });
    it('should render a div with text content', async () => {
        await expectMarkupToMatch(<div>Some content</div>);
    });
    it('should render a div with literal text content', async () => {
        await expectMarkupToMatch(<div>{'Some content'}</div>);
    });
    it('should render a div with a nested span', async () => {
        await expectMarkupToMatch(
            <div>
                <span />
            </div>
        );
    });
    it('should render multiple text nodes correctly', async () => {
        await expectMarkupToMatch(
            <div>
                {'Text 1'}
                {'Text 2'}
                {'Text 3'}
            </div>
        );
    });
    it('should escape text correctly', async () => {
        await expectMarkupToMatch(<div>{`"&'<>`}</div>);
    });
    it('should render a div with a two nested span and text', async () => {
        await expectMarkupToMatch(
            <div>
                Outer text
                <span>Text 1</span>
                Outer text
                <span>Text 2</span>
                Outer text
            </div>
        );
    });
    it('should render multiple roots with array', async () => {
        await expectMarkupToMatch([<div key={1} />, <div key={2} />]);
    });
    it('should render multiple roots with fragment', async () => {
        await expectMarkupToMatch(
            <React.Fragment>
                <div />
                <div />
            </React.Fragment>
        );
    });
    it('should support self-closed tags', async () => {
        await expectMarkupToMatch(<input />);
    });
    it('should render with id', async () => {
        await expectMarkupToMatch(<div id="1" />);
    });
    it('should render with other attributes', async () => {
        await expectMarkupToMatch(<input type="button" value="Show" />);
    });
    it('should render with className', async () => {
        await expectMarkupToMatch(<div className="first second third" />);
    });
    it('should render with styles', async () => {
        await expectMarkupToMatch(
            <div style={{ color: 'red', display: 'inline-block' }} />
        );
    });
    it('should automatically insert px for correct styles', async () => {
        await expectMarkupToMatch(<div style={{ width: 10 }} />);
    });
    it('should not render with event listeners', async () => {
        jest.spyOn(console, 'error');
        console.error.mockImplementation(() => {});
        await expectMarkupToMatch(
            <div onClick={() => {}} onclick="alert('Noo');" />
        );
        console.error.mockRestore();
    });
    it('should render input with defaultValue correctly', async () => {
        await expectMarkupToMatch(<input defaultValue="value" />);
    });
    it('should render input with defaultChecked correctly', async () => {
        await expectMarkupToMatch(<input defaultChecked={true} />);
    });
    it('should render textarea with defaultValue', async () => {
        await expectMarkupToMatch(<textarea defaultValue="Some text here" />);
    });
    it('should render textarea with defaultValue', async () => {
        await expectMarkupToMatch(<textarea defaultValue="Some text here" />);
    });
    it('should render select without value', async () => {
        await expectMarkupToMatch(<select value="value" onChange={() => {}} />);
    });
    it('should render select without defaultValue', async () => {
        await expectMarkupToMatch(<select defaultValue="value" />);
    });
    it('should render select with correct selected option based on value', async () => {
        await expectMarkupToMatch(
            <select value="2" onChange={() => {}}>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
            </select>
        );
    });
    it('should render select with correct selected option based on defaultValue', async () => {
        await expectMarkupToMatch(
            <select defaultValue="Option 2">
                <option>Option 1</option>
                <option>Option 2</option>
            </select>
        );
    });
    it('should render select with correct selected multiple options', async () => {
        await expectMarkupToMatch(
            <select
                multiple
                value={['Option 1', 'Option 3']}
                onChange={() => {}}
            >
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
            </select>
        );
    });
    it('should render select with correct selected multiple options based on value', async () => {
        await expectMarkupToMatch(
            <select multiple value={['1', '3']} onChange={() => {}}>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
                <option value="3">Option 3</option>
            </select>
        );
    });
    it('should render with dangerouslySetInnerHTML', async () => {
        await expectMarkupToMatch(
            <div
                dangerouslySetInnerHTML={{
                    __html: '<span>Some text</span>'
                }}
            />
        );
    });
});
