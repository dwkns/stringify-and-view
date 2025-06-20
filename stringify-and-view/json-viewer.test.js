import { describe, it, expect } from 'vitest';
import jsonViewer from './json-viewer.js';
import Eleventy from "@11ty/eleventy";

describe('JSONViewer', () => {
  describe('HTML output', () => {
    it('generates valid HTML for Eleventy collections', async () => {
      // Setup Eleventy and get collections data
      const elev = new Eleventy("src", "dist", {
        config: function (eleventyConfig) {
          eleventyConfig.dataFilterSelectors.add("collections");
        },
      });
      elev.setIsVerbose(true);
      const result = await elev.toJSON();
      const collections = result[0].data.collections;

      // Generate HTML using JSONViewer
      const html = await jsonViewer(collections.all, {
        showTypes: true,
        showCounts: true,
        defaultExpanded: false
      });

      // Basic HTML structure validation
      expect(html).toContain('<style>');
      expect(html).toContain('<div id="json-viewer-');
      expect(html).toContain('<script>');

      // Validate JSON data attribute
      const jsonDataMatch = html.match(/data-json='(.*?)'/);
      expect(jsonDataMatch).toBeTruthy();
     
     
      // const jsonData = jsonDataMatch[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      // // Verify the JSON data can be parsed
      // expect(() => JSON.parse(jsonData)).not.toThrow();

      // // Verify the JSON data contains expected Eleventy collection data
      // const parsedData = JSON.parse(jsonData);
      // expect(parsedData).toBeDefined();
      // expect(typeof parsedData).toBe('object');

      // Verify viewer options are properly set
      // expect(html).toContain('showTypes: true');
      // expect(html).toContain('showCounts: true');
      // expect(html).toContain('defaultExpanded: false');
    });

    it('handles circular references in HTML output', async () => {
      const obj = { a: 1 };
      obj.self = obj;
      
      const html = await jsonViewer(obj);
      
      // Verify circular reference is properly handled
      expect(html).toContain('[Circular');
      
      // Extract and parse JSON data
      const jsonDataMatch = html.match(/data-json='(.*?)'/);
      expect(jsonDataMatch).toBeTruthy();
      const jsonData = jsonDataMatch[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      expect(() => JSON.parse(jsonData)).not.toThrow();
    });

    it('generates unique IDs for multiple instances', async () => {
      const data = { test: 'data' };
      
      const html1 = await jsonViewer(data);
      const html2 = await jsonViewer(data);
      
      const id1 = html1.match(/id="(json-viewer-.*?)"/)[1];
      const id2 = html2.match(/id="(json-viewer-.*?)"/)[1];
      
      expect(id1).not.toBe(id2);
    });
  });
}); 