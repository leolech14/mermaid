/**
 * NestedCanvas.js - Handles nested canvas architecture for hierarchical diagrams
 * 
 * This module implements the drag-into feature where nodes can contain their own canvases
 */

export class NestedCanvas {
    constructor(parentNode, editor) {
        this.id = `canvas_${parentNode.id}`;
        this.parentNode = parentNode;
        this.editor = editor;
        this.level = parentNode.level + 1;
        
        // Inner canvas state
        this.nodes = new Map();
        this.connections = new Map();
        
        // Visual properties
        this.zoom = 1.0;
        this.pan = { x: 0, y: 0 };
        this.bounds = { width: 800, height: 600 };
        
        // Rendering context
        this.element = null;
        this.isVisible = false;
        this.opacity = 1.0;
    }
    
    /**
     * Initialize the nested canvas
     */
    init() {
        this.createElement();
        this.setupEventHandlers();
        this.updateBounds();
    }
    
    /**
     * Create the SVG element for this canvas
     */
    createElement() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', this.id);
        svg.setAttribute('class', 'nested-canvas');
        svg.setAttribute('data-level', this.level);
        svg.style.position = 'absolute';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.opacity = '0';
        svg.style.pointerEvents = 'none';
        
        // Create groups for organization
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        connectionsGroup.setAttribute('id', `${this.id}_connections`);
        nodesGroup.setAttribute('id', `${this.id}_nodes`);
        
        svg.appendChild(defs);
        svg.appendChild(connectionsGroup);
        svg.appendChild(nodesGroup);
        
        this.element = svg;
    }
    
    /**
     * Handle drag-into operation
     */
    handleDragInto(draggedNodes) {
        const transaction = this.editor.state.beginTransaction();
        
        try {
            draggedNodes.forEach(node => {
                // Remove from parent canvas
                const parentCanvas = node.canvas;
                parentCanvas.removeNode(node.id);
                
                // Add to this canvas with adjusted position
                const relativePos = this.globalToLocal(node.x, node.y);
                node.x = relativePos.x;
                node.y = relativePos.y;
                node.canvas = this;
                node.level = this.level;
                
                this.addNode(node);
            });
            
            transaction.commit();
            this.editor.eventBus.emit('canvas:nodesTransferred', {
                nodes: draggedNodes,
                from: draggedNodes[0].canvas,
                to: this
            });
            
        } catch (error) {
            transaction.rollback();
            console.error('Failed to transfer nodes:', error);
        }
    }
    
    /**
     * Add a node to this canvas
     */
    addNode(node) {
        this.nodes.set(node.id, node);
        node.canvas = this;
        node.level = this.level;
        
        // Re-render the node in this canvas
        const nodesGroup = this.element.querySelector(`#${this.id}_nodes`);
        nodesGroup.appendChild(node.element);
        
        // Update node's transform for new canvas
        this.updateNodeTransform(node);
    }
    
    /**
     * Remove a node from this canvas
     */
    removeNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        this.nodes.delete(nodeId);
        node.element.remove();
        
        // Remove any connections to/from this node
        this.connections.forEach((conn, id) => {
            if (conn.from === nodeId || conn.to === nodeId) {
                this.removeConnection(id);
            }
        });
    }
    
    /**
     * Convert global coordinates to local canvas coordinates
     */
    globalToLocal(x, y) {
        const parentBounds = this.parentNode.getBounds();
        const canvasOffset = {
            x: parentBounds.x + this.pan.x,
            y: parentBounds.y + this.pan.y
        };
        
        return {
            x: (x - canvasOffset.x) / this.zoom,
            y: (y - canvasOffset.y) / this.zoom
        };
    }
    
    /**
     * Convert local canvas coordinates to global
     */
    localToGlobal(x, y) {
        const parentBounds = this.parentNode.getBounds();
        const canvasOffset = {
            x: parentBounds.x + this.pan.x,
            y: parentBounds.y + this.pan.y
        };
        
        return {
            x: x * this.zoom + canvasOffset.x,
            y: y * this.zoom + canvasOffset.y
        };
    }
    
    /**
     * Update canvas bounds based on parent node size
     */
    updateBounds() {
        const parentBounds = this.parentNode.getBounds();
        this.bounds = {
            width: parentBounds.width * 0.9, // 90% of parent
            height: parentBounds.height * 0.9
        };
        
        if (this.element) {
            this.element.setAttribute('viewBox', 
                `0 0 ${this.bounds.width} ${this.bounds.height}`);
        }
    }
    
    /**
     * Render the canvas (called during X-ray vision or when parent is selected)
     */
    render(parentOpacity = 1.0) {
        if (!this.element) return;
        
        const targetOpacity = this.isVisible ? parentOpacity * 0.8 : 0;
        
        // Animate opacity change
        this.element.style.transition = 'opacity 300ms ease-out';
        this.element.style.opacity = targetOpacity;
        this.element.style.pointerEvents = this.isVisible ? 'auto' : 'none';
        
        // Position relative to parent
        const parentBounds = this.parentNode.getBounds();
        this.element.style.left = `${parentBounds.x}px`;
        this.element.style.top = `${parentBounds.y}px`;
        this.element.style.width = `${parentBounds.width}px`;
        this.element.style.height = `${parentBounds.height}px`;
        
        // Update all child nodes
        this.nodes.forEach(node => {
            node.render(targetOpacity);
        });
        
        // Update connections
        this.connections.forEach(conn => {
            conn.render(targetOpacity);
        });
    }
    
    /**
     * Show canvas preview (miniature view)
     */
    showPreview() {
        if (!this.element) return;
        
        // Create miniature view
        const preview = this.element.cloneNode(true);
        preview.setAttribute('id', `${this.id}_preview`);
        preview.style.transform = 'scale(0.2)';
        preview.style.transformOrigin = 'top left';
        preview.style.pointerEvents = 'none';
        
        return preview;
    }
    
    /**
     * Export canvas state
     */
    export() {
        return {
            id: this.id,
            parentNodeId: this.parentNode.id,
            level: this.level,
            nodes: Array.from(this.nodes.values()).map(n => n.export()),
            connections: Array.from(this.connections.values()).map(c => c.export()),
            zoom: this.zoom,
            pan: this.pan
        };
    }
    
    /**
     * Import canvas state
     */
    import(data) {
        this.zoom = data.zoom || 1.0;
        this.pan = data.pan || { x: 0, y: 0 };
        
        // Import nodes
        data.nodes.forEach(nodeData => {
            const node = this.editor.nodeFactory.create(nodeData);
            this.addNode(node);
        });
        
        // Import connections
        data.connections.forEach(connData => {
            const conn = this.editor.connectionFactory.create(connData);
            this.addConnection(conn);
        });
    }
    
    /**
     * Destroy the canvas
     */
    destroy() {
        // Clean up all nodes
        this.nodes.forEach(node => node.destroy());
        this.nodes.clear();
        
        // Clean up all connections
        this.connections.forEach(conn => conn.destroy());
        this.connections.clear();
        
        // Remove element
        if (this.element) {
            this.element.remove();
        }
        
        this.editor.eventBus.emit('canvas:destroyed', { canvas: this });
    }
}