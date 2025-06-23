import jsonViewer from './stringify-and-view/json-viewer.js';
import logToConsole from 'eleventy-plugin-console-plus';



/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default (eleventyConfig) => {

  // Add the JSON viewer filter
  eleventyConfig.addFilter('jsonViewer', jsonViewer);
  eleventyConfig.addPlugin(logToConsole, {
    logToTerminal: false
  })
};

export const config = {

  htmlTemplateEngine: "njk",
  dir: {
    input: "src",
    output: "dist"
  },
};