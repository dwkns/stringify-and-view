/**
 * stringifyPlus function that handles special cases and circular references
 * @module stringify-plus
 * @param {any} data - The data to stringify
 * @param {Object} options - Optional configuration options
 * @returns {Promise<string>} The compact stringified data
 */
export async function stringifyPlus(data, options = {}) {
    // Use a WeakMap to track object paths for circular reference reporting
    const seen = new WeakMap();
    // Use a WeakMap to track how many times each object has been stringified in a circular context
    const circularDepths = new WeakMap();
    const maxCircularDepth = options.maxCircularDepth ?? 1;
    const removeTemplate = options.removeTemplate ?? false;
    

    function stringifyPlusInner(value, path = 'root', parentIsRoot = true, inArray = false, ancestors = new Set(), parentKey = null) {
        // If the parent key is 'template' and removeTemplate is true, replace value
        if (removeTemplate && parentKey === 'template') {
            return '"Removed for performance reasons"';
        }
        // If the root object itself is a 'template' object
        if (removeTemplate && parentIsRoot && typeof value === 'object' && value !== null && Object.keys(value).length === 1 && Object.keys(value)[0] === 'template') {
            return '{"template":"Removed for performance reasons"}';
        }
        // Handle special values
        if (value === undefined) return '"[ undefined ]"';
        if (value === null) { return 'null' }
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
            return JSON.stringify(value);
        }

        // Handle objects and arrays
        if (typeof value === 'object') {
            // True circular reference: object is in the ancestor chain
            if (ancestors.has(value)) {
                // Count how many times we've seen this object in a circular context
                const count = circularDepths.get(value) || 0;
                if (count < maxCircularDepth) {
                    circularDepths.set(value, count + 1);
                    // Recursively output the object/array again
                    if (Array.isArray(value)) {
                        const elements = value.map((item, index) =>
                            stringifyPlusInner(item, `${path}[${index}]`, false, true, new Set([...ancestors, value]), null)
                        );
                        return `[${elements.join(',')}]`;
                    }
                    const keys = Object.keys(value);
                    const pairs = keys.map(key => {
                        let val = value[key];
                        if (removeTemplate && key === 'template') {
                            return `${JSON.stringify(key)}:"Removed for performance reasons"`;
                        }
                        if (val === undefined) {
                            return `${JSON.stringify(key)}:"[ undefined ]"`;
                        }
                        if (val === null) {
                            return `${JSON.stringify(key)}:null`;
                        }
                        if (typeof val === 'function') {
                            const name = val.name && val.name !== 'anonymousFunction' ? val.name : 'anonymous';
                            return `${JSON.stringify(key)}:"[function ${name}]"`;
                        }
                        if (typeof val === 'symbol') {
                            return `${JSON.stringify(key)}:"[Symbol ${val.description || ''}]"`;
                        }
                        if (typeof val === 'bigint') {
                            return `${JSON.stringify(key)}:"${val.toString()}"`;
                        }
                        return `${JSON.stringify(key)}:${stringifyPlusInner(val, `${path}.${key}`, false, false, new Set([...ancestors, value]), key)}`;
                    });
                    return `{${pairs.join(',')}}`;
                } else {
                    // Output the path where the reference originated (first seen)
                    return `"[Circular Ref: ${seen.get(value) || path}]"`;
                }
            }
            // Not a circular reference, but track first seen path for reporting
            if (!seen.has(value)) seen.set(value, path);
            // Set needsCheck to false if present
            if (Object.prototype.hasOwnProperty.call(value, 'needsCheck')) {
                value.needsCheck = false;
            }
            // Handle arrays
            if (Array.isArray(value)) {
                const elements = value.map((item, index) =>
                    stringifyPlusInner(item, `${path}[${index}]`, false, true, new Set([...ancestors, value]), null)
                );
                return `[${elements.join(',')}]`;
            }
            // Handle objects
            const keys = Object.keys(value);
            const pairs = keys.map(key => {
                if (removeTemplate && key === 'template') {
                    return `${JSON.stringify(key)}:"Removed for performance reasons"`;
                }
                let val = value[key];
                if (val === undefined) {
                    return `${JSON.stringify(key)}:"[ undefined ]"`;
                }
                if (val === null) {
                    return `${JSON.stringify(key)}:null`;
                }
                if (typeof val === 'function') {
                    const name = val.name && val.name !== 'anonymousFunction' ? val.name : 'anonymous';
                    return `${JSON.stringify(key)}:"[function ${name}]"`;
                }
                if (typeof val === 'symbol') {
                    return `${JSON.stringify(key)}:"[Symbol ${val.description || ''}]"`;
                }
                if (typeof val === 'bigint') {
                    return `${JSON.stringify(key)}:"${val.toString()}"`;
                }
                return `${JSON.stringify(key)}:${stringifyPlusInner(val, `${path}.${key}`, false, false, new Set([...ancestors, value]), key)}`;
            });
            return `{${pairs.join(',')}}`;
        }

        // Handle primitive values
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value.toString() : 'null';
        }
        if (typeof value === 'string') return JSON.stringify(value);
        if (typeof value === 'boolean') return value.toString();

        // For any other type that can't be automatically stringified
        return `"[${typeof value} ${value?.constructor?.name || ''}]"`;
    }

    let json = stringifyPlusInner(data);
    return json;
} 