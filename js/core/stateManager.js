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

export class StateManager {
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
export const stateManager = new StateManager();