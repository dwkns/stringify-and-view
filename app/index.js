import { customStringify } from "./custom-stringify.js";
import { collections } from "./get-eleventy-collections.js";

customStringify(collections.all,{
  filename: 'json/collections.json',
  addTimestamp: false
})




