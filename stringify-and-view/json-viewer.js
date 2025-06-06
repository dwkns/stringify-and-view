import { customStringify } from "./custom-stringify.js";
/**
 * JSON Viewer Module and Filter
 * Provides a collapsible, interactive JSON viewer with syntax highlighting
 * and support for toggling types and counts display.
 */

const JSONViewerModule = {
  /**
   * Generates a unique ID for each JSON viewer instance
   * @returns {string} A unique ID prefixed with 'json-viewer-'
   */
  generateId: () => `json-viewer-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Returns the CSS styles for the JSON viewer
   * @returns {string} CSS styles as a template literal
   */
  getStyles: () => `
    .json-viewer-container {
      font-family: monospace;
      line-height: 1.4;
      color: #333;
      background: #fff;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 8px 0;
    }

    .json-viewer-node {
      position: relative;
    }

    .json-viewer-header {
      display: flex;
      align-items: center;
      gap: 4px;
      padding-left: 16px;
    }

    .json-viewer-toggle {
      cursor: pointer;
      user-select: none;
      width: 14px;
      display: inline-block;
      position: absolute;
      left: 0;
      top: 0;
      color: #666;
    }

    .json-viewer-key {
      color: #0066cc;
    }

    .json-viewer-string {
      color: #008000;
    }

    .json-viewer-number {
      color: #0000ff;
    }

    .json-viewer-boolean {
      color: #0066cc;
    }

    .json-viewer-null {
      color: #666;
    }

    .json-viewer-type {
      color: #666;
      font-size: 0.8em;
      margin: 0 4px;
    }

    .json-viewer-count {
      color: #666;
      font-size: 0.8em;
    }

    .json-viewer-date {
      color: #008000;
    }

    .json-viewer-controls {
      margin-bottom: 12px;
      display: flex;
      gap: 12px;
    }

    .json-viewer-control {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      user-select: none;
      color: #666;
    }

    .json-viewer-control input[type="checkbox"] {
      margin: 0;
    }
  `,

  /**
   * Generates the JavaScript code for the JSON viewer
   * @param {string} containerId - The ID of the container element
   * @param {Object} options - Viewer configuration options
   * @returns {string} JavaScript code as a template literal
   */
  getScript: (containerId, options) => `
    (function() {
      /**
       * JSON Viewer class that handles rendering and interaction
       */
      class JSONViewer {
        /**
         * Creates a new JSON viewer instance
         * @param {Object} options - Configuration options
         * @param {boolean} [options.showTypes=true] - Whether to show type labels
         * @param {boolean} [options.showCounts=true] - Whether to show count labels
         * @param {boolean} [options.defaultExpanded=false] - Whether nodes are expanded by default
         */
        constructor(options = {}) {
          this.options = {
            showTypes: options.showTypes ?? true,
            showCounts: options.showCounts ?? true,
            defaultExpanded: options.defaultExpanded ?? false
          };
          this.isOptionKeyPressed = false;
          this.expandedNodes = new Set();
          this.setupEventListeners();
        }

        /**
         * Sets up keyboard event listeners for the Option/Alt key
         */
        setupEventListeners() {
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = true;
          });
          document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = false;
          });
        }

        /**
         * Gets the type of a value
         * @param {*} value - The value to check
         * @returns {string} The type of the value
         */
        getType(value) {
          if (value === null) return 'null';
          if (Array.isArray(value)) return 'array';
          if (value instanceof Date) return 'date';
          return typeof value;
        }

        /**
         * Gets the count of items in an array or object
         * @param {*} value - The value to count
         * @returns {number|null} The count or null if not applicable
         */
        getCount(value) {
          if (Array.isArray(value)) return value.length;
          if (typeof value === 'object' && value !== null) return Object.keys(value).length;
          return null;
        }

        /**
         * Creates a toggle button for expandable nodes
         * @returns {HTMLElement} The toggle button element
         */
        createToggleButton() {
          const button = document.createElement('span');
          button.className = 'json-viewer-toggle';
          button.innerHTML = '▶';
          return button;
        }

        /**
         * Creates a type label element
         * @param {string} type - The type to display
         * @returns {HTMLElement} The type label element
         */
        createTypeLabel(type) {
          const label = document.createElement('span');
          label.className = 'json-viewer-type';
          label.textContent = type;
          return label;
        }

        /**
         * Creates a count label element
         * @param {number} count - The count to display
         * @returns {HTMLElement} The count label element
         */
        createCountLabel(count) {
          const label = document.createElement('span');
          label.className = 'json-viewer-count';
          label.textContent = \`(\${count})\`;
          return label;
        }

        /**
         * Creates a value element with appropriate styling
         * @param {*} value - The value to display
         * @returns {HTMLElement} The value element
         */
        createValueElement(value) {
          const element = document.createElement('span');
          element.className = 'json-viewer-value';
          
          if (value === null) {
            element.textContent = 'null';
            element.classList.add('json-viewer-null');
          } else if (typeof value === 'string') {
            element.textContent = \`"\${value}"\`;
            element.classList.add('json-viewer-string');
          } else if (typeof value === 'number') {
            element.textContent = value;
            element.classList.add('json-viewer-number');
          } else if (typeof value === 'boolean') {
            element.textContent = value;
            element.classList.add('json-viewer-boolean');
          } else if (value instanceof Date) {
            element.textContent = value.toISOString();
            element.classList.add('json-viewer-date');
          } else {
            element.textContent = JSON.stringify(value);
          }
          return element;
        }

        /**
         * Gets the path to a node in the tree
         * @param {HTMLElement} node - The node element
         * @returns {string} The path to the node
         */
        getNodePath(node) {
          const path = [];
          let current = node;
          while (current && current !== this.container) {
            const key = current.getAttribute('data-key');
            if (key !== null) path.unshift(key);
            current = current.parentElement;
          }
          return path.join('.');
        }

        /**
         * Creates a node element for a value
         * @param {string|null} key - The key of the value
         * @param {*} value - The value to display
         * @param {number} depth - The depth in the tree
         * @param {string} path - The path to this node
         * @returns {HTMLElement} The node element
         */
        createNode(key, value, depth = 0, path = '') {
          const node = document.createElement('div');
          node.className = 'json-viewer-node';
          node.style.marginLeft = \`\${depth * 4}px\`;
          if (key !== null) node.setAttribute('data-key', key);

          const header = document.createElement('div');
          header.className = 'json-viewer-header';
          const type = this.getType(value);
          const count = this.getCount(value);

          if (type === 'object' || type === 'array') {
            const toggle = this.createToggleButton();
            const nodePath = path ? \`\${path}.\${key}\` : key;
            const isExpanded = this.expandedNodes.has(nodePath) || this.options.defaultExpanded;
            
            toggle.addEventListener('click', (e) => {
              if (this.isOptionKeyPressed) this.toggleAll(node);
              else this.toggleNode(node, nodePath);
            });
            node.appendChild(toggle);

            if (key !== null) {
              const keyElement = document.createElement('span');
              keyElement.className = 'json-viewer-key';
              keyElement.textContent = \`\${key}: \`;
              header.appendChild(keyElement);
            }

            if (this.options.showTypes) header.appendChild(this.createTypeLabel(type));
            if (this.options.showCounts && count !== null) header.appendChild(this.createCountLabel(count));

            const content = document.createElement('div');
            content.className = 'json-viewer-content';
            content.style.display = isExpanded ? 'block' : 'none';
            if (isExpanded) toggle.innerHTML = '▼';

            if (type === 'array') {
              value.forEach((item, index) => {
                content.appendChild(this.createNode(index, item, depth + 1, nodePath));
              });
            } else {
              Object.entries(value).forEach(([k, v]) => {
                content.appendChild(this.createNode(k, v, depth + 1, nodePath));
              });
            }

            node.appendChild(header);
            node.appendChild(content);
          } else {
            if (key !== null) {
              const keyElement = document.createElement('span');
              keyElement.className = 'json-viewer-key';
              keyElement.textContent = \`\${key}: \`;
              header.appendChild(keyElement);
            }

            if (this.options.showTypes) header.appendChild(this.createTypeLabel(type));
            header.appendChild(this.createValueElement(value));
            node.appendChild(header);
          }
          return node;
        }

        /**
         * Toggles the expansion state of a node
         * @param {HTMLElement} node - The node to toggle
         * @param {string} path - The path to the node
         */
        toggleNode(node, path) {
          const content = node.querySelector('.json-viewer-content');
          const toggle = node.querySelector('.json-viewer-toggle');
          
          if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.innerHTML = '▼';
            this.expandedNodes.add(path);
          } else {
            content.style.display = 'none';
            toggle.innerHTML = '▶';
            this.expandedNodes.delete(path);
          }
        }

        /**
         * Toggles the expansion state of a node and all its children
         * @param {HTMLElement} node - The node to toggle
         */
        toggleAll(node) {
          const content = node.querySelector('.json-viewer-content');
          const toggle = node.querySelector('.json-viewer-toggle');
          const isExpanded = content.style.display === 'block';
          
          const toggleRecursive = (element) => {
            const contents = element.querySelectorAll('.json-viewer-content');
            const toggles = element.querySelectorAll('.json-viewer-toggle');
            
            contents.forEach((content, index) => {
              const nodePath = this.getNodePath(content.parentElement);
              content.style.display = isExpanded ? 'none' : 'block';
              toggles[index].innerHTML = isExpanded ? '▶' : '▼';
              
              if (isExpanded) this.expandedNodes.delete(nodePath);
              else this.expandedNodes.add(nodePath);
            });
          };

          toggleRecursive(node);
        }

        /**
         * Creates the controls for toggling types and counts
         * @returns {HTMLElement} The controls container
         */
        createControls() {
          const controls = document.createElement('div');
          controls.className = 'json-viewer-controls';

          const typesControl = document.createElement('label');
          typesControl.className = 'json-viewer-control';
          const typesCheckbox = document.createElement('input');
          typesCheckbox.type = 'checkbox';
          typesCheckbox.checked = this.options.showTypes;
          typesCheckbox.addEventListener('change', (e) => {
            this.options.showTypes = e.target.checked;
            this.updateDisplay();
          });
          typesControl.appendChild(typesCheckbox);
          typesControl.appendChild(document.createTextNode('Show Types'));

          const countsControl = document.createElement('label');
          countsControl.className = 'json-viewer-control';
          const countsCheckbox = document.createElement('input');
          countsCheckbox.type = 'checkbox';
          countsCheckbox.checked = this.options.showCounts;
          countsCheckbox.addEventListener('change', (e) => {
            this.options.showCounts = e.target.checked;
            this.updateDisplay();
          });
          countsControl.appendChild(countsCheckbox);
          countsControl.appendChild(document.createTextNode('Show Counts'));

          controls.appendChild(typesControl);
          controls.appendChild(countsControl);
          return controls;
        }

        /**
         * Updates the display based on current options
         */
        updateDisplay() {
          const typeLabels = this.container.querySelectorAll('.json-viewer-type');
          const countLabels = this.container.querySelectorAll('.json-viewer-count');

          typeLabels.forEach(label => {
            label.style.display = this.options.showTypes ? 'inline' : 'none';
          });

          countLabels.forEach(label => {
            label.style.display = this.options.showCounts ? 'inline' : 'none';
          });
        }

        /**
         * Renders the JSON viewer
         * @param {*} json - The JSON data to display
         * @param {HTMLElement} container - The container element
         */
        render(json, container) {
          this.container = container;
          const data = typeof json === 'string' ? JSON.parse(json) : json;
          container.appendChild(this.createControls());
          const root = this.createNode(null, data);
          container.appendChild(root);
        }
      }

      // Initialize the viewer
      const container = document.getElementById('${containerId}');
      const viewer = new JSONViewer(${JSON.stringify(options)});
      viewer.render(container.getAttribute('data-json'), container);
    })();
  `,

  /**
   * Generates the complete HTML output for the JSON viewer
   * @param {*} json - The JSON data to display
   * @param {Object} options - Viewer configuration options
   * @returns {string} The complete HTML output
   */
  generate: (json, options = {}) => {
    const containerId = JSONViewerModule.generateId();
    const jsonString = typeof json === 'string' ? JSON.stringify(JSON.parse(json)) : JSON.stringify(json);
    const escapedJsonString = jsonString.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    return `<style>${JSONViewerModule.getStyles()}</style><div id="${containerId}" class="json-viewer-container" data-json='${escapedJsonString}'></div><script>${JSONViewerModule.getScript(containerId, options)}</script>`;
  }
};

/**
 * Eleventy filter that generates a JSON viewer
 * @param {*} json - The JSON data to display
 * @param {Object} options - Viewer configuration options
 * @param {boolean} [options.showTypes=true] - Whether to show type labels
 * @param {boolean} [options.showCounts=true] - Whether to show count labels
 * @param {boolean} [options.defaultExpanded=false] - Whether nodes are expanded 
 * @returns {string} The complete HTML output
 */
export default async function jsonViewer(json, options = {}) {
  const processedJSON = await customStringify(json);
  return JSONViewerModule.generate(processedJSON, options);
} 