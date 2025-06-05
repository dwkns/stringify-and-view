import { customStringify } from "./app/customStringify.js";



/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy({"lib/js/json-view.js": "json-view.js"});
  
  




  eleventyConfig.addFilter("myFilter", async (data) => {
    
    // const id = `log-${Math.random().toString(36).substr(2, 6)}`
    const id = `log-123`
    const filename = `${id}.json`
    
    let result = await customStringify(data,{
      filename: `${eleventyConfig.dir.output}/${filename}`
    })

   
   const html = `  <div id="${id}"></div>
  <script type="text/javascript">
    fetch('${filename}')
    .then((res)=> {
      return res.text();
    })
    .then((data) => {
      const tree = jsonview.create(data);
      jsonview.render(tree, document.querySelector('#${id}'));
      jsonview.expand(tree);
    })
    .catch((err) => {
      console.log(err);
    })
  </script>`
    return html
  });
};

export const config = {

  htmlTemplateEngine: "njk",
  dir: {
    input: "src",
    output: "dist"
  },
};