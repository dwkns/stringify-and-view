import { customStringify } from "./customStringify.js";
import { collections } from "./getCollections.js";

customStringify(collections.all,{
  filename: 'json/collections.json',
  addTimestamp: false
})




