/**
 * V2 Standalone Adapter
 * Bridges the standalone implementation features with V2 modular architecture
 */

export class V2StandaloneAdapter {
    constructor(editor) {
        this.editor = editor;
        this.eventBus = editor.eventBus;
        this.state = editor.state;
        
        // Feature flags
        this.features = {
            leftClickRightClickConnection: true,
            dragIntoNestedCanvas: true,
            xrayVision: true,
            spaceAndDragPan: true,
            curvedConnections: true,
            multiSelection: true,
            resizeHandles: true
        };
        
        this.setupAdapters();
    }
    
    setupAdapters() {
        this.setupConnectionAdapter();
        this.setupDragAdapter();
        this.setupXRayAdapter();
        this.setupPanAdapter();
        this.setupSelectionAdapter();
        this.setupResizeAdapter();
    }
    
    /**
     * Connection Creation Adapter
     * Implements left-click start, right-click end connection flow
     */
    setupConnectionAdapter() {
        let connectionStart = null;
        let isConnecting = false;
        
        // Left-click on node starts connection
        this.eventBus.on('node:click', ({ node, event }) => {
            if (this.state.get('ui.currentTool') === 'connection' && !event.button) {
                if (!isConnecting) {
                    connectionStart = node;
                    isConnecting = true;
                    this.state.update('ui.isConnecting', true);
                    this.state.update('ui.connectionStart', node.id);
                    this.eventBus.emit('connection:start', { node });
                } else {
                    // Left-click on another node completes connection
                    if (connectionStart && connectionStart.id !== node.id) {
                        this.createConnection(connectionStart, node);
                    }
                    this.resetConnectionState();
                }
            }
        });
        
        // Right-click on node completes connection
        this.eventBus.on('node:contextmenu', ({ node, event }) => {
            if (isConnecting && connectionStart && connectionStart.id !== node.id) {
                event.preventDefault();
                this.createConnection(connectionStart, node);
                this.resetConnectionState();
            }
        });
        
        // Cancel on escape
        this.eventBus.on('keyboard:escape', () => {
            if (isConnecting) {
                this.resetConnectionState();
                this.eventBus.emit('connection:cancelled');
            }
        });
        
        // Preview line while connecting
        this.eventBus.on('canvas:mousemove', ({ x, y }) => {
            if (isConnecting) {
                this.eventBus.emit('connection:preview', {
                    from: connectionStart,
                    to: { x, y }
                });
            }
        });
    }
    
    /**
     * Drag Into Nested Canvas Adapter
     * Handles dragging nodes into other nodes to create nested canvases
     */
    setupDragAdapter() {
        let draggedNodes = [];
        let potentialTarget = null;
        
        this.eventBus.on('selection:dragstart', ({ nodes }) => {
            draggedNodes = nodes;
        });
        
        this.eventBus.on('selection:drag', ({ x, y }) => {
            if (!this.features.dragIntoNestedCanvas) return;
            
            // Find potential drop target
            const target = this.findNodeAt(x, y, draggedNodes);
            
            if (target !== potentialTarget) {
                if (potentialTarget) {
                    this.eventBus.emit('node:dragleave', { node: potentialTarget });
                }
                if (target) {
                    this.eventBus.emit('node:dragenter', { node: target });
                }
                potentialTarget = target;
            }
        });
        
        this.eventBus.on('selection:dragend', ({ x, y }) => {
            if (potentialTarget && draggedNodes.length > 0) {
                this.createNestedCanvas(potentialTarget, draggedNodes);
                this.eventBus.emit('node:dragleave', { node: potentialTarget });
            }
            draggedNodes = [];
            potentialTarget = null;
        });
    }
    
    /**
     * X-Ray Vision Adapter
     * Toggles transparency to see nested canvases
     */
    setupXRayAdapter() {
        let xrayActive = false;
        
        this.eventBus.on('keyboard:keydown', ({ key, altKey }) => {
            if (key === 'x' && altKey && this.features.xrayVision) {
                xrayActive = !xrayActive;
                this.state.update('ui.xrayActive', xrayActive);
                this.eventBus.emit('xray:toggle', { active: xrayActive });
                
                if (xrayActive) {
                    this.activateXRayVision();
                } else {
                    this.deactivateXRayVision();
                }
            }
        });
    }
    
    /**
     * Space and Drag Pan Adapter
     */
    setupPanAdapter() {
        let spacePressed = false;
        let isPanning = false;
        let panStart = null;
        
        this.eventBus.on('keyboard:keydown', ({ code }) => {
            if (code === 'Space' && !spacePressed) {
                spacePressed = true;
                this.state.update('ui.spacePressed', true);
                this.eventBus.emit('cursor:change', { cursor: 'grab' });
            }
        });
        
        this.eventBus.on('keyboard:keyup', ({ code }) => {
            if (code === 'Space') {
                spacePressed = false;
                this.state.update('ui.spacePressed', false);
                if (!isPanning) {
                    this.eventBus.emit('cursor:change', { cursor: 'default' });
                }
            }
        });
        
        this.eventBus.on('canvas:mousedown', ({ x, y, event }) => {
            if (spacePressed || event.shiftKey) {
                isPanning = true;
                panStart = { x: event.clientX, y: event.clientY };
                this.eventBus.emit('pan:start');
                this.eventBus.emit('cursor:change', { cursor: 'grabbing' });
            }
        });
        
        this.eventBus.on('canvas:mousemove', ({ event }) => {
            if (isPanning && panStart) {
                const dx = event.clientX - panStart.x;
                const dy = event.clientY - panStart.y;
                this.eventBus.emit('pan:move', { dx, dy });
            }
        });
        
        this.eventBus.on('canvas:mouseup', () => {
            if (isPanning) {
                isPanning = false;
                panStart = null;
                this.eventBus.emit('pan:end');
                this.eventBus.emit('cursor:change', { 
                    cursor: spacePressed ? 'grab' : 'default' 
                });
            }
        });
    }
    
    /**
     * Multi-Selection Adapter
     */
    setupSelectionAdapter() {
        let isSelecting = false;
        let selectionStart = null;
        
        this.eventBus.on('canvas:mousedown', ({ x, y, event }) => {
            if (this.state.get('ui.currentTool') === 'select' && !event.shiftKey) {
                isSelecting = true;
                selectionStart = { x, y };
                this.eventBus.emit('selection:boxstart', { x, y });
            }
        });
        
        this.eventBus.on('canvas:mousemove', ({ x, y }) => {
            if (isSelecting && selectionStart) {
                this.eventBus.emit('selection:boxupdate', {
                    start: selectionStart,
                    end: { x, y }
                });
            }
        });
        
        this.eventBus.on('canvas:mouseup', () => {
            if (isSelecting) {
                isSelecting = false;
                selectionStart = null;
                this.eventBus.emit('selection:boxend');
            }
        });
    }
    
    /**
     * Resize Handles Adapter
     */
    setupResizeAdapter() {
        this.eventBus.on('node:select', ({ node }) => {
            if (this.features.resizeHandles) {
                this.addResizeHandles(node);
            }
        });
        
        this.eventBus.on('node:deselect', ({ node }) => {
            this.removeResizeHandles(node);
        });
        
        this.eventBus.on('resize:start', ({ node, handle }) => {
            this.state.update('ui.isResizing', true);
            this.state.update('ui.resizeNode', node.id);
        });
        
        this.eventBus.on('resize:end', () => {
            this.state.update('ui.isResizing', false);
            this.state.update('ui.resizeNode', null);
        });
    }
    
    // Helper methods
    
    createConnection(fromNode, toNode) {
        const connection = {
            id: `conn_${Date.now()}`,
            from: fromNode.id,
            to: toNode.id,
            type: 'curved', // Use curved connections
            animated: this.state.get('preferences.animateConnections')
        };
        
        this.eventBus.emit('connection:create', connection);
        this.state.update(`diagram.connections.${connection.id}`, connection);
    }
    
    resetConnectionState() {
        this.state.update('ui.isConnecting', false);
        this.state.update('ui.connectionStart', null);
        this.eventBus.emit('connection:preview:clear');
    }
    
    findNodeAt(x, y, excludeNodes = []) {
        const nodes = this.state.get('diagram.nodes');
        const excludeIds = excludeNodes.map(n => n.id);
        
        for (const [id, node] of nodes) {
            if (excludeIds.includes(id)) continue;
            
            const bounds = this.getNodeBounds(node);
            if (x >= bounds.left && x <= bounds.right && 
                y >= bounds.top && y <= bounds.bottom) {
                return node;
            }
        }
        return null;
    }
    
    getNodeBounds(node) {
        return {
            left: node.position.x,
            top: node.position.y,
            right: node.position.x + node.size.width,
            bottom: node.position.y + node.size.height
        };
    }
    
    createNestedCanvas(targetNode, draggedNodes) {
        // Create nested canvas in target node
        const nestedCanvas = {
            id: `canvas_${targetNode.id}`,
            parent: targetNode.id,
            nodes: draggedNodes.map(n => ({
                ...n,
                position: {
                    x: n.position.x - targetNode.position.x,
                    y: n.position.y - targetNode.position.y
                }
            }))
        };
        
        this.eventBus.emit('canvas:nest', {
            target: targetNode,
            nested: nestedCanvas,
            nodes: draggedNodes
        });
        
        // Update state
        this.state.update(`diagram.canvases.${nestedCanvas.id}`, nestedCanvas);
        targetNode.canvas = nestedCanvas.id;
        
        // Remove dragged nodes from main canvas
        draggedNodes.forEach(node => {
            this.state.update(`diagram.nodes.${node.id}`, null);
        });
    }
    
    activateXRayVision() {
        const canvases = this.state.get('diagram.canvases');
        
        for (const [id, canvas] of canvases) {
            this.eventBus.emit('canvas:show', {
                canvas,
                opacity: 0.3,
                mode: 'xray'
            });
        }
        
        // Reduce opacity of top-level nodes
        this.eventBus.emit('nodes:opacity', { opacity: 0.3 });
    }
    
    deactivateXRayVision() {
        this.eventBus.emit('canvas:hideall', { mode: 'xray' });
        this.eventBus.emit('nodes:opacity', { opacity: 1.0 });
    }
    
    addResizeHandles(node) {
        const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
        
        handles.forEach(position => {
            this.eventBus.emit('handle:create', {
                type: 'resize',
                node: node.id,
                position
            });
        });
    }
    
    removeResizeHandles(node) {
        this.eventBus.emit('handle:remove', {
            type: 'resize',
            node: node.id
        });
    }
}