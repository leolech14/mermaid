/**
 * Node Manager - Handles all node-related functionality
 * 
 * ARCHITECTURE:
 * - Single responsibility: Node creation, manipulation, and rendering
 * - Event-driven: Communicates via events, no direct dependencies
 * - Type-safe: Validates all node operations
 * - Memory-safe: Proper cleanup of DOM elements and event listeners
 */

export class NodeManager {
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