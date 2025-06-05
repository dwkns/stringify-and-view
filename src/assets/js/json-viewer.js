class JSONViewer {
  constructor(options = {}) {
    this.options = {
      showTypes: options.showTypes ?? true,
      showCounts: options.showCounts ?? true,
      defaultExpanded: options.defaultExpanded ?? false,
      theme: options.theme ?? 'light'
    };
    
    this.isOptionKeyPressed = false;
    this.expandedNodes = new Set(); // Store expanded node paths
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = true;
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = false;
    });
  }

  getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  getCount(value) {
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length;
    return null;
  }

  createToggleButton() {
    const button = document.createElement('span');
    button.className = 'json-viewer-toggle';
    button.innerHTML = '▶';
    return button;
  }

  createTypeLabel(type) {
    const label = document.createElement('span');
    label.className = 'json-viewer-type';
    label.textContent = type;
    return label;
  }

  createCountLabel(count) {
    const label = document.createElement('span');
    label.className = 'json-viewer-count';
    label.textContent = `(${count})`;
    return label;
  }

  createValueElement(value) {
    const element = document.createElement('span');
    element.className = 'json-viewer-value';
    
    if (value === null) {
      element.textContent = 'null';
      element.classList.add('json-viewer-null');
    } else if (typeof value === 'string') {
      element.textContent = `"${value}"`;
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

  getNodePath(node) {
    const path = [];
    let current = node;
    while (current && current !== this.container) {
      const key = current.getAttribute('data-key');
      if (key !== null) {
        path.unshift(key);
      }
      current = current.parentElement;
    }
    return path.join('.');
  }

  createNode(key, value, depth = 0, path = '') {
    const node = document.createElement('div');
    node.className = 'json-viewer-node';
    node.style.marginLeft = `${depth * 12}px`;
    if (key !== null) {
      node.setAttribute('data-key', key);
    }

    const header = document.createElement('div');
    header.className = 'json-viewer-header';

    const type = this.getType(value);
    const count = this.getCount(value);

    if (type === 'object' || type === 'array') {
      const toggle = this.createToggleButton();
      const nodePath = path ? `${path}.${key}` : key;
      const isExpanded = this.expandedNodes.has(nodePath) || this.options.defaultExpanded;
      
      toggle.addEventListener('click', (e) => {
        if (this.isOptionKeyPressed) {
          this.toggleAll(node);
        } else {
          this.toggleNode(node, nodePath);
        }
      });
      node.appendChild(toggle);

      if (key !== null) {
        const keyElement = document.createElement('span');
        keyElement.className = 'json-viewer-key';
        keyElement.textContent = `${key}: `;
        header.appendChild(keyElement);
      }

      if (this.options.showTypes) {
        header.appendChild(this.createTypeLabel(type));
      }

      if (this.options.showCounts && count !== null) {
        header.appendChild(this.createCountLabel(count));
      }

      const content = document.createElement('div');
      content.className = 'json-viewer-content';
      content.style.display = isExpanded ? 'block' : 'none';
      if (isExpanded) {
        toggle.innerHTML = '▼';
      }

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
        keyElement.textContent = `${key}: `;
        header.appendChild(keyElement);
      }

      if (this.options.showTypes) {
        header.appendChild(this.createTypeLabel(type));
      }
      header.appendChild(this.createValueElement(value));
      node.appendChild(header);
    }

    return node;
  }

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

  render(json, container) {
    this.container = container;
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const root = this.createNode(null, data);
    container.appendChild(root);
  }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
  .json-viewer-node {
    font-family: monospace;
    line-height: 1.4;
  }

  .json-viewer-header {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .json-viewer-toggle {
    cursor: pointer;
    user-select: none;
    width: 16px;
    display: inline-block;
  }

  .json-viewer-key {
    color: #881391;
  }

  .json-viewer-string {
    color: #c41a16;
  }

  .json-viewer-number {
    color: #1c00cf;
  }

  .json-viewer-boolean {
    color: #0000ff;
  }

  .json-viewer-null {
    color: #808080;
  }

  .json-viewer-type {
    color: #808080;
    font-size: 0.8em;
    margin: 0 4px;
  }

  .json-viewer-count {
    color: #808080;
    font-size: 0.8em;
  }

  .json-viewer-date {
    color: #008000;
  }
`;
document.head.appendChild(style); 