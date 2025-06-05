import fs from 'fs/promises';
import path from 'path';

/**
 * Custom stringify function that serializes JS values and optionally writes to file
 * @param {any} value - The value to serialize
 * @param {Object} options - Options for serialization and file writing
 * @param {string} [options.filename] - If provided, the JSON will be written to this file relative to the project root. Can include subdirectories.
 * @param {boolean} [options.addTimestamp=false] - Whether to add a timestamp to the filename
 * @returns {Promise<string>} - The serialized string
 */
export async function customStringify(value, options = {}) {
    const {
        filename,
        addTimestamp = false
    } = options;

    const seen = new WeakMap();
    const pathMap = new WeakMap();

    function getCircularMarker(path) {
        return `"[Circular ${path}]"`;
    }

    function getType(val) {
        if (val === null) return 'null';
        if (Array.isArray(val)) return 'array';
        return typeof val;
    }

    function _stringify(val, currentPath) {
        const type = getType(val);
        
        // Handle primitives
        if (type === 'string') return JSON.stringify(val);
        if (type === 'number') return isFinite(val) ? String(val) : 'null';
        if (type === 'boolean') return String(val);
        if (type === 'null') return '"null"';
        if (type === 'undefined') return '"undefined"';
        if (type === 'bigint') return JSON.stringify(val.toString());
        if (type === 'symbol') return JSON.stringify(`[Symbol ${val.description || ''}]`);
        if (type === 'function') return JSON.stringify(`[Function ${val.name || 'anonymous'}()]`);
        if (val instanceof Date) return JSON.stringify(val.toISOString());

        // Handle objects and arrays
        if (typeof val === 'object') {
            // Check for circular references
            if (seen.has(val)) {
                return getCircularMarker(pathMap.get(val));
            }

            // Mark as seen and store path
            seen.set(val, true);
            pathMap.set(val, currentPath);

            // Check for needsCheck property and set it to false
            if (val && typeof val === 'object' && 'needsCheck' in val) {
                val.needsCheck = false;
            }

            // Handle arrays
            if (Array.isArray(val)) {
                const arr = val.map((item, idx) => _stringify(item, `${currentPath}[${idx}]`));
                return `[${arr.join(",")}]`;
            }

            // Handle objects
            const keys = Object.keys(val);
            const props = keys.map(key => 
                `${JSON.stringify(key)}:${_stringify(val[key], `${currentPath}.${key}`)}`
            );
            return `{${props.join(",")}}`;
        }

        return '"[Unknown]"';
    }

    const serialized = _stringify(value, 'root');

    if (filename) {
        const absPath = path.join(process.cwd(), filename);
        const parsed = path.parse(absPath);
        let outDir = parsed.dir;
        let outBase = parsed.base;
        if (addTimestamp) {
            outBase = `${parsed.name}-${Date.now()}${parsed.ext}`;
        }
        
        // Ensure all necessary directories exist
        await fs.mkdir(outDir, { recursive: true });
        
        // Write the file using the full path
        await fs.writeFile(
            path.join(outDir, outBase),
            serialized,
            'utf8'
        );
    }

    return serialized;
} 