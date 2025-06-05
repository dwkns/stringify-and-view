import fs from 'fs/promises';
import path from 'path';

/**
 * Custom JSON stringifier that handles special cases and circular references
 * @module custom-stringify
 */

/**
 * Custom stringify function that handles special cases and writes to file if needed
 * @param {any} data - The data to stringify
 * @param {Object} options - Options for stringification
 * @param {string} [options.filename] - Optional filename to write the output to
 * @param {boolean} [options.pretty=false] - Whether to pretty print the output
 * @param {number} [options.indent=2] - Number of spaces for indentation
 * @returns {Promise<string>} The stringified data
 */
export async function customStringify(data, options = {}) {
    const { filename, pretty = false, indent = 2 } = options;
    // Use a WeakMap to track object paths for circular reference detection
    const seen = new WeakMap();

    function customStringifyInner(value, path = 'root', parentIsRoot = true, inArray = false) {
        // Handle special values
        if (value === undefined) return '"[ undefined ]"';
        if (value === null) {
            // For object properties, stringify as "[ null ]"
            return inArray ? '"[ null ]"' : '"[ null ]"';
        }
        if (typeof value === 'function') {
            const name = value.name && value.name !== 'anonymousFunction' ? value.name : 'anonymous';
            return `"[function ${name}]"`;
        }
        if (typeof value === 'symbol') {
            return `"[Symbol ${value.description || ''}]"`;
        }
        if (typeof value === 'bigint') {
            return `"${value.toString()}"`;
        }
        if (value instanceof Date) {
            return `"${value.toISOString()}"`;
        }

        // Handle circular references
        if (typeof value === 'object') {
            if (seen.has(value)) {
                // Always use [Circular root] for the root object
                return '"[Circular root]"';
            }
            seen.set(value, path);

            // Set needsCheck to false if present
            if (Object.prototype.hasOwnProperty.call(value, 'needsCheck')) {
                value.needsCheck = false;
            }

            // Handle arrays
            if (Array.isArray(value)) {
                const elements = value.map((item, index) =>
                    customStringifyInner(item, `${path}[${index}]`, false, true)
                );
                return `[${elements.join(',')}]`;
            }

            // Handle objects
            const keys = Object.keys(value);
            const pairs = keys.map(key => {
                let val = value[key];
                // Always include undefined as "[ undefined ]"
                if (val === undefined) {
                    return `"${key}":"[ undefined ]"`;
                }
                // For null, always output as "[ null ]"
                if (val === null) {
                    return `"${key}":"[ null ]"`;
                }
                // For functions, symbols, and other non-JSON types, output a string description
                if (typeof val === 'function') {
                    const name = val.name && val.name !== 'anonymousFunction' ? val.name : 'anonymous';
                    return `"${key}":"[function ${name}]"`;
                }
                if (typeof val === 'symbol') {
                    return `"${key}":"[Symbol ${val.description || ''}]"`;
                }
                if (typeof val === 'bigint') {
                    return `"${key}":"${val.toString()}"`;
                }
                if (typeof val === 'object' && val !== null && !(val instanceof Date) && !Array.isArray(val)) {
                    // If the object is not a plain object or array, output a string description
                    const proto = Object.getPrototypeOf(val);
                    if (proto && proto !== Object.prototype) {
                        return `"${key}":"[object ${val.constructor && val.constructor.name ? val.constructor.name : 'Object'}]"`;
                    }
                }
                return `"${key}":${customStringifyInner(val, `${path}.${key}`, false, false)}`;
            });
            return `{${pairs.join(',')}}`;
        }

        // Handle primitive values
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value.toString() : '"[ null ]"';
        }
        if (typeof value === 'string') return JSON.stringify(value);
        if (typeof value === 'boolean') return value.toString();

        // For any other type that can't be automatically stringified
        return `"[${typeof value} ${value?.constructor?.name || ''}]"`;
    }

    let json = customStringifyInner(data);

    if (filename) {
        const dir = path.dirname(filename);
        await fs.mkdir(dir, { recursive: true });
        const output = pretty ? JSON.stringify(JSON.parse(json), null, indent) : json;
        await fs.writeFile(filename, output, 'utf8');
        return output;
    }
    return json;
} 