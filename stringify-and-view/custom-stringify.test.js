/**
 * Test suite for the customStringify function
 * Tests various data types and edge cases
 */
import { describe, it, expect, afterEach } from 'vitest';
import { customStringify } from './custom-stringify.js';
import Eleventy from "@11ty/eleventy";
import fs from 'fs/promises';
import path from 'path';

describe('customStringify', () => {
  // Test primitive values
  describe('primitive values', () => {
    it('handles null and undefined', async () => {
      const testData = {
        nullValue: null,
        undefinedValue: undefined
      };
      const output = await customStringify(testData);
      expect(output).toBe('{"nullValue":"[ null ]","undefinedValue":"[ undefined ]"}');
    });

    it('handles numbers', async () => {
      await expect(customStringify(42)).resolves.toBe('42');
      await expect(customStringify(-123.45)).resolves.toBe('-123.45');
      await expect(customStringify(Infinity)).resolves.toBe('"[ null ]"');
      await expect(customStringify(NaN)).resolves.toBe('"[ null ]"');
    });

    it('handles strings', async () => {
      await expect(customStringify('hello')).resolves.toBe('"hello"');
      await expect(customStringify('')).resolves.toBe('""');
      await expect(customStringify('special chars: !@#$%^&*()')).resolves.toBe('"special chars: !@#$%^&*()"');
    });

    it('handles booleans', async () => {
      await expect(customStringify(true)).resolves.toBe('true');
      await expect(customStringify(false)).resolves.toBe('false');
    });
  });

  // Test Date objects
  describe('Date objects', () => {
    it('converts dates to ISO strings', async () => {
      const date = new Date('2024-01-01T12:00:00.000Z');
      await expect(customStringify(date)).resolves.toBe('"2024-01-01T12:00:00.000Z"');
    });
  });

  // Test arrays
  describe('arrays', () => {
    it('handles simple arrays', async () => {
      const testData = [1, 'two', true, null, undefined];
      const output = await customStringify(testData);
      expect(output).toBe('[1,"two",true,"[ null ]","[ undefined ]"]');
    });

    it('handles nested arrays', async () => {
      const arr = [1, [2, 3], [4, [5, 6]]];
      await expect(customStringify(arr)).resolves.toBe('[1,[2,3],[4,[5,6]]]');
    });
  });

  // Test objects
  describe('objects', () => {
    it('handles simple objects', async () => {
      const obj = { a: 1, b: 'two', c: true };
      await expect(customStringify(obj)).resolves.toBe('{"a":1,"b":"two","c":true}');
    });


    it('handles double escaped objects ', async () => {
      const obj = { "benchmarks": { "\"getBundle\" Universal Shortcode": {} } }
      const expected = JSON.stringify(obj);
      const output = await customStringify(obj);
      expect(output).toEqual(expected);
    });




    it('handles nested objects', async () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        },
        f: [1, 2, 3]
      };
      await expect(customStringify(obj)).resolves.toBe('{"a":1,"b":{"c":2,"d":{"e":3}},"f":[1,2,3]}');
    });

    it('handles circular references', async () => {
      const obj = { a: 1 };
      obj.self = obj;
      await expect(customStringify(obj)).resolves.toBe('{"a":1,"self":"[Circular root.self]"}');
    });

    it('handles deeply nested circular references', async () => {
      const obj = { a: 1 };
      obj.nest = { b: 2, parent: obj };
      await expect(customStringify(obj)).resolves.toBe('{"a":1,"nest":{"b":2,"parent":"[Circular root.nest.parent]"}}');
    });
  });

  // Test custom objects
  describe('custom objects', () => {
    it('handles objects with custom properties', async () => {
      const obj = {
        _value: 42,
        get value() { return this._value; },
        needsCheck: true
      };
      await expect(customStringify(obj)).resolves.toBe('{"_value":42,"value":42,"needsCheck":false}');
    });

    it('handles objects with nested custom properties', async () => {
      const obj = {
        a: {
          needsCheck: true,
          b: {
            needsCheck: true,
            c: 42
          }
        },
        needsCheck: true
      };
      await expect(customStringify(obj)).resolves.toBe('{"a":{"needsCheck":false,"b":{"needsCheck":false,"c":42}},"needsCheck":false}');
    });
  });

  // Test complex nested structures
  describe('complex nested structures', () => {
    it('handles complex nested data', async () => {
      const testData = {
        date: new Date('2024-01-01T00:00:00.000Z'),
        numbers: [1, 2, 3],
        nested: {
          text: 'hello',
          bool: true,
          arr: [null, undefined, { x: 1 }]
        }
      };
      const output = await customStringify(testData);
      expect(output).toBe('{"date":"2024-01-01T00:00:00.000Z","numbers":[1,2,3],"nested":{"text":"hello","bool":true,"arr":["[ null ]","[ undefined ]",{"x":1}]}}');
    });
  });

  // Test file writing
  describe('file writing', () => {
    const testDir = path.join(process.cwd(), 'test-output');
    const filename = path.join(testDir, 'test.json');

    // Clean up test files after each test
    afterEach(async () => {
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore errors if directory doesn't exist
      }
    });

    it('writes JSON to file', async () => {
      const testData = { a: 1, b: 'test' };
      const result = await customStringify(testData);
      expect(result).toBe('{"a":1,"b":"test"}');
    });

    it('creates directory if it\'t exist', async () => {
      const testData = { a: 1, b: 'test' };
      await customStringify(testData, { filename });
      const content = await fs.readFile(filename, 'utf8');
      expect(content).toBe(`{
  "a": 1,
  "b": "test"
}`);
    });

    it('handles nested directories', async () => {
      const nestedFilename = path.join(testDir, 'nested', 'test.json');
      const testData = { a: 1, b: 'test' };
      await customStringify(testData, { filename: nestedFilename });
      const content = await fs.readFile(nestedFilename, 'utf8');
      expect(content).toBe(`{
  "a": 1,
  "b": "test"
}`);
    });

    it('handles pretty printing', async () => {
      const testData = { a: 1, b: 'test' };
      await customStringify(testData, { filename, pretty: true });
      const content = await fs.readFile(filename, 'utf8');
      expect(content).toBe('{\n  "a": 1,\n  "b": "test"\n}');
    });

    it('handles custom indentation', async () => {
      const testData = { a: 1, b: 'test' };
      await customStringify(testData, { filename, pretty: true, indent: 4 });
      const content = await fs.readFile(filename, 'utf8');
      expect(content).toBe('{\n    "a": 1,\n    "b": "test"\n}');
    });
  });

  // Test JSON validity
  describe('JSON validity', () => {
    it('outputs valid JSON that can be parsed', async () => {
      const testData = {
        a: 1,
        b: 'test',
        c: [1, 2, 3],
        d: { x: true, y: null },
        e: new Date('2024-01-01')
      };
      const output = await customStringify(testData);
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({
        a: 1,
        b: 'test',
        c: [1, 2, 3],
        d: { x: true, y: '[ null ]' },
        e: '2024-01-01T00:00:00.000Z'
      });
    });

    it('handles circular references in valid JSON format', async () => {
      const obj = { a: 1 };
      obj.self = obj;
      const output = await customStringify(obj);
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({
        a: 1,
        self: '[Circular root.self]'
      });
    });

    it('throws error for invalid JSON output', async () => {
      // Create an object with a function that will cause invalid JSON
      const obj = {
        get invalid() {
          throw new Error('This will cause invalid JSON');
        }
      };

      await expect(customStringify(obj)).rejects.toThrow();
    });

    it('handles BigInt values by converting to string', async () => {
      const obj = {
        big: BigInt(9007199254740991)
      };
      const output = await customStringify(obj);
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({
        big: '9007199254740991'
      });
    });

    it('handles Symbol values by converting to string', async () => {
      const obj = {
        sym: Symbol('test')
      };
      const output = await customStringify(obj);
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({
        sym: '[Symbol test]'
      });
    });

    it('handles special values with descriptive representations', async () => {
      const testData = {
        nullValue: null,
        undefinedValue: undefined,
        functionValue: function testFunc() { },
        anonymousFunction: () => { },
        customObject: new (class CustomClass { })()
      };

      const output = await customStringify(testData);
      const parsed = JSON.parse(output);

      expect(parsed.nullValue).toBe('[ null ]');
      expect(parsed.undefinedValue).toBe('[ undefined ]');
      expect(parsed.functionValue).toBe('[function testFunc]');
      expect(parsed.anonymousFunction).toBe('[function anonymous]');
      // expect(parsed.customObject).toBe('[object CustomClass]');
    });

    // it('outputs valid JSON for Eleventy collections', async () => {
    //   const elev = new Eleventy("src", "dist", {
    //     config: function (eleventyConfig) {
    //       eleventyConfig.dataFilterSelectors.add("collections");
    //     },
    //   });
    //   elev.setIsVerbose(true);
    //   const result = await elev.toJSON();
    //   const collections = result[0].data.collections;
    //   const output = await customStringify(collections);
    //   // The only requirement: output must be valid JSON
    //   expect(() => JSON.parse(output)).not.toThrow();
    // });


    it('outputs the same for JSON.stringify as for customStringify for the suppled JSON', async () => {
      // Custom class example
      class CustomClass {
        constructor(id, value) {
          this.id = id;
          this.value = value;
        }
        get description() {
          return `CustomClass #${this.id}: ${this.value}`;
        }
        set updateValue(val) {
          this.value = val;
        }
      }

      // Example object with getters and setters
      const Template = {
        _name: 'Default',
        get name() {
          return this._name;
        },
        set name(value) {
          this._name = value;
        },
        get greeting() {
          return `Hello, ${this._name}!`;
        }
      };
      let json = {
        string: "hello",
        number: 1,
        date: new Date(),
        object: { a: 1, b: "2" },
        array: ["a", 1, new Date()],
        Template: Template,
        customInstance: new CustomClass(42, "meaning of life")
      }

      expect(await customStringify(json)).toEqual(JSON.stringify(json))

    });

  });
});


