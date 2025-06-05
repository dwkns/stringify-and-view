import Eleventy from "@11ty/eleventy";

let elev = new Eleventy("src", "dist", {
  config: function (eleventyConfig) {
    eleventyConfig.dataFilterSelectors.add("collections");
  },
});
elev.setIsVerbose(true);
let result = await elev.toJSON();
await elev.write();
let collections = result[0].data.collections;

export { collections }