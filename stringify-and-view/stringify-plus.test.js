/*
 * Test suite for the stringifyPlus function
 * Tests various data types and edge cases
 */
import { describe, it, expect } from 'vitest';
import { stringifyPlus } from './stringify-plus.js';

// No Eleventy, fs, or path needed since file output is removed

describe('stringifyPlus', () => {
  let input;
  let output;
  let parsed;
  let json;

  describe('null & undefined', () => {
    it('handles null ', async () => {

      // We use this format to ensure that caling stringifyPlus(input) 
      // doesn't change `input` in an unexpected way. 
      input = null
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
    })

    it('handles undefined ', async () => {
      input = undefined
      await expect(stringifyPlus(input)).resolves.toBe('"[ undefined ]"');

      input = {
        nullValue: null,
        undefinedValue: undefined
      };
      await expect(stringifyPlus(input)).resolves.toBe('{"nullValue":null,"undefinedValue":"[ undefined ]"}');
    });
  })

  // Test primitive values
  describe('primitive values', () => {
    it('handles numbers', async () => {
      input = 42
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);

      input = -123.45
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);

      input = Infinity
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);

      input = NaN
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);



    });

    it('handles BigInt values by converting to string', async () => {
      input = {
        big: BigInt(9007199254740991)
      };
      output = await stringifyPlus(input);
      parsed = JSON.parse(output);
      expect(parsed).toEqual({
        big: '9007199254740991'
      });
    });

    it('handles strings', async () => {
      input = 'hello'
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);

      input = ''
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);

      input = ' '
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);

      input = 'special chars: !@#$%^&*()'
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
    });

    it('handles booleans', async () => {
      input = true
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);

      input = false
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
    });
  });

  // Test Date objects
  describe('Date objects', () => {
    it('handles dates', async () => {
      input = new Date('2024-01-01T12:00:00.000Z');
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
    });

  });

  // Test arrays
  describe('arrays', () => {
    it('handles simple arrays', async () => {
      input = [1, 'two', { a: "a" }, 1.5, "a string", null];
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
    });

    it('handles arrays with undefined', async () => {
      input = [1, 'two', true, null, undefined];
      await expect(stringifyPlus(input)).resolves.toBe('[1,"two",true,null,"[ undefined ]"]');
    });

    it('handles nested arrays', async () => {
      input = [1, [2, 3], [4, [5, 6]]];
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
    });
  });

  // 
  // Test objects
  describe('standard objects', () => {
    it('handles simple objects', async () => {
      input = { a: 1, b: 'two', c: true };
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
    });

    it('handles double escaped objects ', async () => {
      input = { "benchmarks": { "\"getBundle\" Universal Shortcode": {} } }
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
    });

    it('handles nested objects', async () => {
      input = { a: 1, b: { c: 2, d: { e: 3 } }, f: [1, 2, 3] };
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
    });

    // it('handles circular references', async () => {
    //   input = { a: 1 };
    //   input.self = input;
    //   await expect(stringifyPlus(input)).resolves.toBe('{"a":1,"self":"[Circular Ref: root]"}');
    // });

    it('handles circular references ', async () => {
      input = { a: 1 };
      input.self = input;
      await expect(stringifyPlus(input)).resolves.toBe('{"a":1,"self":{"a":1,"self":"[Circular Ref: root]"}}');
    });



    // it('handles deeply nested circular references', async () => {
    //   input = { a: 1 , b: { bNested: "bNested"} };
    //   input.c =  { cNested:"cNested", referenced: input.b } 
    //   await expect(stringifyPlus(input)).resolves.toBe('{"a":1,"b":{"bNested":"bNested"},"c":{"cNested":"cNested","referenced":"[Circular Ref: root.b]"}}');
    // });
    it('handles deeply nested circular references', async () => {
      input = { a: 1 , b: { bNested: "bNested"} };
      input.c =  { cNested:"cNested", referenced: input.b } 
      await expect(stringifyPlus(input)).resolves.toBe('{"a":1,"b":{"bNested":"bNested"},"c":{"cNested":"cNested","referenced":{"bNested":"bNested"}}}');
    });
  });


  describe('Eleventy Specific', () => {
    // Some Eleventy objects are not serializable and break JSON.stringify
    // needsCheck=false is an escape hatch which allows us to process these
    // See: https://github.com/11ty/eleventy/issues/3744#issuecomment-2802850350
    it('handles unserializable Eleventy objects', async () => {
      input = {
        _value: 42,
        get value() { return this._value; },
        needsCheck: true
      };
      await expect(stringifyPlus(input)).resolves.toBe('{"_value":42,"value":42,"needsCheck":false}');
    });

    it('handles unserializable Eleventy objects', async () => {
      input = { a: { needsCheck: true, b: { needsCheck: true, c: 42 } }, needsCheck: true };
      await expect(stringifyPlus(input)).resolves.toBe('{"a":{"needsCheck":false,"b":{"needsCheck":false,"c":42}},"needsCheck":false}');
    });

    it('allows removing template as a key', async () => {
      input =  {
        a: 1,
        template: { big: "data", nested: { foo: "bar" } },
        b: { template: { x: 1 } }
      };
      await expect(stringifyPlus(input,{ removeTemplate: true })).resolves.toBe('{"a":1,"template":"Removed for performance reasons","b":{"template":"Removed for performance reasons"}}');
    });

  });

  // Test complex nested structures
  describe('complex nested structures', () => {
    it('handles complex nested data', async () => {
      input = {
        date: new Date('2024-01-01T00:00:00.000Z'),
        numbers: [1, 2, 3],
        nested: {
          text: 'hello',
          bool: true,
          arr: [null, undefined, { x: 1 }]
        }
      };
      await expect(stringifyPlus(input)).resolves.toBe('{"date":"2024-01-01T00:00:00.000Z","numbers":[1,2,3],"nested":{"text":"hello","bool":true,"arr":[null,"[ undefined ]",{"x":1}]}}');
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
      const output = await stringifyPlus(testData);
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({
        a: 1,
        b: 'test',
        c: [1, 2, 3],
        d: { x: true, y: null },
        e: '2024-01-01T00:00:00.000Z'
      });
    });




    it('throws error for invalid JSON output', async () => {
      // Create an object with a function that will cause invalid JSON
      input = {
        get invalid() {
          throw new Error('This will cause invalid JSON');
        }
      };
      await expect(stringifyPlus(input)).rejects.toThrow();
    });
  });

  describe('Special cases', () => {
    it('handles Symbol values by converting to string', async () => {
      input = {
        sym: Symbol('test')
      };
      const output = await stringifyPlus(input);
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({
        sym: '[Symbol test]'
      });
    });
    it('handles functions & classes (tbc)', async () => {
      input = {
        nullValue: null,
        undefinedValue: undefined,
        functionValue: function testFunc() { },
        anonymousFunction: () => { },
        customObject: new (class CustomClass { })()
      };
      output = await stringifyPlus(input);
      parsed = JSON.parse(output);
      expect(parsed.nullValue).toBe(null);
      expect(parsed.undefinedValue).toBe('[ undefined ]');
      expect(parsed.functionValue).toBe('[function testFunc]');
      expect(parsed.anonymousFunction).toBe('[function anonymous]');
    });

    it('handles Custom Classes', async () => {
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
     input = {
        string: "hello",
        number: 1,
        date: new Date(),
        object: { a: 1, b: "2" },
        array: ["a", 1, new Date()],
        Template: Template,
        customInstance: new CustomClass(42, "meaning of life")
      }
      json = JSON.stringify(input)
      output = await stringifyPlus(input)
      expect(output).toBe(json);
     
    });
  });
}); 