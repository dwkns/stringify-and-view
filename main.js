
import { customStringify } from './stringify-and-view/custom-stringify.js';
import Eleventy from "@11ty/eleventy";
import fs from 'fs/promises';
import path from 'path';
import { inspect } from "util";

// // Custom class example
// class CustomClass {
//   constructor(id, value) {
//     this.id = id;
//     this.value = value;
//   }
//   get description() {
//     return `CustomClass #${this.id}: ${this.value}`;
//   }
//   set updateValue(val) {
//     this.value = val;
//   }
// }

// // Example object with getters and setters
// const Template = {
//   _name: 'Default',
//   get name() {
//     return this._name;
//   },
//   set name(value) {
//     this._name = value;
//   },
//   get greeting() {
//     return `Hello, ${this._name}!`;
//   }
// };
// let json = {
//   string: "hello",
//   number: 1,
//   date: new Date(),
//   object: { a: 1, b: "2" },
//   array: ["a", 1, new Date()],
//   Template: Template,
//   customInstance: new CustomClass(42, "meaning of life")
// }

// const runCode = async function (json) {
//   const custom = await customStringify(json)
//   const inBuilt = JSON.stringify(json)
//   if (custom === inBuilt) {
//     console.log("They Match")
//   }
// }


// const runEleventy = async function () {
//   const elev = new Eleventy("src", "dist", {
//     config: function (eleventyConfig) {
//       eleventyConfig.dataFilterSelectors.add("collections");
//     },
//   });
//   elev.setIsVerbose(true);
//    const result = await elev.toJSON();
//    const collections = result[0].data.collections.all[0].template;

//    let terminalStr =  inspect(collections, {
//     showHidden: false,
//     depth: 8,
//     colors: true,
//     breakLength: 60
//   })

//   // console.log(terminalStr)


//   const custom = await customStringify(collections)
//   const inBuilt = JSON.stringify(collections)


//   if (custom === inBuilt) {
//     console.log("They Match") 
//   } else {
//     console.log("they don't")
//     await fs.writeFile("custom", custom, 'utf8');
//     await fs.writeFile("inBuilt", inBuilt, 'utf8');
//   }

// }





// runEleventy()
// runCode(json)

const obj = { "benchmarks": { "\"getBundle\" Universal Shortcode": {} } }
const json = JSON.stringify(obj)
const output = await customStringify(obj)

console.log(json)
console.log(output)