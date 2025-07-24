
(function(window) {
    'use strict';
    
    // StateManager
    /**
 * State Manager - Centralized state management for Mermaid Editor
 * 
 * ARCHITECTURE:
 * - Single source of truth for application state
 * - Immutable updates with change tracking
 * - Observable pattern for state changes
 * - Undo/redo support
 * - Local storage persistence
 */

class StateManager {
    constructor() {
        this.state = {
            // Diagram elements
            nodes: new Map(),
            connections: new Map(),
            
            // Selection state
            selectedNode: null,
            selectedConnection: null,
            selectedNodes: new Set(),
            selectedConnections: new Set(),
            
            // Tool state
            currentTool: 'select',
            
            // UI state
            showGrid: true,
            zoom: 1,
            panX: 0,
            panY: 0,
            
            // Interaction state
            isDragging: false,
            isConnecting: false,
            isSelecting: false,
            isPanning: false,
            
            // History
            history: [],
            historyIndex: -1,
            maxHistorySize: 50,
            
            // Settings
            autoSave: true,
            snapToGrid: true,
            gridSize: 20
        };
        
        this.listeners = new Map();
        this.lastSaveTime = Date.now();
        
        this.init();
    }
    
    /**
     * Initialize state manager
     */
    init() {
        // Load from local storage
        this.loadState();
        
        // Set up auto-save
        if (this.state.autoSave) {
            setInterval(() => this.saveState(), 30000); // Save every 30 seconds
        }
        
        // Listen for visibility change to save
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.autoSave) {
                this.saveState();
            }
        });
    }
    
    /**
     * Get state value
     */
    get(path) {
        const keys = path.split('.');
        let value = this.state;
        
        for (const key of keys) {
            value = value[key];
            if (value === undefined) return undefined;
        }
        
        return value;
    }
    
    /**
     * Set state value with immutability
     */
    set(path, value) {
        const keys = path.split('.');
        const newState = this.deepClone(this.state);
        
        let target = newState;
        for (let i = 0; i < keys.length - 1; i++) {
            target = target[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        const oldValue = target[lastKey];
        target[lastKey] = value;
        
        // Add to history if significant change
        if (this.shouldAddToHistory(path, oldValue, value)) {
            this.addToHistory();
        }
        
        this.state = newState;
        this.notify(path, value, oldValue);
    }
    
    /**
     * Update multiple state values
     */
    update(updates) {
        const newState = this.deepClone(this.state);
        let hasChanges = false;
        
        Object.entries(updates).forEach(([path, value]) => {
            const keys = path.split('.');
            let target = newState;
            
            for (let i = 0; i < keys.length - 1; i++) {
                target = target[keys[i]];
            }
            
            const lastKey = keys[keys.length - 1];
            if (target[lastKey] !== value) {
                target[lastKey] = value;
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            this.addToHistory();
            this.state = newState;
            
            Object.entries(updates).forEach(([path, value]) => {
                this.notify(path, value, null);
            });
        }
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        
        this.listeners.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(path);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }
    
    /**
     * Notify listeners of state change
     */
    notify(path, newValue, oldValue) {
        // Notify specific path listeners
        const callbacks = this.listeners.get(path);
        if (callbacks) {
            callbacks.forEach(callback => {
                callback(newValue, oldValue, path);
            });
        }
        
        // Notify wildcard listeners
        const wildcardCallbacks = this.listeners.get('*');
        if (wildcardCallbacks) {
            wildcardCallbacks.forEach(callback => {
                callback(newValue, oldValue, path);
            });
        }
        
        // Emit custom event
        document.dispatchEvent(new CustomEvent('stateChanged', {
            detail: { path, newValue, oldValue }
        }));
    }
    
    /**
     * Add current state to history
     */
    addToHistory() {
        // Remove future history if we're not at the end
        if (this.historyIndex < this.state.history.length - 1) {
            this.state.history = this.state.history.slice(0, this.historyIndex + 1);
        }
        
        // Create snapshot
        const snapshot = {
            timestamp: Date.now(),
            nodes: this.serializeMap(this.state.nodes),
            connections: this.serializeMap(this.state.connections)
        };
        
        this.state.history.push(snapshot);
        this.historyIndex++;
        
        // Limit history size
        if (this.state.history.length > this.state.maxHistorySize) {
            this.state.history.shift();
            this.historyIndex--;
        }
    }
    
    /**
     * Undo last action
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreSnapshot(this.state.history[this.historyIndex]);
            this.notify('history', 'undo', null);
        }
    }
    
    /**
     * Redo last undone action
     */
    redo() {
        if (this.historyIndex < this.state.history.length - 1) {
            this.historyIndex++;
            this.restoreSnapshot(this.state.history[this.historyIndex]);
            this.notify('history', 'redo', null);
        }
    }
    
    /**
     * Restore state from snapshot
     */
    restoreSnapshot(snapshot) {
        // Clear current state
        this.state.nodes.clear();
        this.state.connections.clear();
        
        // Restore nodes
        snapshot.nodes.forEach(nodeData => {
            this.state.nodes.set(nodeData.id, nodeData);
        });
        
        // Restore connections with node references
        snapshot.connections.forEach(connData => {
            const connection = { ...connData };
            connection.from = this.state.nodes.get(connData.fromId);
            connection.to = this.state.nodes.get(connData.toId);
            this.state.connections.set(connection.id, connection);
        });
        
        // Emit restore event
        document.dispatchEvent(new CustomEvent('stateRestored', {
            detail: { snapshot }
        }));
    }
    
    /**
     * Save state to local storage
     */
    saveState() {
        const saveData = {
            timestamp: Date.now(),
            nodes: this.serializeMap(this.state.nodes),
            connections: this.serializeMap(this.state.connections),
            settings: {
                showGrid: this.state.showGrid,
                zoom: this.state.zoom,
                panX: this.state.panX,
                panY: this.state.panY,
                autoSave: this.state.autoSave,
                snapToGrid: this.state.snapToGrid,
                gridSize: this.state.gridSize
            }
        };
        
        localStorage.setItem('mermaidEditorState', JSON.stringify(saveData));
        this.lastSaveTime = Date.now();
        
        this.notify('save', 'completed', null);
    }
    
    /**
     * Load state from local storage
     */
    loadState() {
        const savedData = localStorage.getItem('mermaidEditorState');
        if (!savedData) return;
        
        try {
            const data = JSON.parse(savedData);
            
            // Load settings
            if (data.settings) {
                Object.assign(this.state, data.settings);
            }
            
            // Load nodes
            if (data.nodes) {
                data.nodes.forEach(nodeData => {
                    this.state.nodes.set(nodeData.id, nodeData);
                });
            }
            
            // Load connections
            if (data.connections) {
                data.connections.forEach(connData => {
                    const connection = { ...connData };
                    connection.from = this.state.nodes.get(connData.fromId);
                    connection.to = this.state.nodes.get(connData.toId);
                    if (connection.from && connection.to) {
                        this.state.connections.set(connection.id, connection);
                    }
                });
            }
            
            this.notify('load', 'completed', null);
            
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
    
    /**
     * Clear all state
     */
    clear() {
        this.state.nodes.clear();
        this.state.connections.clear();
        this.state.selectedNodes.clear();
        this.state.selectedConnections.clear();
        this.state.selectedNode = null;
        this.state.selectedConnection = null;
        this.state.history = [];
        this.historyIndex = -1;
        
        this.notify('clear', 'completed', null);
    }
    
    /**
     * Export state
     */
    export() {
        return {
            nodes: this.serializeMap(this.state.nodes),
            connections: this.serializeMap(this.state.connections)
        };
    }
    
    /**
     * Import state
     */
    import(data) {
        this.clear();
        
        // Import nodes
        if (data.nodes) {
            data.nodes.forEach(nodeData => {
                this.state.nodes.set(nodeData.id, nodeData);
            });
        }
        
        // Import connections
        if (data.connections) {
            data.connections.forEach(connData => {
                const connection = { ...connData };
                connection.from = this.state.nodes.get(connData.fromId || connData.from);
                connection.to = this.state.nodes.get(connData.toId || connData.to);
                if (connection.from && connection.to) {
                    this.state.connections.set(connection.id, connection);
                }
            });
        }
        
        this.addToHistory();
        this.notify('import', 'completed', null);
    }
    
    /**
     * Helper: Serialize Map to Array
     */
    serializeMap(map) {
        const array = [];
        map.forEach(item => {
            const serialized = { ...item };
            
            // Handle connections: store node IDs instead of references
            if (serialized.from && serialized.from.id) {
                serialized.fromId = serialized.from.id;
                delete serialized.from;
            }
            if (serialized.to && serialized.to.id) {
                serialized.toId = serialized.to.id;
                delete serialized.to;
            }
            
            // Remove DOM elements
            delete serialized.element;
            delete serialized.shape;
            delete serialized.text;
            delete serialized.labelElement;
            
            array.push(serialized);
        });
        return array;
    }
    
    /**
     * Helper: Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Map) return new Map(obj);
        if (obj instanceof Set) return new Set(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    /**
     * Helper: Should add to history
     */
    shouldAddToHistory(path, oldValue, newValue) {
        // Don't add UI state changes to history
        const uiPaths = ['isDragging', 'isConnecting', 'isSelecting', 'isPanning', 'zoom', 'panX', 'panY'];
        if (uiPaths.some(uiPath => path.includes(uiPath))) {
            return false;
        }
        
        // Don't add if values are the same
        if (oldValue === newValue) {
            return false;
        }
        
        // Add significant changes
        return true;
    }
    
    /**
     * Get state summary for debugging
     */
    getSummary() {
        return {
            nodes: this.state.nodes.size,
            connections: this.state.connections.size,
            selectedNodes: this.state.selectedNodes.size,
            selectedConnections: this.state.selectedConnections.size,
            historySize: this.state.history.length,
            historyIndex: this.historyIndex,
            currentTool: this.state.currentTool,
            lastSave: new Date(this.lastSaveTime).toLocaleTimeString()
        };
    }
}

// Export singleton instance

    
    // Create singleton instance
    const stateManager = new StateManager();
    
    // NodeManager
    /**
 * Node Manager - Handles all node-related functionality
 * 
 * ARCHITECTURE:
 * - Single responsibility: Node creation, manipulation, and rendering
 * - Event-driven: Communicates via events, no direct dependencies
 * - Type-safe: Validates all node operations
 * - Memory-safe: Proper cleanup of DOM elements and event listeners
 */

class NodeManager {
    constructor(svgContainer, state) {
        this.svg = svgContainer;
        this.state = state;
        this.nodeDefaults = {
            width: 120,
            height: 60,
            fillColor: '#2D3748',
            borderColor: '#B794F4',
            borderWidth: 2,
            borderStyle: 'solid',
            textColor: '#F7FAFC',
            fontSize: 14,
            fontWeight: 'normal',
            shadow: false
        };
        
        this.nodeTypes = {
            rectangle: { 
                create: this.createRectangle.bind(this),
                mermaidSyntax: '[]'
            },
            diamond: { 
                create: this.createDiamond.bind(this),
                mermaidSyntax: '{}'
            },
            circle: { 
                create: this.createCircle.bind(this),
                mermaidSyntax: '(())'
            },
            parallelogram: { 
                create: this.createParallelogram.bind(this),
                mermaidSyntax: '[//]'
            },
            hexagon: { 
                create: this.createHexagon.bind(this),
                mermaidSyntax: '{{}}'
            }
        };
        
        this.setupEventListeners();
    }
    
    /**
     * Set up internal event listeners
     */
    setupEventListeners() {
        // Listen for node-related events
        document.addEventListener('createNode', (e) => this.handleCreateNode(e.detail));
        document.addEventListener('updateNode', (e) => this.handleUpdateNode(e.detail));
        document.addEventListener('deleteNode', (e) => this.handleDeleteNode(e.detail));
        document.addEventListener('duplicateNode', (e) => this.handleDuplicateNode(e.detail));
        document.addEventListener('selectNode', (e) => this.handleSelectNode(e.detail));
    }
    
    /**
     * Create a new node
     * @param {Object} config - Node configuration
     * @returns {Object} Created node data
     */
    createNode(config) {
        const nodeData = {
            id: config.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: config.type || 'rectangle',
            label: config.label || 'New Node',
            x: config.x || 100,
            y: config.y || 100,
            width: config.width || this.nodeDefaults.width,
            height: config.height || this.nodeDefaults.height,
            ...this.nodeDefaults,
            ...config
        };
        
        // Validate node type
        if (!this.nodeTypes[nodeData.type]) {
            throw new Error(`Invalid node type: ${nodeData.type}`);
        }
        
        // Create visual element
        const element = this.createNodeElement(nodeData);
        nodeData.element = element;
        
        // Add to state
        this.state.nodes.set(nodeData.id, nodeData);
        
        // Setup interactions
        this.setupNodeInteractions(element, nodeData);
        
        // Emit event
        this.emit('nodeCreated', nodeData);
        
        return nodeData;
    }
    
    /**
     * Create node visual element
     */
    createNodeElement(nodeData) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'node-group');
        g.setAttribute('id', `node-${nodeData.id}`);
        g.setAttribute('transform', `translate(${nodeData.x}, ${nodeData.y})`);
        
        // Create shape based on type
        const shape = this.nodeTypes[nodeData.type].create(nodeData);
        shape.setAttribute('class', 'node-shape');
        g.appendChild(shape);
        
        // Store shape reference
        nodeData.shape = shape;
        
        // Create text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'node-text');
        text.setAttribute('x', nodeData.width / 2);
        text.setAttribute('y', nodeData.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.style.fill = nodeData.textColor;
        text.style.fontSize = nodeData.fontSize + 'px';
        text.style.fontWeight = nodeData.fontWeight;
        text.textContent = nodeData.label;
        g.appendChild(text);
        
        // Store text reference
        nodeData.text = text;
        
        // Create connection points
        this.createConnectionPoints(g, nodeData);
        
        // Create resize handles
        this.createResizeHandles(g, nodeData);
        
        // Add to SVG
        const nodesGroup = this.svg.querySelector('#nodes') || this.svg;
        nodesGroup.appendChild(g);
        
        return g;
    }
    
    /**
     * Shape creation methods
     */
    createRectangle(nodeData) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 0);
        rect.setAttribute('y', 0);
        rect.setAttribute('width', nodeData.width);
        rect.setAttribute('height', nodeData.height);
        rect.setAttribute('rx', 8);
        rect.setAttribute('ry', 8);
        this.applyNodeStyles(rect, nodeData);
        return rect;
    }
    
    createDiamond(nodeData) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = `${nodeData.width/2},0 ${nodeData.width},${nodeData.height/2} ${nodeData.width/2},${nodeData.height} 0,${nodeData.height/2}`;
        polygon.setAttribute('points', points);
        this.applyNodeStyles(polygon, nodeData);
        return polygon;
    }
    
    createCircle(nodeData) {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', nodeData.width / 2);
        ellipse.setAttribute('cy', nodeData.height / 2);
        ellipse.setAttribute('rx', nodeData.width / 2);
        ellipse.setAttribute('ry', nodeData.height / 2);
        this.applyNodeStyles(ellipse, nodeData);
        return ellipse;
    }
    
    createParallelogram(nodeData) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const skew = 20;
        const points = `${skew},0 ${nodeData.width},0 ${nodeData.width-skew},${nodeData.height} 0,${nodeData.height}`;
        polygon.setAttribute('points', points);
        this.applyNodeStyles(polygon, nodeData);
        return polygon;
    }
    
    createHexagon(nodeData) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const inset = nodeData.width * 0.2;
        const points = `${inset},0 ${nodeData.width-inset},0 ${nodeData.width},${nodeData.height/2} ${nodeData.width-inset},${nodeData.height} ${inset},${nodeData.height} 0,${nodeData.height/2}`;
        polygon.setAttribute('points', points);
        this.applyNodeStyles(polygon, nodeData);
        return polygon;
    }
    
    /**
     * Apply styles to node shape
     */
    applyNodeStyles(shape, nodeData) {
        shape.style.fill = nodeData.fillColor;
        shape.style.stroke = nodeData.borderColor;
        shape.style.strokeWidth = nodeData.borderWidth + 'px';
        shape.style.strokeDasharray = 
            nodeData.borderStyle === 'dashed' ? '5,5' :
            nodeData.borderStyle === 'dotted' ? '2,2' : 'none';
        
        if (nodeData.shadow) {
            shape.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))';
        }
    }
    
    /**
     * Create connection points for node
     */
    createConnectionPoints(g, nodeData) {
        const points = [
            { class: 'top', x: nodeData.width/2, y: 0 },
            { class: 'right', x: nodeData.width, y: nodeData.height/2 },
            { class: 'bottom', x: nodeData.width/2, y: nodeData.height },
            { class: 'left', x: 0, y: nodeData.height/2 }
        ];
        
        points.forEach(point => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', `connection-point ${point.class}`);
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', 6);
            circle.style.fill = '#B794F4';
            circle.style.stroke = '#9F7AEA';
            circle.style.strokeWidth = '2';
            circle.style.opacity = '0';
            circle.style.cursor = 'crosshair';
            circle.style.transition = 'opacity 0.2s';
            g.appendChild(circle);
        });
    }
    
    /**
     * Create resize handles for node
     */
    createResizeHandles(g, nodeData) {
        const handles = [
            { class: 'resize-nw', x: 0, y: 0, cursor: 'nw-resize' },
            { class: 'resize-ne', x: nodeData.width, y: 0, cursor: 'ne-resize' },
            { class: 'resize-sw', x: 0, y: nodeData.height, cursor: 'sw-resize' },
            { class: 'resize-se', x: nodeData.width, y: nodeData.height, cursor: 'se-resize' },
            { class: 'resize-n', x: nodeData.width/2, y: 0, cursor: 'n-resize' },
            { class: 'resize-s', x: nodeData.width/2, y: nodeData.height, cursor: 's-resize' },
            { class: 'resize-w', x: 0, y: nodeData.height/2, cursor: 'w-resize' },
            { class: 'resize-e', x: nodeData.width, y: nodeData.height/2, cursor: 'e-resize' }
        ];
        
        handles.forEach(handle => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('class', `resize-handle ${handle.class}`);
            rect.setAttribute('x', handle.x - 4);
            rect.setAttribute('y', handle.y - 4);
            rect.setAttribute('width', 8);
            rect.setAttribute('height', 8);
            rect.setAttribute('rx', 2);
            rect.style.fill = '#B794F4';
            rect.style.stroke = '#9F7AEA';
            rect.style.strokeWidth = '1';
            rect.style.cursor = handle.cursor;
            rect.style.opacity = '0';
            rect.style.transition = 'opacity 0.2s';
            g.appendChild(rect);
        });
    }
    
    /**
     * Setup node interactions
     */
    setupNodeInteractions(element, nodeData) {
        // Show/hide handles on hover
        element.addEventListener('mouseenter', () => {
            if (this.state.selectedNode === nodeData || this.state.selectedNodes.has(nodeData.id)) {
                element.querySelectorAll('.connection-point, .resize-handle').forEach(el => {
                    el.style.opacity = '1';
                });
            }
        });
        
        element.addEventListener('mouseleave', () => {
            element.querySelectorAll('.connection-point, .resize-handle').forEach(el => {
                el.style.opacity = '0';
            });
        });
        
        // Mouse events
        element.addEventListener('mousedown', (e) => this.handleNodeMouseDown(e, nodeData));
        element.addEventListener('click', (e) => this.handleNodeClick(e, nodeData));
        element.addEventListener('dblclick', (e) => this.handleNodeDoubleClick(e, nodeData));
        element.addEventListener('contextmenu', (e) => this.handleNodeContextMenu(e, nodeData));
        
        // Resize handles
        element.querySelectorAll('.resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.handleResizeStart(e, nodeData, handle));
        });
        
        // Connection points
        element.querySelectorAll('.connection-point').forEach(point => {
            point.addEventListener('mousedown', (e) => this.handleConnectionPointMouseDown(e, nodeData, point));
        });
    }
    
    /**
     * Event handlers
     */
    handleNodeMouseDown(e, nodeData) {
        if (e.target.classList.contains('resize-handle') || 
            e.target.classList.contains('connection-point')) return;
        
        e.stopPropagation();
        this.emit('nodeMouseDown', { event: e, node: nodeData });
    }
    
    handleNodeClick(e, nodeData) {
        e.stopPropagation();
        this.emit('nodeClick', { event: e, node: nodeData });
    }
    
    handleNodeDoubleClick(e, nodeData) {
        e.stopPropagation();
        this.emit('nodeDoubleClick', { event: e, node: nodeData });
    }
    
    handleNodeContextMenu(e, nodeData) {
        e.preventDefault();
        e.stopPropagation();
        this.emit('nodeContextMenu', { event: e, node: nodeData });
    }
    
    handleResizeStart(e, nodeData, handle) {
        e.stopPropagation();
        this.emit('nodeResizeStart', { event: e, node: nodeData, handle });
    }
    
    handleConnectionPointMouseDown(e, nodeData, point) {
        e.stopPropagation();
        this.emit('connectionPointMouseDown', { event: e, node: nodeData, point });
    }
    
    /**
     * Update node
     */
    updateNode(nodeId, updates) {
        const nodeData = this.state.nodes.get(nodeId);
        if (!nodeData) return;
        
        // Check if type changed
        const typeChanged = updates.type && updates.type !== nodeData.type;
        
        // Update data
        Object.assign(nodeData, updates);
        
        if (typeChanged) {
            // Recreate node with new type
            this.recreateNode(nodeData);
        } else {
            // Update visual
            this.updateNodeVisual(nodeData);
        }
        
        this.emit('nodeUpdated', nodeData);
    }
    
    /**
     * Update node visual
     */
    updateNodeVisual(nodeData) {
        const element = nodeData.element;
        if (!element) return;
        
        // Update transform
        element.setAttribute('transform', `translate(${nodeData.x}, ${nodeData.y})`);
        
        // Update shape
        if (nodeData.shape) {
            this.applyNodeStyles(nodeData.shape, nodeData);
            
            // Update shape dimensions based on type
            if (nodeData.type === 'rectangle') {
                nodeData.shape.setAttribute('width', nodeData.width);
                nodeData.shape.setAttribute('height', nodeData.height);
            } else if (nodeData.type === 'diamond') {
                const points = `${nodeData.width/2},0 ${nodeData.width},${nodeData.height/2} ${nodeData.width/2},${nodeData.height} 0,${nodeData.height/2}`;
                nodeData.shape.setAttribute('points', points);
            } else if (nodeData.type === 'circle') {
                nodeData.shape.setAttribute('cx', nodeData.width/2);
                nodeData.shape.setAttribute('cy', nodeData.height/2);
                nodeData.shape.setAttribute('rx', nodeData.width/2);
                nodeData.shape.setAttribute('ry', nodeData.height/2);
            }
            // ... other types
        }
        
        // Update text
        if (nodeData.text) {
            nodeData.text.textContent = nodeData.label;
            nodeData.text.setAttribute('x', nodeData.width / 2);
            nodeData.text.setAttribute('y', nodeData.height / 2);
            nodeData.text.style.fill = nodeData.textColor;
            nodeData.text.style.fontSize = nodeData.fontSize + 'px';
            nodeData.text.style.fontWeight = nodeData.fontWeight;
        }
        
        // Update connection points and resize handles positions
        this.updateHandlePositions(nodeData);
    }
    
    /**
     * Recreate node with new type
     */
    recreateNode(nodeData) {
        const oldElement = nodeData.element;
        const parent = oldElement.parentNode;
        
        // Remove old element
        parent.removeChild(oldElement);
        
        // Create new element
        const newElement = this.createNodeElement(nodeData);
        nodeData.element = newElement;
        
        this.emit('nodeRecreated', nodeData);
    }
    
    /**
     * Update handle positions after resize
     */
    updateHandlePositions(nodeData) {
        const element = nodeData.element;
        if (!element) return;
        
        // Update connection points
        const connectionPoints = [
            { class: '.top', x: nodeData.width/2, y: 0 },
            { class: '.right', x: nodeData.width, y: nodeData.height/2 },
            { class: '.bottom', x: nodeData.width/2, y: nodeData.height },
            { class: '.left', x: 0, y: nodeData.height/2 }
        ];
        
        connectionPoints.forEach(point => {
            const circle = element.querySelector(`.connection-point${point.class}`);
            if (circle) {
                circle.setAttribute('cx', point.x);
                circle.setAttribute('cy', point.y);
            }
        });
        
        // Update resize handles
        const resizeHandles = [
            { class: '.resize-nw', x: 0, y: 0 },
            { class: '.resize-ne', x: nodeData.width, y: 0 },
            { class: '.resize-sw', x: 0, y: nodeData.height },
            { class: '.resize-se', x: nodeData.width, y: nodeData.height },
            { class: '.resize-n', x: nodeData.width/2, y: 0 },
            { class: '.resize-s', x: nodeData.width/2, y: nodeData.height },
            { class: '.resize-w', x: 0, y: nodeData.height/2 },
            { class: '.resize-e', x: nodeData.width, y: nodeData.height/2 }
        ];
        
        resizeHandles.forEach(handle => {
            const rect = element.querySelector(handle.class);
            if (rect) {
                rect.setAttribute('x', handle.x - 4);
                rect.setAttribute('y', handle.y - 4);
            }
        });
    }
    
    /**
     * Delete node
     */
    deleteNode(nodeId) {
        const nodeData = this.state.nodes.get(nodeId);
        if (!nodeData) return;
        
        // Remove element
        if (nodeData.element && nodeData.element.parentNode) {
            nodeData.element.parentNode.removeChild(nodeData.element);
        }
        
        // Remove from state
        this.state.nodes.delete(nodeId);
        
        this.emit('nodeDeleted', nodeData);
    }
    
    /**
     * Duplicate node
     */
    duplicateNode(nodeId) {
        const original = this.state.nodes.get(nodeId);
        if (!original) return;
        
        const duplicate = this.createNode({
            ...original,
            id: undefined, // Generate new ID
            x: original.x + 20,
            y: original.y + 20,
            label: original.label + ' (Copy)'
        });
        
        this.emit('nodeDuplicated', { original, duplicate });
        
        return duplicate;
    }
    
    /**
     * Get node at position
     */
    getNodeAtPosition(x, y) {
        for (const [id, node] of this.state.nodes) {
            if (x >= node.x && x <= node.x + node.width &&
                y >= node.y && y <= node.y + node.height) {
                return node;
            }
        }
        return null;
    }
    
    /**
     * Select node
     */
    selectNode(nodeId) {
        const nodeData = this.state.nodes.get(nodeId);
        if (!nodeData) return;
        
        // Clear previous selection
        if (this.state.selectedNode) {
            this.state.selectedNode.element.classList.remove('selected');
        }
        
        // Set new selection
        this.state.selectedNode = nodeData;
        nodeData.element.classList.add('selected');
        
        this.emit('nodeSelected', nodeData);
    }
    
    /**
     * Event emitter
     */
    emit(eventName, data) {
        document.dispatchEvent(new CustomEvent(`node:${eventName}`, { detail: data }));
    }
    
    /**
     * Event handler methods
     */
    handleCreateNode(config) {
        this.createNode(config);
    }
    
    handleUpdateNode(data) {
        this.updateNode(data.id, data);
    }
    
    handleDeleteNode(data) {
        this.deleteNode(data.id);
    }
    
    handleDuplicateNode(data) {
        this.duplicateNode(data.id);
    }
    
    handleSelectNode(data) {
        this.selectNode(data.id);
    }
    
    /**
     * Export nodes to Mermaid syntax
     */
    exportToMermaid() {
        const lines = ['graph TD'];
        
        this.state.nodes.forEach(node => {
            const syntax = this.nodeTypes[node.type].mermaidSyntax;
            const openBracket = syntax.charAt(0);
            const closeBracket = syntax.charAt(syntax.length - 1);
            lines.push(`    ${node.id}${openBracket}${node.label}${closeBracket}`);
        });
        
        return lines.join('\n');
    }
    
    /**
     * Clean up
     */
    destroy() {
        // Remove all nodes
        this.state.nodes.forEach(node => {
            if (node.element && node.element.parentNode) {
                node.element.parentNode.removeChild(node.element);
            }
        });
        
        // Clear state
        this.state.nodes.clear();
        
        // Remove event listeners
        document.removeEventListener('createNode', this.handleCreateNode);
        document.removeEventListener('updateNode', this.handleUpdateNode);
        document.removeEventListener('deleteNode', this.handleDeleteNode);
        document.removeEventListener('duplicateNode', this.handleDuplicateNode);
        document.removeEventListener('selectNode', this.handleSelectNode);
    }
}
    
    // ConnectionManager
    /**
 * Connection Manager - Handles all connection-related functionality
 * 
 * ARCHITECTURE:
 * - Single responsibility: Connection creation, manipulation, and rendering
 * - Works with NodeManager for endpoints
 * - Event-driven communication
 * - Automatic path calculation and updates
 */

class ConnectionManager {
    constructor(svgContainer, state) {
        this.svg = svgContainer;
        this.state = state;
        this.connectionDefaults = {
            strokeWidth: 2,
            strokeColor: '#FBB6CE',
            style: 'solid',
            arrowStyle: 'default',
            pathType: 'straight',
            animated: false
        };
        
        this.arrowMarkers = {
            default: { 
                path: 'M 0,0 L 10,5 L 0,10 z',
                viewBox: '0 0 10 10'
            },
            open: { 
                path: 'M 0,0 L 10,5 L 0,10',
                viewBox: '0 0 10 10'
            },
            dot: { 
                path: 'M 5,5 m -3,0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0',
                viewBox: '0 0 10 10'
            },
            diamond: { 
                path: 'M 0,5 L 5,0 L 10,5 L 5,10 z',
                viewBox: '0 0 10 10'
            }
        };
        
        this.setupEventListeners();
        this.createArrowMarkers();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        document.addEventListener('createConnection', (e) => this.handleCreateConnection(e.detail));
        document.addEventListener('updateConnection', (e) => this.handleUpdateConnection(e.detail));
        document.addEventListener('deleteConnection', (e) => this.handleDeleteConnection(e.detail));
        document.addEventListener('reverseConnection', (e) => this.handleReverseConnection(e.detail));
        
        // Listen for node updates to update connection paths
        document.addEventListener('node:nodeUpdated', (e) => this.updateNodeConnections(e.detail));
        document.addEventListener('node:nodeDeleted', (e) => this.removeNodeConnections(e.detail));
    }
    
    /**
     * Create arrow markers in SVG defs
     */
    createArrowMarkers() {
        let defs = this.svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svg.insertBefore(defs, this.svg.firstChild);
        }
        
        Object.entries(this.arrowMarkers).forEach(([style, config]) => {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', `arrow-${style}`);
            marker.setAttribute('viewBox', config.viewBox);
            marker.setAttribute('refX', '10');
            marker.setAttribute('refY', '5');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('orient', 'auto');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', config.path);
            path.setAttribute('fill', '#FBB6CE');
            path.setAttribute('class', 'arrow-marker');
            
            marker.appendChild(path);
            defs.appendChild(marker);
        });
    }
    
    /**
     * Create a new connection
     */
    createConnection(config) {
        // Validate endpoints
        if (!config.from || !config.to) {
            throw new Error('Connection requires from and to nodes');
        }
        
        const fromNode = typeof config.from === 'string' 
            ? this.state.nodes.get(config.from) 
            : config.from;
        const toNode = typeof config.to === 'string' 
            ? this.state.nodes.get(config.to) 
            : config.to;
        
        if (!fromNode || !toNode) {
            throw new Error('Invalid connection endpoints');
        }
        
        const connectionData = {
            id: config.id || `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: fromNode,
            to: toNode,
            label: config.label || '',
            ...this.connectionDefaults,
            ...config
        };
        
        // Create visual element
        const element = this.createConnectionElement(connectionData);
        connectionData.element = element;
        
        // Add to state
        this.state.connections.set(connectionData.id, connectionData);
        
        // Setup interactions
        this.setupConnectionInteractions(element, connectionData);
        
        // Calculate initial path
        this.updateConnectionPath(connectionData);
        
        this.emit('connectionCreated', connectionData);
        
        return connectionData;
    }
    
    /**
     * Create connection visual element
     */
    createConnectionElement(connectionData) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'connection-group');
        g.setAttribute('id', `connection-${connectionData.id}`);
        
        // Create path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'connection-path');
        path.setAttribute('id', `path-${connectionData.id}`);
        path.setAttribute('fill', 'none');
        path.style.stroke = connectionData.strokeColor;
        path.style.strokeWidth = connectionData.strokeWidth + 'px';
        path.style.strokeDasharray = 
            connectionData.style === 'dashed' ? '5,5' :
            connectionData.style === 'dotted' ? '2,2' : 'none';
        path.setAttribute('marker-end', `url(#arrow-${connectionData.arrowStyle})`);
        
        if (connectionData.animated) {
            path.style.animation = 'dash 20s linear infinite';
        }
        
        g.appendChild(path);
        
        // Create label if exists
        if (connectionData.label) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'connection-label');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.style.fill = '#F7FAFC';
            text.style.fontSize = '12px';
            text.style.backgroundColor = '#2D3748';
            text.style.padding = '2px 4px';
            text.textContent = connectionData.label;
            g.appendChild(text);
            connectionData.labelElement = text;
        }
        
        // Add to SVG
        const connectionsGroup = this.svg.querySelector('#connections') || this.svg;
        connectionsGroup.appendChild(g);
        
        return path;
    }
    
    /**
     * Setup connection interactions
     */
    setupConnectionInteractions(element, connectionData) {
        element.addEventListener('mouseenter', () => {
            element.style.strokeWidth = (connectionData.strokeWidth + 1) + 'px';
            element.style.cursor = 'pointer';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.strokeWidth = connectionData.strokeWidth + 'px';
        });
        
        element.addEventListener('click', (e) => this.handleConnectionClick(e, connectionData));
        element.addEventListener('dblclick', (e) => this.handleConnectionDoubleClick(e, connectionData));
        element.addEventListener('contextmenu', (e) => this.handleConnectionContextMenu(e, connectionData));
    }
    
    /**
     * Event handlers
     */
    handleConnectionClick(e, connectionData) {
        e.stopPropagation();
        this.emit('connectionClick', { event: e, connection: connectionData });
    }
    
    handleConnectionDoubleClick(e, connectionData) {
        e.stopPropagation();
        this.emit('connectionDoubleClick', { event: e, connection: connectionData });
    }
    
    handleConnectionContextMenu(e, connectionData) {
        e.preventDefault();
        e.stopPropagation();
        this.emit('connectionContextMenu', { event: e, connection: connectionData });
    }
    
    /**
     * Update connection path
     */
    updateConnectionPath(connectionData) {
        const from = connectionData.from;
        const to = connectionData.to;
        
        if (!from || !to) return;
        
        // Calculate connection points
        const fromPoint = this.getConnectionPoint(from, to);
        const toPoint = this.getConnectionPoint(to, from);
        
        // Generate path based on type
        let pathData;
        switch (connectionData.pathType) {
            case 'curved':
                pathData = this.getCurvedPath(fromPoint, toPoint);
                break;
            case 'step':
                pathData = this.getStepPath(fromPoint, toPoint);
                break;
            default:
                pathData = `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
        }
        
        connectionData.element.setAttribute('d', pathData);
        
        // Update label position if exists
        if (connectionData.labelElement) {
            const midPoint = {
                x: (fromPoint.x + toPoint.x) / 2,
                y: (fromPoint.y + toPoint.y) / 2
            };
            connectionData.labelElement.setAttribute('x', midPoint.x);
            connectionData.labelElement.setAttribute('y', midPoint.y);
        }
    }
    
    /**
     * Get optimal connection point on node
     */
    getConnectionPoint(fromNode, toNode) {
        const fromCenter = {
            x: fromNode.x + fromNode.width / 2,
            y: fromNode.y + fromNode.height / 2
        };
        
        const toCenter = {
            x: toNode.x + toNode.width / 2,
            y: toNode.y + toNode.height / 2
        };
        
        const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x);
        
        // Determine which side to connect from
        const sides = [
            { angle: 0, point: { x: fromNode.x + fromNode.width, y: fromCenter.y } }, // right
            { angle: Math.PI / 2, point: { x: fromCenter.x, y: fromNode.y + fromNode.height } }, // bottom
            { angle: Math.PI, point: { x: fromNode.x, y: fromCenter.y } }, // left
            { angle: -Math.PI / 2, point: { x: fromCenter.x, y: fromNode.y } } // top
        ];
        
        // Find closest side
        let closestSide = sides[0];
        let minDiff = Math.abs(angle - closestSide.angle);
        
        for (const side of sides) {
            const diff = Math.abs(angle - side.angle);
            if (diff < minDiff) {
                minDiff = diff;
                closestSide = side;
            }
        }
        
        return closestSide.point;
    }
    
    /**
     * Generate curved path
     */
    getCurvedPath(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const cx = from.x + dx / 2;
        const cy = from.y + dy / 2;
        
        // Create control points
        const c1x = from.x + dx * 0.5;
        const c1y = from.y;
        const c2x = to.x - dx * 0.5;
        const c2y = to.y;
        
        return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
    }
    
    /**
     * Generate step path
     */
    getStepPath(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal then vertical
            const midX = from.x + dx / 2;
            return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
        } else {
            // Vertical then horizontal
            const midY = from.y + dy / 2;
            return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
        }
    }
    
    /**
     * Update connection
     */
    updateConnection(connectionId, updates) {
        const connectionData = this.state.connections.get(connectionId);
        if (!connectionData) return;
        
        // Update data
        Object.assign(connectionData, updates);
        
        // Update visual
        if (connectionData.element) {
            connectionData.element.style.stroke = connectionData.strokeColor;
            connectionData.element.style.strokeWidth = connectionData.strokeWidth + 'px';
            connectionData.element.style.strokeDasharray = 
                connectionData.style === 'dashed' ? '5,5' :
                connectionData.style === 'dotted' ? '2,2' : 'none';
            
            if (connectionData.animated) {
                connectionData.element.style.animation = 'dash 20s linear infinite';
            } else {
                connectionData.element.style.animation = 'none';
            }
            
            connectionData.element.setAttribute('marker-end', `url(#arrow-${connectionData.arrowStyle})`);
            
            // Update arrow color
            const marker = this.svg.querySelector(`#arrow-${connectionData.arrowStyle} path`);
            if (marker) {
                marker.setAttribute('fill', connectionData.strokeColor);
            }
        }
        
        // Update label
        if (connectionData.labelElement) {
            connectionData.labelElement.textContent = connectionData.label || '';
        } else if (connectionData.label) {
            // Create label if doesn't exist
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'connection-label');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.style.fill = '#F7FAFC';
            text.style.fontSize = '12px';
            text.textContent = connectionData.label;
            connectionData.element.parentNode.appendChild(text);
            connectionData.labelElement = text;
        }
        
        // Update path
        this.updateConnectionPath(connectionData);
        
        this.emit('connectionUpdated', connectionData);
    }
    
    /**
     * Delete connection
     */
    deleteConnection(connectionId) {
        const connectionData = this.state.connections.get(connectionId);
        if (!connectionData) return;
        
        // Remove elements
        if (connectionData.element && connectionData.element.parentNode) {
            const parent = connectionData.element.parentNode;
            parent.parentNode.removeChild(parent); // Remove group
        }
        
        // Remove from state
        this.state.connections.delete(connectionId);
        
        this.emit('connectionDeleted', connectionData);
    }
    
    /**
     * Reverse connection direction
     */
    reverseConnection(connectionId) {
        const connectionData = this.state.connections.get(connectionId);
        if (!connectionData) return;
        
        // Swap endpoints
        const temp = connectionData.from;
        connectionData.from = connectionData.to;
        connectionData.to = temp;
        
        // Update path
        this.updateConnectionPath(connectionData);
        
        this.emit('connectionReversed', connectionData);
    }
    
    /**
     * Update all connections for a node
     */
    updateNodeConnections(nodeData) {
        this.state.connections.forEach(connection => {
            if (connection.from === nodeData || connection.to === nodeData) {
                this.updateConnectionPath(connection);
            }
        });
    }
    
    /**
     * Remove all connections for a node
     */
    removeNodeConnections(nodeData) {
        const toDelete = [];
        
        this.state.connections.forEach((connection, id) => {
            if (connection.from === nodeData || connection.to === nodeData) {
                toDelete.push(id);
            }
        });
        
        toDelete.forEach(id => this.deleteConnection(id));
    }
    
    /**
     * Select connection
     */
    selectConnection(connectionId) {
        const connectionData = this.state.connections.get(connectionId);
        if (!connectionData) return;
        
        // Clear previous selection
        if (this.state.selectedConnection) {
            this.state.selectedConnection.element.classList.remove('selected');
        }
        
        // Set new selection
        this.state.selectedConnection = connectionData;
        connectionData.element.classList.add('selected');
        
        this.emit('connectionSelected', connectionData);
    }
    
    /**
     * Get connections for node
     */
    getNodeConnections(nodeId) {
        const connections = {
            incoming: [],
            outgoing: []
        };
        
        this.state.connections.forEach(connection => {
            if (connection.to.id === nodeId) {
                connections.incoming.push(connection);
            }
            if (connection.from.id === nodeId) {
                connections.outgoing.push(connection);
            }
        });
        
        return connections;
    }
    
    /**
     * Event emitter
     */
    emit(eventName, data) {
        document.dispatchEvent(new CustomEvent(`connection:${eventName}`, { detail: data }));
    }
    
    /**
     * Event handlers
     */
    handleCreateConnection(data) {
        this.createConnection(data);
    }
    
    handleUpdateConnection(data) {
        this.updateConnection(data.id, data);
    }
    
    handleDeleteConnection(data) {
        this.deleteConnection(data.id);
    }
    
    handleReverseConnection(data) {
        this.reverseConnection(data.id);
    }
    
    /**
     * Export connections to Mermaid syntax
     */
    exportToMermaid() {
        const lines = [];
        
        this.state.connections.forEach(connection => {
            const fromId = connection.from.id;
            const toId = connection.to.id;
            const label = connection.label ? `|${connection.label}|` : '';
            lines.push(`    ${fromId} -->${label} ${toId}`);
        });
        
        return lines.join('\n');
    }
    
    /**
     * Clean up
     */
    destroy() {
        // Remove all connections
        this.state.connections.forEach(connection => {
            if (connection.element && connection.element.parentNode) {
                const parent = connection.element.parentNode;
                parent.parentNode.removeChild(parent);
            }
        });
        
        // Clear state
        this.state.connections.clear();
        
        // Remove event listeners
        document.removeEventListener('createConnection', this.handleCreateConnection);
        document.removeEventListener('updateConnection', this.handleUpdateConnection);
        document.removeEventListener('deleteConnection', this.handleDeleteConnection);
        document.removeEventListener('reverseConnection', this.handleReverseConnection);
    }
}
    
    // EditorCore
    /**
 * Editor Core - Main integration layer for the modular Mermaid Editor
 * 
 * ARCHITECTURE:
 * - Initializes and coordinates all manager modules
 * - Maps legacy event handlers to new event-driven architecture
 * - Provides unified API for editor operations
 * - Handles tool switching and interaction modes
 */






class EditorCore {
    constructor(config = {}) {
        this.config = {
            containerId: config.containerId || 'mermaid-editor',
            svgId: config.svgId || 'svg-container',
            canvasId: config.canvasId || 'editor-canvas',
            ...config
        };
        
        this.state = stateManager;
        this.modalSystem = window.modalSystem || modalSystem;
        
        this.interactionState = {
            isPanning: false,
            isSelecting: false,
            isConnecting: false,
            isDragging: false,
            isResizing: false,
            
            dragStart: null,
            selectionBox: null,
            connectionLine: null,
            resizeData: null
        };
        
        this.init();
    }
    
    /**
     * Initialize the editor
     */
    init() {
        // Get DOM elements
        this.container = document.getElementById(this.config.containerId);
        this.svg = document.getElementById(this.config.svgId);
        this.canvas = document.getElementById(this.config.canvasId);
        
        if (!this.container || !this.svg || !this.canvas) {
            throw new Error('Required DOM elements not found');
        }
        
        // Create SVG groups if they don't exist
        this.ensureSVGGroups();
        
        // Initialize managers
        this.nodeManager = new NodeManager(this.svg, this.state.state);
        this.connectionManager = new ConnectionManager(this.svg, this.state.state);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize from saved state
        this.restoreFromState();
        
        // Set initial tool
        this.setTool(this.state.get('currentTool') || 'select');
        
        console.log('Editor Core initialized');
    }
    
    /**
     * Ensure required SVG groups exist
     */
    ensureSVGGroups() {
        const groups = ['connections', 'nodes', 'interactions'];
        
        groups.forEach(id => {
            if (!this.svg.querySelector(`#${id}`)) {
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.setAttribute('id', id);
                this.svg.appendChild(g);
            }
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleCanvasContextMenu(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));
        
        // Node events
        document.addEventListener('node:nodeMouseDown', (e) => this.handleNodeMouseDown(e.detail));
        document.addEventListener('node:nodeClick', (e) => this.handleNodeClick(e.detail));
        document.addEventListener('node:nodeDoubleClick', (e) => this.handleNodeDoubleClick(e.detail));
        document.addEventListener('node:nodeContextMenu', (e) => this.handleNodeContextMenu(e.detail));
        document.addEventListener('node:nodeResizeStart', (e) => this.handleNodeResizeStart(e.detail));
        document.addEventListener('node:connectionPointMouseDown', (e) => this.handleConnectionStart(e.detail));
        
        // Connection events
        document.addEventListener('connection:connectionClick', (e) => this.handleConnectionClick(e.detail));
        document.addEventListener('connection:connectionDoubleClick', (e) => this.handleConnectionDoubleClick(e.detail));
        document.addEventListener('connection:connectionContextMenu', (e) => this.handleConnectionContextMenu(e.detail));
        
        // State events
        document.addEventListener('stateRestored', () => this.handleStateRestored());
        
        // Modal events
        document.addEventListener('modal:action', (e) => this.handleModalAction(e.detail));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Drag and drop for node palette
        this.setupDragDropHandlers();
    }
    
    /**
     * Handle canvas mouse down
     */
    handleCanvasMouseDown(e) {
        const point = this.getMousePosition(e);
        
        switch (this.state.get('currentTool')) {
            case 'select':
                this.startSelection(point);
                break;
            case 'node':
                this.createNodeAtPosition(point);
                break;
            case 'pan':
                this.startPanning(point);
                break;
        }
    }
    
    /**
     * Handle canvas mouse move
     */
    handleCanvasMouseMove(e) {
        const point = this.getMousePosition(e);
        
        if (this.interactionState.isSelecting) {
            this.updateSelection(point);
        } else if (this.interactionState.isPanning) {
            this.updatePanning(point);
        } else if (this.interactionState.isDragging) {
            this.updateNodeDrag(point);
        } else if (this.interactionState.isResizing) {
            this.updateNodeResize(point);
        } else if (this.interactionState.isConnecting) {
            this.updateConnectionLine(point);
        }
    }
    
    /**
     * Handle canvas mouse up
     */
    handleCanvasMouseUp(e) {
        if (this.interactionState.isSelecting) {
            this.endSelection();
        } else if (this.interactionState.isPanning) {
            this.endPanning();
        } else if (this.interactionState.isDragging) {
            this.endNodeDrag();
        } else if (this.interactionState.isResizing) {
            this.endNodeResize();
        } else if (this.interactionState.isConnecting) {
            this.endConnection(e);
        }
    }
    
    /**
     * Handle canvas context menu
     */
    handleCanvasContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const point = this.getMousePosition(e);
        
        // Use window.modalSystem to ensure proper reference
        if (window.modalSystem) {
            window.modalSystem.open('backgroundContext', {
                x: e.clientX,
                y: e.clientY,
                position: point
            });
        }
    }
    
    /**
     * Handle canvas double click
     */
    handleCanvasDoubleClick(e) {
        const point = this.getMousePosition(e);
        this.createNodeAtPosition(point);
    }
    
    /**
     * Handle node events
     */
    handleNodeMouseDown(detail) {
        const { event, node } = detail;
        
        if (this.state.get('currentTool') === 'select') {
            this.startNodeDrag(node, this.getMousePosition(event));
        }
    }
    
    handleNodeClick(detail) {
        const { event, node } = detail;
        
        if (event.ctrlKey || event.metaKey) {
            this.toggleNodeSelection(node);
        } else {
            this.selectNode(node);
        }
    }
    
    handleNodeDoubleClick(detail) {
        const { node } = detail;
        
        if (window.modalSystem) {
            window.modalSystem.open('nodeEdit', {
                node: node,
                onSave: (updates) => {
                    this.nodeManager.updateNode(node.id, updates);
                    this.updateCode();
                }
            });
        }
    }
    
    handleNodeContextMenu(detail) {
        const { event, node } = detail;
        
        // Check if multiple nodes are selected
        const selectedNodes = Array.from(this.state.get('selectedNodes'));
        const isMultiSelect = selectedNodes.length > 1 && selectedNodes.includes(node.id);
        
        if (window.modalSystem) {
            if (isMultiSelect) {
                window.modalSystem.open('multiNodeContext', {
                    x: event.clientX,
                    y: event.clientY,
                    nodes: selectedNodes.map(id => this.state.get('nodes').get(id))
                });
            } else {
                window.modalSystem.open('nodeContext', {
                    x: event.clientX,
                    y: event.clientY,
                    node: node
                });
            }
        }
    }
    
    handleNodeResizeStart(detail) {
        const { event, node, handle } = detail;
        
        this.interactionState.isResizing = true;
        this.interactionState.resizeData = {
            node: node,
            handle: handle,
            startPoint: this.getMousePosition(event),
            originalBounds: {
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height
            }
        };
    }
    
    /**
     * Handle connection events
     */
    handleConnectionClick(detail) {
        const { event, connection } = detail;
        
        if (event.ctrlKey || event.metaKey) {
            this.toggleConnectionSelection(connection);
        } else {
            this.selectConnection(connection);
        }
    }
    
    handleConnectionDoubleClick(detail) {
        const { connection } = detail;
        
        if (window.modalSystem) {
            window.modalSystem.open('connectionEdit', {
                connection: connection,
                onSave: (updates) => {
                    this.connectionManager.updateConnection(connection.id, updates);
                    this.updateCode();
                }
            });
        }
    }
    
    handleConnectionContextMenu(detail) {
        const { event, connection } = detail;
        
        // Check if multiple connections are selected
        const selectedConnections = Array.from(this.state.get('selectedConnections'));
        const isMultiSelect = selectedConnections.length > 1 && selectedConnections.includes(connection.id);
        
        if (window.modalSystem) {
            if (isMultiSelect) {
                window.modalSystem.open('multiConnectionContext', {
                    x: event.clientX,
                    y: event.clientY,
                    connections: selectedConnections.map(id => this.state.get('connections').get(id))
                });
            } else {
                window.modalSystem.open('connectionContext', {
                    x: event.clientX,
                    y: event.clientY,
                    connection: connection
                });
            }
        }
    }
    
    /**
     * Handle connection creation
     */
    handleConnectionStart(detail) {
        const { event, node, point } = detail;
        
        this.interactionState.isConnecting = true;
        this.interactionState.connectionStart = {
            node: node,
            point: point
        };
        
        // Create temporary connection line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'connection-preview');
        line.style.stroke = '#B794F4';
        line.style.strokeWidth = '2';
        line.style.strokeDasharray = '5,5';
        line.style.pointerEvents = 'none';
        
        const startPoint = this.getConnectionPoint(node, point.class);
        line.setAttribute('x1', startPoint.x);
        line.setAttribute('y1', startPoint.y);
        line.setAttribute('x2', startPoint.x);
        line.setAttribute('y2', startPoint.y);
        
        this.svg.querySelector('#interactions').appendChild(line);
        this.interactionState.connectionLine = line;
    }
    
    /**
     * Selection methods
     */
    startSelection(point) {
        this.clearSelection();
        
        this.interactionState.isSelecting = true;
        this.interactionState.dragStart = point;
        
        // Create selection box
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'selection-box');
        rect.style.fill = 'rgba(183, 148, 244, 0.1)';
        rect.style.stroke = '#B794F4';
        rect.style.strokeWidth = '1';
        rect.style.strokeDasharray = '5,5';
        rect.style.pointerEvents = 'none';
        
        this.svg.querySelector('#interactions').appendChild(rect);
        this.interactionState.selectionBox = rect;
    }
    
    updateSelection(point) {
        if (!this.interactionState.selectionBox) return;
        
        const start = this.interactionState.dragStart;
        const rect = {
            x: Math.min(start.x, point.x),
            y: Math.min(start.y, point.y),
            width: Math.abs(point.x - start.x),
            height: Math.abs(point.y - start.y)
        };
        
        this.interactionState.selectionBox.setAttribute('x', rect.x);
        this.interactionState.selectionBox.setAttribute('y', rect.y);
        this.interactionState.selectionBox.setAttribute('width', rect.width);
        this.interactionState.selectionBox.setAttribute('height', rect.height);
        
        // Find nodes in selection
        this.state.get('nodes').forEach(node => {
            const inSelection = this.isNodeInRect(node, rect);
            if (inSelection) {
                node.element.classList.add('selecting');
            } else {
                node.element.classList.remove('selecting');
            }
        });
        
        // Find connections in selection
        this.state.get('connections').forEach(connection => {
            const inSelection = this.isConnectionInRect(connection, rect);
            if (inSelection) {
                connection.element.classList.add('selecting');
            } else {
                connection.element.classList.remove('selecting');
            }
        });
    }
    
    endSelection() {
        if (!this.interactionState.selectionBox) return;
        
        const start = this.interactionState.dragStart;
        const end = this.interactionState.selectionBox;
        const rect = {
            x: parseFloat(end.getAttribute('x')),
            y: parseFloat(end.getAttribute('y')),
            width: parseFloat(end.getAttribute('width')),
            height: parseFloat(end.getAttribute('height'))
        };
        
        // Select nodes in rectangle
        const selectedNodes = new Set();
        this.state.get('nodes').forEach(node => {
            node.element.classList.remove('selecting');
            if (this.isNodeInRect(node, rect)) {
                selectedNodes.add(node.id);
                node.element.classList.add('selected');
            }
        });
        
        // Select connections in rectangle
        const selectedConnections = new Set();
        this.state.get('connections').forEach(connection => {
            connection.element.classList.remove('selecting');
            if (this.isConnectionInRect(connection, rect)) {
                selectedConnections.add(connection.id);
                connection.element.classList.add('selected');
            }
        });
        
        // Update state
        this.state.set('selectedNodes', selectedNodes);
        this.state.set('selectedConnections', selectedConnections);
        
        // Clean up
        this.interactionState.selectionBox.remove();
        this.interactionState.selectionBox = null;
        this.interactionState.isSelecting = false;
        this.interactionState.dragStart = null;
    }
    
    /**
     * Node dragging
     */
    startNodeDrag(node, point) {
        this.interactionState.isDragging = true;
        this.interactionState.dragStart = point;
        this.interactionState.dragNodes = new Map();
        
        // If node is part of selection, drag all selected nodes
        const selectedNodes = this.state.get('selectedNodes');
        if (selectedNodes.has(node.id)) {
            selectedNodes.forEach(nodeId => {
                const n = this.state.get('nodes').get(nodeId);
                if (n) {
                    this.interactionState.dragNodes.set(nodeId, {
                        node: n,
                        offsetX: n.x - point.x,
                        offsetY: n.y - point.y
                    });
                }
            });
        } else {
            // Just drag this node
            this.interactionState.dragNodes.set(node.id, {
                node: node,
                offsetX: node.x - point.x,
                offsetY: node.y - point.y
            });
        }
    }
    
    updateNodeDrag(point) {
        if (!this.interactionState.isDragging) return;
        
        // Update all dragging nodes
        this.interactionState.dragNodes.forEach(({ node, offsetX, offsetY }) => {
            const newX = point.x + offsetX;
            const newY = point.y + offsetY;
            
            // Snap to grid if enabled
            const snapX = this.state.get('snapToGrid') ? 
                Math.round(newX / this.state.get('gridSize')) * this.state.get('gridSize') : newX;
            const snapY = this.state.get('snapToGrid') ? 
                Math.round(newY / this.state.get('gridSize')) * this.state.get('gridSize') : newY;
            
            this.nodeManager.updateNode(node.id, {
                x: snapX,
                y: snapY
            });
        });
    }
    
    endNodeDrag() {
        this.interactionState.isDragging = false;
        this.interactionState.dragNodes = null;
        this.interactionState.dragStart = null;
        
        // Save state after drag
        this.state.addToHistory();
        this.updateCode();
    }
    
    /**
     * Node resizing
     */
    updateNodeResize(point) {
        if (!this.interactionState.isResizing) return;
        
        const { node, handle, startPoint, originalBounds } = this.interactionState.resizeData;
        const dx = point.x - startPoint.x;
        const dy = point.y - startPoint.y;
        
        let updates = {};
        
        // Calculate new bounds based on handle
        if (handle.classList.contains('resize-nw')) {
            updates = {
                x: originalBounds.x + dx,
                y: originalBounds.y + dy,
                width: originalBounds.width - dx,
                height: originalBounds.height - dy
            };
        } else if (handle.classList.contains('resize-ne')) {
            updates = {
                y: originalBounds.y + dy,
                width: originalBounds.width + dx,
                height: originalBounds.height - dy
            };
        } else if (handle.classList.contains('resize-sw')) {
            updates = {
                x: originalBounds.x + dx,
                width: originalBounds.width - dx,
                height: originalBounds.height + dy
            };
        } else if (handle.classList.contains('resize-se')) {
            updates = {
                width: originalBounds.width + dx,
                height: originalBounds.height + dy
            };
        } else if (handle.classList.contains('resize-n')) {
            updates = {
                y: originalBounds.y + dy,
                height: originalBounds.height - dy
            };
        } else if (handle.classList.contains('resize-s')) {
            updates = {
                height: originalBounds.height + dy
            };
        } else if (handle.classList.contains('resize-w')) {
            updates = {
                x: originalBounds.x + dx,
                width: originalBounds.width - dx
            };
        } else if (handle.classList.contains('resize-e')) {
            updates = {
                width: originalBounds.width + dx
            };
        }
        
        // Apply minimum size constraints
        if (updates.width !== undefined) {
            updates.width = Math.max(60, updates.width);
        }
        if (updates.height !== undefined) {
            updates.height = Math.max(40, updates.height);
        }
        
        this.nodeManager.updateNode(node.id, updates);
    }
    
    endNodeResize() {
        this.interactionState.isResizing = false;
        this.interactionState.resizeData = null;
        
        // Save state after resize
        this.state.addToHistory();
        this.updateCode();
    }
    
    /**
     * Connection creation
     */
    updateConnectionLine(point) {
        if (!this.interactionState.connectionLine) return;
        
        this.interactionState.connectionLine.setAttribute('x2', point.x);
        this.interactionState.connectionLine.setAttribute('y2', point.y);
    }
    
    endConnection(e) {
        if (!this.interactionState.connectionLine) return;
        
        const point = this.getMousePosition(e);
        const targetNode = this.nodeManager.getNodeAtPosition(point.x, point.y);
        
        if (targetNode && targetNode !== this.interactionState.connectionStart.node) {
            // Create connection
            this.connectionManager.createConnection({
                from: this.interactionState.connectionStart.node,
                to: targetNode
            });
            
            this.state.addToHistory();
            this.updateCode();
        }
        
        // Clean up
        this.interactionState.connectionLine.remove();
        this.interactionState.connectionLine = null;
        this.interactionState.isConnecting = false;
        this.interactionState.connectionStart = null;
    }
    
    /**
     * Tool management
     */
    setTool(tool) {
        this.state.set('currentTool', tool);
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        // Update cursor
        switch (tool) {
            case 'select':
                this.canvas.style.cursor = 'default';
                break;
            case 'node':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'connection':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'pan':
                this.canvas.style.cursor = 'grab';
                break;
        }
    }
    
    /**
     * Selection helpers
     */
    clearSelection() {
        // Clear node selection
        this.state.get('selectedNodes').forEach(nodeId => {
            const node = this.state.get('nodes').get(nodeId);
            if (node && node.element) {
                node.element.classList.remove('selected');
            }
        });
        
        // Clear connection selection
        this.state.get('selectedConnections').forEach(connId => {
            const conn = this.state.get('connections').get(connId);
            if (conn && conn.element) {
                conn.element.classList.remove('selected');
            }
        });
        
        this.state.set('selectedNodes', new Set());
        this.state.set('selectedConnections', new Set());
        this.state.set('selectedNode', null);
        this.state.set('selectedConnection', null);
    }
    
    selectNode(node) {
        this.clearSelection();
        this.state.get('selectedNodes').add(node.id);
        this.state.set('selectedNode', node);
        node.element.classList.add('selected');
    }
    
    toggleNodeSelection(node) {
        const selectedNodes = this.state.get('selectedNodes');
        if (selectedNodes.has(node.id)) {
            selectedNodes.delete(node.id);
            node.element.classList.remove('selected');
        } else {
            selectedNodes.add(node.id);
            node.element.classList.add('selected');
        }
        this.state.set('selectedNodes', new Set(selectedNodes));
    }
    
    selectConnection(connection) {
        this.clearSelection();
        this.state.get('selectedConnections').add(connection.id);
        this.state.set('selectedConnection', connection);
        connection.element.classList.add('selected');
    }
    
    toggleConnectionSelection(connection) {
        const selectedConnections = this.state.get('selectedConnections');
        if (selectedConnections.has(connection.id)) {
            selectedConnections.delete(connection.id);
            connection.element.classList.remove('selected');
        } else {
            selectedConnections.add(connection.id);
            connection.element.classList.add('selected');
        }
        this.state.set('selectedConnections', new Set(selectedConnections));
    }
    
    /**
     * Create node at position
     */
    createNodeAtPosition(point) {
        const node = this.nodeManager.createNode({
            x: point.x - 60, // Center node at cursor
            y: point.y - 30,
            label: 'New Node'
        });
        
        this.selectNode(node);
        this.state.addToHistory();
        this.updateCode();
    }
    
    /**
     * Geometry helpers
     */
    getMousePosition(event) {
        const rect = this.svg.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }
    
    getConnectionPoint(node, pointClass) {
        switch (pointClass) {
            case 'top':
                return { x: node.x + node.width / 2, y: node.y };
            case 'right':
                return { x: node.x + node.width, y: node.y + node.height / 2 };
            case 'bottom':
                return { x: node.x + node.width / 2, y: node.y + node.height };
            case 'left':
                return { x: node.x, y: node.y + node.height / 2 };
            default:
                return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
        }
    }
    
    isNodeInRect(node, rect) {
        return node.x < rect.x + rect.width &&
               node.x + node.width > rect.x &&
               node.y < rect.y + rect.height &&
               node.y + node.height > rect.y;
    }
    
    isConnectionInRect(connection, rect) {
        // Simple check if either endpoint is in rect
        const from = connection.from;
        const to = connection.to;
        
        const fromInRect = this.isPointInRect(
            { x: from.x + from.width / 2, y: from.y + from.height / 2 }, 
            rect
        );
        const toInRect = this.isPointInRect(
            { x: to.x + to.width / 2, y: to.y + to.height / 2 }, 
            rect
        );
        
        return fromInRect || toInRect;
    }
    
    isPointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }
    
    /**
     * Code synchronization
     */
    updateCode() {
        const nodeCode = this.nodeManager.exportToMermaid();
        const connectionCode = this.connectionManager.exportToMermaid();
        
        const code = nodeCode + '\n' + connectionCode;
        
        // Emit event for code editor to update
        document.dispatchEvent(new CustomEvent('editor:codeUpdated', {
            detail: { code }
        }));
    }
    
    /**
     * Import from Mermaid code
     */
    importFromCode(code) {
        // This would parse Mermaid syntax and create nodes/connections
        // For now, just a placeholder
        console.log('Import from code:', code);
    }
    
    /**
     * State restoration
     */
    restoreFromState() {
        // Nodes and connections are already in state from StateManager
        // Just need to recreate visual elements
        
        this.state.get('nodes').forEach(nodeData => {
            const element = this.nodeManager.createNodeElement(nodeData);
            nodeData.element = element;
            this.nodeManager.setupNodeInteractions(element, nodeData);
        });
        
        this.state.get('connections').forEach(connectionData => {
            const element = this.connectionManager.createConnectionElement(connectionData);
            connectionData.element = element;
            this.connectionManager.setupConnectionInteractions(element, connectionData);
            this.connectionManager.updateConnectionPath(connectionData);
        });
    }
    
    handleStateRestored() {
        // Clear SVG
        ['connections', 'nodes'].forEach(id => {
            const group = this.svg.querySelector(`#${id}`);
            if (group) {
                group.innerHTML = '';
            }
        });
        
        // Restore visual elements
        this.restoreFromState();
    }
    
    /**
     * Modal action handler
     */
    handleModalAction(detail) {
        const { modalId, action, data } = detail;
        
        switch (action) {
            case 'deleteNode':
                this.nodeManager.deleteNode(data.nodeId);
                this.updateCode();
                break;
                
            case 'deleteConnection':
                this.connectionManager.deleteConnection(data.connectionId);
                this.updateCode();
                break;
                
            case 'duplicateNode':
                this.nodeManager.duplicateNode(data.nodeId);
                this.updateCode();
                break;
                
            case 'reverseConnection':
                this.connectionManager.reverseConnection(data.connectionId);
                this.updateCode();
                break;
                
            case 'batchUpdateNodes':
                data.nodeIds.forEach(id => {
                    this.nodeManager.updateNode(id, data.updates);
                });
                this.updateCode();
                break;
                
            case 'batchUpdateConnections':
                data.connectionIds.forEach(id => {
                    this.connectionManager.updateConnection(id, data.updates);
                });
                this.updateCode();
                break;
        }
    }
    
    /**
     * Keyboard shortcuts
     */
    handleKeyDown(e) {
        // Delete selected items
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            
            // Delete selected nodes
            this.state.get('selectedNodes').forEach(nodeId => {
                this.nodeManager.deleteNode(nodeId);
            });
            
            // Delete selected connections
            this.state.get('selectedConnections').forEach(connId => {
                this.connectionManager.deleteConnection(connId);
            });
            
            this.clearSelection();
            this.updateCode();
        }
        
        // Undo/Redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                this.state.redo();
            } else {
                this.state.undo();
            }
        }
        
        // Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.selectAll();
        }
        
        // Copy/Paste (would need clipboard implementation)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            this.copySelection();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            this.pasteSelection();
        }
    }
    
    /**
     * Select all elements
     */
    selectAll() {
        const selectedNodes = new Set();
        const selectedConnections = new Set();
        
        this.state.get('nodes').forEach(node => {
            selectedNodes.add(node.id);
            node.element.classList.add('selected');
        });
        
        this.state.get('connections').forEach(conn => {
            selectedConnections.add(conn.id);
            conn.element.classList.add('selected');
        });
        
        this.state.set('selectedNodes', selectedNodes);
        this.state.set('selectedConnections', selectedConnections);
    }
    
    /**
     * Clipboard operations (placeholder)
     */
    copySelection() {
        // Store selected items in clipboard format
        console.log('Copy selection');
    }
    
    pasteSelection() {
        // Paste from clipboard
        console.log('Paste selection');
    }
    
    /**
     * Set up drag and drop handlers for node palette
     */
    setupDragDropHandlers() {
        // Handle drag over
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        // Handle drop
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const nodeType = e.dataTransfer.getData('nodeType');
            if (!nodeType) return;
            
            const point = this.getMousePosition(e);
            const config = this.getNodeTypeConfig(nodeType);
            
            const node = this.nodeManager.createNode({
                x: point.x - 60, // Center on cursor
                y: point.y - 30,
                label: config.label || nodeType,
                shape: config.shape || 'rect',
                style: config.style || {}
            });
            
            this.selectNode(node);
            this.state.addToHistory();
            this.updateCode();
        });
    }
    
    /**
     * Get node type configuration
     */
    getNodeTypeConfig(type) {
        const configs = {
            'start': { label: 'Start', shape: 'circle' },
            'process': { label: 'Process', shape: 'rect' },
            'decision': { label: 'Decision', shape: 'rhombus' },
            'end': { label: 'End', shape: 'circle' },
            'data': { label: 'Data', shape: 'parallelogram' },
            'subprocess': { label: 'Subprocess', shape: 'rect' }
        };
        
        return configs[type] || { label: type, shape: 'rect' };
    }
    
    /**
     * Clean up
     */
    destroy() {
        // Remove event listeners
        this.canvas.removeEventListener('mousedown', this.handleCanvasMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleCanvasMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleCanvasMouseUp);
        this.canvas.removeEventListener('contextmenu', this.handleCanvasContextMenu);
        this.canvas.removeEventListener('dblclick', this.handleCanvasDoubleClick);
        
        // Destroy managers
        this.nodeManager.destroy();
        this.connectionManager.destroy();
        
        console.log('Editor Core destroyed');
    }
}

// Export singleton instance

    
    // Create and expose editor instance
    window.EditorCore = EditorCore;
    window.editorCore = new EditorCore();
    
    // Also expose managers for direct access if needed
    window.editorManagers = {
        stateManager: stateManager,
        nodeManager: null,  // Will be set by EditorCore
        connectionManager: null  // Will be set by EditorCore
    };
    
    // Hook into EditorCore init to expose managers
    const originalInit = EditorCore.prototype.init;
    EditorCore.prototype.init = function() {
        originalInit.call(this);
        window.editorManagers.nodeManager = this.nodeManager;
        window.editorManagers.connectionManager = this.connectionManager;
    };
    
})(window);
