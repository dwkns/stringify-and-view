import { Eleventy } from '@11ty/eleventy';
import util from 'util';

/**
 * Converts util.inspect output back into valid JSON
 * @param {string} inspectOutput - The string output from util.inspect
 * @returns {string} - Valid JSON string
 */
const convertToJSON = (inspectOutput) => {
  // Remove any ANSI color codes
  let jsonStr = inspectOutput.replace(/\x1b\[\d+m/g, '');

  // Replace single quotes with double quotes for JSON
  jsonStr = jsonStr.replace(/'/g, '"');

  // Quote unquoted property names (at start of line or after { or ,)
  jsonStr = jsonStr.replace(/([\{,]\s*)([a-zA-Z0-9_]+)(?=\s*:)/g, '$1"$2"');

  // Replace undefined with null
  jsonStr = jsonStr.replace(/: undefined/g, ': null');

  // Remove trailing commas before } or ]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  try {
    // Parse and stringify to validate and format the JSON
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch (error) {
    throw new Error(`Failed to convert to JSON: ${error.message}\nInput string:\n${jsonStr}`);
  }
};

// Example usage (kept for reference, not used in test.js)
const example = async () => {
  const elev = new Eleventy("src", "dist", {
    config: function (eleventyConfig) {
      eleventyConfig.dataFilterSelectors.add("collections");
    },
  });
  elev.setIsVerbose(true);
  const result = await elev.toJSON();
  const collections = result[0].data.collections;
  const op = util.inspect(collections.all);
  
  // Convert to JSON
  const jsonOutput = convertToJSON(op);
  console.log(jsonOutput);
};

export { convertToJSON, example }; 