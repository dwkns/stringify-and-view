/**
 * stringifyPlus function that handles special cases and circular references
 * @module stringify-plus
 * @param {any} data - The data to stringify
 * @returns {Promise<string>} The compact stringified data
 */
export async function stringifyPlus(data) {
    // Use a WeakMap to track object paths for circular reference detection
    const seen = new WeakMap();

    function stringifyPlusInner(value, path = 'root', parentIsRoot = true, inArray = false) {
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
            return `"${value.toISOString()}"`;
        }

        // Handle circular references
        if (typeof value === 'object') {
            if (seen.has(value)) {
                // Output the current path where the reference is being made
                return `"[Circular Ref: ${path}]"`;
            }
            seen.set(value, path);

            // Set needsCheck to false if present
            if (Object.prototype.hasOwnProperty.call(value, 'needsCheck')) {
                value.needsCheck = false;
            }

            // Handle arrays
            if (Array.isArray(value)) {
                const elements = value.map((item, index) =>
                    stringifyPlusInner(item, `${path}[${index}]`, false, true)
                );
                return `[${elements.join(',')}]`;
            }

            // Handle objects
            const keys = Object.keys(value);
            const pairs = keys.map(key => {
                let val = value[key];
                // Always include undefined as "[ undefined ]"
                if (val === undefined) {
                    return `${JSON.stringify(key)}:"[ undefined ]"`;
                }
                // For null, always output as null
                if (val === null) {
                    return `${JSON.stringify(key)}:null`;
                }
                // For functions, symbols, and other non-JSON types, output a string description
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
                if (typeof val === 'object' && val !== null && !(val instanceof Date) && !Array.isArray(val)) {
                }
                return `${JSON.stringify(key)}:${stringifyPlusInner(val, `${path}.${key}`, false, false)}`;
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