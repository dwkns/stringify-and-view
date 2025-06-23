/*
 * Test suite for json-viewer.js
 *
 * Covers:
 *   - Rendering of basic and special JSON values
 *   - UI controls and interactivity
 *   - Edge cases and API usage
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import jsonViewer from './json-viewer.js';

// Helper to extract HTML from the viewer
function getViewerHTML(json, options = {}) {
  return jsonViewer(json, options);
}

describe('json-viewer', () => {
  let dom;
  let container;

  beforeEach(async () => {
    // Set up a new DOM for each test
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'dangerously', resources: 'usable' });
    global.window = dom.window;
    global.document = dom.window.document;
    container = dom.window.document.createElement('div');
    dom.window.document.body.appendChild(container);
  });

  // --- Basic rendering ---
  it('renders a simple object', async () => {
    const html = await getViewerHTML({ a: 1, b: 'two' });
    expect(html).toContain('json-viewer-container');
    expect(html).toContain('"a":1');
    expect(html).toContain('"b":"two"');
  });

  it('renders an array', async () => {
    const html = await getViewerHTML([1, 2, 3]);
    expect(html).toContain('[1,2,3]');
  });

  it('renders primitives', async () => {
    expect(await getViewerHTML(42)).toContain('42');
    expect(await getViewerHTML('hello')).toContain('"hello"');
    expect(await getViewerHTML(true)).toContain('true');
  });

  // --- Special values ---
  it('renders null and undefined', async () => {
    const html = await getViewerHTML({ a: null, b: undefined });
    expect(html).toContain('null');
    expect(html).toContain('[ undefined ]');
  });

  it('renders functions and symbols', async () => {
    const html = await getViewerHTML({ fn: function testFunc() {}, sym: Symbol('s') });
    expect(html).toContain('[function testFunc]');
    expect(html).toContain('[Symbol s]');
  });

  it('renders dates', async () => {
    const html = await getViewerHTML({ d: new Date('2024-01-01T00:00:00.000Z') });
    expect(html).toContain('2024-01-01T00:00:00.000Z');
  });

  it('renders circular references', async () => {
    const obj = { a: 1 };
    obj.self = obj;
    const html = await getViewerHTML(obj);
    expect(html).toContain('[Circular Ref: root]');
  });

  // --- UI controls ---
  it('includes controls for show types and paths', async () => {
    const html = await getViewerHTML({ a: 1 }, { showTypes: true, pathsOnHover: true });
    expect(html).toContain('Show Types');
    expect(html).toContain('Show Paths on Hover');
  });

  // --- Edge cases ---
  it('renders empty object and array', async () => {
    const htmlObj = await getViewerHTML({});
    const htmlArr = await getViewerHTML([]);
    expect(htmlObj).toContain('{}');
    expect(htmlArr).toContain('[]');
  });

  it('renders deeply nested structures', async () => {
    const nested = { a: { b: { c: { d: 1 } } } };
    const html = await getViewerHTML(nested);
    expect(html).toContain('"d":1');
  });

  it('renders removed template marker', async () => {
    const html = await getViewerHTML({ template: { foo: 'bar' } }, { removeTemplate: true });
    expect(html).toContain('Removed for performance reasons');
  });

  // --- API usage ---
  it('exports generate, getScript, getStyles', () => {
    // Import the module directly for API tests
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./json-viewer.js');
    expect(typeof mod.default).toBe('function');
    expect(typeof mod.JSONViewerModule?.generate).toBe('function');
    expect(typeof mod.JSONViewerModule?.getScript).toBe('function');
    expect(typeof mod.JSONViewerModule?.getStyles).toBe('function');
  });
}); 