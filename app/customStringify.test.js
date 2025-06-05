import { describe, it, expect, afterEach } from 'vitest';
import { customStringify } from './customStringify.js';
import fs from 'fs/promises';
import path from 'path';

describe('customStringify', () => {

    // Test primitive types
    it('should handle null and undefined', async () => {
        await expect(customStringify(null)).resolves.toBe('"null"');
        await expect(customStringify(undefined)).resolves.toBe('"undefined"');
    });

    it('should handle numbers', async () => {
        await expect(customStringify(42)).resolves.toBe('42');
        await expect(customStringify(-123.45)).resolves.toBe('-123.45');
        await expect(customStringify(Infinity)).resolves.toBe('null');
        await expect(customStringify(NaN)).resolves.toBe('null');
    });

    it('should handle strings', async () => {
        await expect(customStringify('hello')).resolves.toBe('"hello"');
        await expect(customStringify('')).resolves.toBe('""');
        await expect(customStringify('special chars: !@#$%^&*()')).resolves.toBe('"special chars: !@#$%^&*()"');
    });

    it('should handle booleans', async () => {
        await expect(customStringify(true)).resolves.toBe('true');
        await expect(customStringify(false)).resolves.toBe('false');
    });

    it('should handle dates', async () => {
        const date = new Date('2024-01-01T12:00:00Z');
        await expect(customStringify(date)).resolves.toBe('"2024-01-01T12:00:00.000Z"');
    });

    // Test arrays
    it('should handle arrays', async () => {
        const arr = [1, 'two', true, null, undefined];
        await expect(customStringify(arr)).resolves.toBe('[1,"two",true,"null","undefined"]');
    });

    it('should handle nested arrays', async () => {
        const arr = [1, [2, 3], [4, [5, 6]]];
        await expect(customStringify(arr)).resolves.toBe('[1,[2,3],[4,[5,6]]]');
    });

    // Test objects
    it('should handle plain objects', async () => {
        const obj = { a: 1, b: 'two', c: true };
        await expect(customStringify(obj)).resolves.toBe('{"a":1,"b":"two","c":true}');
    });

    it('should handle nested objects', async () => {
        const obj = {
            a: 1,
            b: { c: 2, d: { e: 3 } },
            f: [1, 2, 3]
        };
        await expect(customStringify(obj)).resolves.toBe('{"a":1,"b":{"c":2,"d":{"e":3}},"f":[1,2,3]}');
    });

    // Test circular references
    it('should handle circular references', async () => {
        const obj = { a: 1 };
        obj.self = obj;
        await expect(customStringify(obj)).resolves.toBe('{"a":1,"self":"[Circular root]"}');
    });

    it('should handle deeply nested circular references', async () => {
        const obj = { a: { b: { c: {} } } };
        obj.a.b.c.self = obj;
        await expect(customStringify(obj)).resolves.toBe('{"a":{"b":{"c":{"self":"[Circular root]"}}}}');
    });

    // Test getter/setter objects
    it('should handle objects with getters and setters', async () => {
        const obj = {
            _value: 42,
            get value() { return this._value; },
            set value(v) { this._value = v; },
            needsCheck: true
        };
        await expect(customStringify(obj)).resolves.toBe('{"_value":42,"value":42,"needsCheck":false}');
    });

    // Test needsCheck property in nested objects
    it('should set needsCheck to false in nested objects', async () => {
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

    // Test complex combinations
    it('should handle complex nested structures', async () => {
        const obj = {
            date: new Date('2024-01-01'),
            numbers: [1, 2, 3],
            nested: {
                text: 'hello',
                bool: true,
                arr: [null, undefined, { x: 1 }]
            }
        };
        await expect(customStringify(obj)).resolves.toBe('{"date":"2024-01-01T00:00:00.000Z","numbers":[1,2,3],"nested":{"text":"hello","bool":true,"arr":["null","undefined",{"x":1}]}}');
    });

    it('should handle a complex object with various data types and circular references', async () => {
        const data = {
            name: "John", // String
            age: 30, // Number
            salary: 1234.56, // Decimal number
            bigNumber: BigInt(9007199254740991), // BigInt
            hobbies: ["reading", { type: "gaming", active: true }], // Array with nested object
            date: new Date('2024-01-01T00:00:00.000Z'), // Date
            symbol: Symbol("id"), // Symbol
            nested: [ // Array of objects
                { a: 1, b: { c: 2 } },
                { x: "test", y: { z: 3.14 } },
                { p: true, q: { r: null } }
            ],
            singleItemArray: ["solo"], // Single-item array
            empty: null, // Null
            getterObj: { // Object with getter
                needsCheck: true,
                get prop() { return "computed"; }
            }
        };
        data.circular = data; // Circular reference to root
        data.nested[0].b.circular = data.nested[0]; // Circular reference in nested array

        const result = await customStringify(data);
        // Only check that the circular references are present in the output
        expect(result.includes('"circular":"[Circular root]"')).toBe(true);
        expect(result.includes('"circular":"[Circular root.nested[0].b]"')).toBe(false); // Should not be present
    });

    // Test file writing functionality
    describe('file writing', () => {
        const testOutputPath = path.join(process.cwd(), 'json');

        afterEach(async () => {
            // Clean up test files and directories
            try {
                const files = await fs.readdir(testOutputPath);
                for (const file of files) {
                    const filePath = path.join(testOutputPath, file);
                    const stat = await fs.stat(filePath);
                    if (stat.isDirectory()) {
                        // Recursively clean up subdirectories
                        const subFiles = await fs.readdir(filePath);
                        for (const subFile of subFiles) {
                            await fs.unlink(path.join(filePath, subFile));
                        }
                        await fs.rmdir(filePath);
                    } else if (file.startsWith('test-') || file.startsWith('json-output')) {
                        await fs.unlink(filePath);
                    }
                }
            } catch (e) {
                // Ignore if directory doesn't exist
            }
        });

        it('should write to file when filename is provided', async () => {
            const testData = { test: 'data' };
            const filename = 'test-output.json';
            
            await customStringify(testData, { filename });
            
            const fileContent = await fs.readFile(path.join(testOutputPath, filename), 'utf8');
            expect(fileContent).toBe('{"test":"data"}');
        });

        it('should add timestamp to filename when addTimestamp is true', async () => {
            const testData = { test: 'data' };
            const filename = 'test-output.json';
            
            await customStringify(testData, { 
                filename,
                addTimestamp: true 
            });
            
            const files = await fs.readdir(testOutputPath);
            const timestampedFile = files.find(f => f.startsWith('test-output-') && f.endsWith('.json'));
            expect(timestampedFile).toBeTruthy();
            
            const fileContent = await fs.readFile(path.join(testOutputPath, timestampedFile), 'utf8');
            expect(fileContent).toBe('{"test":"data"}');
        });

        it('should not write to file when filename is not provided', async () => {
            const testData = { test: 'data' };
            
            const result = await customStringify(testData);
            
            expect(result).toBe('{"test":"data"}');
            
            // Verify no file was created
            const files = await fs.readdir(testOutputPath);
            expect(files).not.toContain('json-output.json');
        });

        it('should create subdirectories when filename includes a path', async () => {
            const testData = { test: 'data' };
            const filename = 'subdir/test-output.json';
            
            await customStringify(testData, { filename });
            
            const fileContent = await fs.readFile(path.join(testOutputPath, filename), 'utf8');
            expect(fileContent).toBe('{"test":"data"}');
        });

        it('should create nested subdirectories when filename includes multiple levels', async () => {
            const testData = { test: 'data' };
            const filename = 'level1/level2/level3/test-output.json';
            
            await customStringify(testData, { filename });
            
            const fileContent = await fs.readFile(path.join(testOutputPath, filename), 'utf8');
            expect(fileContent).toBe('{"test":"data"}');
        });

        it('should handle paths with timestamps', async () => {
            const testData = { test: 'data' };
            const filename = 'subdir/test-output.json';
            
            await customStringify(testData, { 
                filename,
                addTimestamp: true 
            });
            
            const subdirPath = path.join(testOutputPath, 'subdir');
            const files = await fs.readdir(subdirPath);
            const timestampedFile = files.find(f => f.startsWith('test-output-') && f.endsWith('.json'));
            expect(timestampedFile).toBeTruthy();
            
            const fileContent = await fs.readFile(path.join(subdirPath, timestampedFile), 'utf8');
            expect(fileContent).toBe('{"test":"data"}');
        });
    });
}); 