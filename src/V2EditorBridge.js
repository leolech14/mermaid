/**
 * V2 Editor Bridge
 * Provides a compatibility layer between standalone features and V2 architecture
 * This allows gradual migration while maintaining functionality
 */

export class V2EditorBridge {
    constructor(config = {}) {
        this.config = {
            useStandaloneFeatures: true,
            enableV2Architecture: true,
            ...config
        };
        
        // Core systems (will be initialized based on what's available)
        this.eventBus = null;
        this.state = null;
        this.canvas = null;
        this.toolbar = null;
        
        // Feature implementations
        this.features = new Map();
        
        // Initialize based on available modules
        this.initializeAvailableModules();
    }
    
    initializeAvailableModules() {
        // Check what V2 modules are available
        const v2Modules = window.MermaidEditorV2 || {};
        
        // Initialize EventBus
        if (v2Modules.EventBus) {
            this.eventBus = new v2Modules.EventBus();
        } else {
            // Fallback to simple event emitter
            this.eventBus = this.createSimpleEventBus();
        }
        
        // Initialize StateManager
        if (v2Modules.StateManager) {
            this.state = new v2Modules.StateManager(this.getInitialState());
        } else {
            // Fallback to simple state
            this.state = this.createSimpleState();
        }
        
        // Setup feature bridges
        this.setupFeatureBridges();
    }
    
    createSimpleEventBus() {
        const events = new Map();
        
        return {
            on(event, handler) {
                if (!events.has(event)) events.set(event, []);
                events.get(event).push(handler);
            },
            
            emit(event, data) {
                const handlers = events.get(event) || [];
                handlers.forEach(handler => handler(data));
            },
            
            off(event, handler) {
                const handlers = events.get(event) || [];
                const index = handlers.indexOf(handler);
                if (index > -1) handlers.splice(index, 1);
            }
        };
    }
    
    createSimpleState() {
        let state = this.getInitialState();
        const subscribers = [];
        
        return {
            get(path) {
                if (!path) return state;
                return path.split('.').reduce((obj, key) => obj?.[key], state);
            },
            
            update(path, value) {
                const keys = path.split('.');
                const lastKey = keys.pop();
                const target = keys.reduce((obj, key) => {
                    if (!obj[key]) obj[key] = {};
                    return obj[key];
                }, state);
                
                target[lastKey] = value;
                subscribers.forEach(sub => sub(path, value));
            },
            
            subscribe(callback) {
                subscribers.push(callback);
                return () => {
                    const index = subscribers.indexOf(callback);
                    if (index > -1) subscribers.splice(index, 1);
                };
            }
        };
    }
    
    getInitialState() {
        return {
            diagram: {
                nodes: new Map(),
                connections: new Map(),
                canvases: new Map()
            },
            ui: {
                currentTool: 'select',
                zoom: 1.0,
                pan: { x: 0, y: 0 },
                selection: {
                    nodes: new Set(),
                    connections: new Set()
                },
                xrayActive: false,
                isConnecting: false,
                connectionStart: null
            },
            preferences: {
                theme: 'dark',
                snapToGrid: true,
                gridSize: 20,
                showGrid: true,
                animateConnections: true
            },
            history: {
                past: [],
                future: [],
                maxSize: 50
            }
        };
    }
    
    setupFeatureBridges() {
        // Connection creation (left-click/right-click)
        this.features.set('connectionFlow', {
            init: () => this.initConnectionFlow(),
            enabled: true
        });
        
        // Nested canvas (drag-into)
        this.features.set('nestedCanvas', {
            init: () => this.initNestedCanvas(),
            enabled: true
        });
        
        // X-ray vision
        this.features.set('xrayVision', {
            init: () => this.initXRayVision(),
            enabled: true
        });
        
        // Initialize all enabled features
        this.features.forEach((feature, name) => {
            if (feature.enabled) {
                console.log(`Initializing feature: ${name}`);
                feature.init();
            }
        });
    }
    
    // Feature Implementations
    
    initConnectionFlow() {
        let isConnecting = false;
        let startNode = null;
        
        // Left-click starts connection
        this.eventBus.on('node:click', ({ node, event }) => {
            if (this.state.get('ui.currentTool') === 'connection') {
                if (!event.button) { // Left click
                    if (!isConnecting) {
                        isConnecting = true;
                        startNode = node;
                        this.state.update('ui.isConnecting', true);
                        this.state.update('ui.connectionStart', node.id);
                        this.showConnectionPreview(node);
                    } else if (startNode && startNode.id !== node.id) {
                        this.createConnection(startNode, node);
                        this.resetConnectionState();
                    }
                }
            }
        });
        
        // Right-click completes connection
        this.eventBus.on('node:rightclick', ({ node, event }) => {
            if (isConnecting && startNode && startNode.id !== node.id) {
                event.preventDefault();
                this.createConnection(startNode, node);
                this.resetConnectionState();
            }
        });
        
        // Reset on escape
        this.eventBus.on('keyboard:escape', () => {
            if (isConnecting) {
                this.resetConnectionState();
            }
        });
        
        const resetConnectionState = () => {
            isConnecting = false;
            startNode = null;
            this.state.update('ui.isConnecting', false);
            this.state.update('ui.connectionStart', null);
            this.hideConnectionPreview();
        };
        
        this.resetConnectionState = resetConnectionState;
    }
    
    initNestedCanvas() {
        let draggedNodes = [];
        let targetNode = null;
        
        this.eventBus.on('nodes:dragstart', ({ nodes }) => {
            draggedNodes = nodes;
        });
        
        this.eventBus.on('nodes:drag', ({ x, y }) => {
            // Find potential drop target
            const newTarget = this.findNodeAt(x, y, draggedNodes);
            
            if (newTarget !== targetNode) {
                if (targetNode) {
                    this.eventBus.emit('node:dragleave', { node: targetNode });
                }
                if (newTarget) {
                    this.eventBus.emit('node:dragenter', { node: newTarget });
                }
                targetNode = newTarget;
            }
        });
        
        this.eventBus.on('nodes:dragend', () => {
            if (targetNode && draggedNodes.length > 0) {
                this.createNestedCanvas(targetNode, draggedNodes);
            }
            
            if (targetNode) {
                this.eventBus.emit('node:dragleave', { node: targetNode });
            }
            
            draggedNodes = [];
            targetNode = null;
        });
    }
    
    initXRayVision() {
        this.eventBus.on('keyboard:keydown', ({ key, altKey }) => {
            if (key === 'x' && altKey) {
                const xrayActive = !this.state.get('ui.xrayActive');
                this.state.update('ui.xrayActive', xrayActive);
                
                if (xrayActive) {
                    this.activateXRayMode();
                } else {
                    this.deactivateXRayMode();
                }
            }
        });
    }
    
    // Helper methods
    
    createConnection(fromNode, toNode) {
        const connection = {
            id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from: fromNode.id,
            to: toNode.id,
            type: 'curved',
            style: {
                stroke: 'var(--color-primary)',
                strokeWidth: 2
            }
        };
        
        this.state.get('diagram.connections').set(connection.id, connection);
        this.eventBus.emit('connection:created', { connection });
        
        // Add to history
        this.addToHistory({
            type: 'connection:create',
            data: connection
        });
    }
    
    showConnectionPreview(fromNode) {
        this.eventBus.emit('connection:preview:show', { fromNode });
    }
    
    hideConnectionPreview() {
        this.eventBus.emit('connection:preview:hide');
    }
    
    findNodeAt(x, y, excludeNodes = []) {
        const nodes = this.state.get('diagram.nodes');
        const excludeIds = new Set(excludeNodes.map(n => n.id));
        
        for (const [id, node] of nodes) {
            if (excludeIds.has(id)) continue;
            
            const bounds = {
                left: node.position.x,
                top: node.position.y,
                right: node.position.x + node.size.width,
                bottom: node.position.y + node.size.height
            };
            
            if (x >= bounds.left && x <= bounds.right &&
                y >= bounds.top && y <= bounds.bottom) {
                return node;
            }
        }
        
        return null;
    }
    
    createNestedCanvas(parentNode, nodes) {
        const canvasId = `canvas_${parentNode.id}`;
        
        const nestedCanvas = {
            id: canvasId,
            parentNodeId: parentNode.id,
            nodes: new Map(),
            connections: new Map()
        };
        
        // Transfer nodes to nested canvas
        nodes.forEach(node => {
            // Calculate relative position
            const relativePos = {
                x: node.position.x - parentNode.position.x,
                y: node.position.y - parentNode.position.y
            };
            
            // Add to nested canvas
            nestedCanvas.nodes.set(node.id, {
                ...node,
                position: relativePos,
                canvas: canvasId
            });
            
            // Remove from main canvas
            this.state.get('diagram.nodes').delete(node.id);
        });
        
        // Transfer relevant connections
        const connections = this.state.get('diagram.connections');
        const nodeIds = new Set(nodes.map(n => n.id));
        
        connections.forEach((conn, id) => {
            if (nodeIds.has(conn.from) && nodeIds.has(conn.to)) {
                nestedCanvas.connections.set(id, conn);
                connections.delete(id);
            }
        });
        
        // Store nested canvas
        this.state.get('diagram.canvases').set(canvasId, nestedCanvas);
        
        // Update parent node
        parentNode.hasCanvas = true;
        parentNode.canvasId = canvasId;
        
        this.eventBus.emit('canvas:nested', {
            parent: parentNode,
            canvas: nestedCanvas,
            nodes: nodes
        });
        
        // Add to history
        this.addToHistory({
            type: 'canvas:nest',
            data: { parentNode, nodes, canvasId }
        });
    }
    
    activateXRayMode() {
        // Apply visual effects
        const container = document.querySelector('.editor-container');
        if (container) {
            container.classList.add('xray-active');
        }
        
        // Show nested canvases
        const canvases = this.state.get('diagram.canvases');
        canvases.forEach((canvas, id) => {
            this.eventBus.emit('canvas:preview:show', {
                canvas,
                parentNodeId: canvas.parentNodeId
            });
        });
        
        this.eventBus.emit('xray:activated');
    }
    
    deactivateXRayMode() {
        const container = document.querySelector('.editor-container');
        if (container) {
            container.classList.remove('xray-active');
        }
        
        this.eventBus.emit('canvas:preview:hide:all');
        this.eventBus.emit('xray:deactivated');
    }
    
    addToHistory(action) {
        const history = this.state.get('history');
        
        // Clear future when new action is added
        history.future = [];
        
        // Add to past
        history.past.push(action);
        
        // Limit history size
        if (history.past.length > history.maxSize) {
            history.past.shift();
        }
        
        this.eventBus.emit('history:changed', { history });
    }
    
    undo() {
        const history = this.state.get('history');
        if (history.past.length === 0) return;
        
        const action = history.past.pop();
        history.future.unshift(action);
        
        // Reverse the action
        this.reverseAction(action);
        
        this.eventBus.emit('history:undo', { action });
    }
    
    redo() {
        const history = this.state.get('history');
        if (history.future.length === 0) return;
        
        const action = history.future.shift();
        history.past.push(action);
        
        // Replay the action
        this.replayAction(action);
        
        this.eventBus.emit('history:redo', { action });
    }
    
    reverseAction(action) {
        // Implement action reversal based on type
        switch (action.type) {
            case 'node:create':
                this.state.get('diagram.nodes').delete(action.data.id);
                break;
            case 'connection:create':
                this.state.get('diagram.connections').delete(action.data.id);
                break;
            // Add more action types as needed
        }
    }
    
    replayAction(action) {
        // Implement action replay based on type
        switch (action.type) {
            case 'node:create':
                this.state.get('diagram.nodes').set(action.data.id, action.data);
                break;
            case 'connection:create':
                this.state.get('diagram.connections').set(action.data.id, action.data);
                break;
            // Add more action types as needed
        }
    }
}

// Export as singleton for easy access
export const editorBridge = new V2EditorBridge();