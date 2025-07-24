/**
 * ConnectionFlow.js - Implements the left-click + right-click connection creation
 * 
 * Provides intuitive connection creation without accidental connections
 */

export class ConnectionFlow {
    constructor(editor) {
        this.editor = editor;
        this.state = {
            isCreating: false,
            sourceNode: null,
            previewLine: null,
            validTargets: new Set(),
            mousePos: { x: 0, y: 0 }
        };
        
        // Visual feedback settings
        this.previewStyle = {
            stroke: '#B794F4',
            strokeWidth: 2,
            strokeDasharray: '5,5',
            opacity: 0.6
        };
        
        // Defer event listener setup until editor is ready
        if (this.editor.eventBus) {
            this.editor.eventBus.once('editor:ready', () => {
                this.setupEventListeners();
            });
        }
    }
    
    /**
     * Set up event listeners for connection creation
     */
    setupEventListeners() {
        // Ensure canvas exists
        if (!this.editor.canvas) {
            console.warn('ConnectionFlow: Canvas not available yet');
            return;
        }
        
        // Track mouse position
        this.editor.canvas.addEventListener('mousemove', (e) => {
            this.mousePos = this.editor.getMousePosition(e);
            
            if (this.state.isCreating) {
                this.updatePreviewLine();
                this.highlightValidTargets();
            }
        });
        
        // Cancel on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isCreating) {
                this.cancel();
            }
        });
        
        // Listen for node selection events
        this.editor.eventBus.on('node:leftClick', (data) => {
            this.handleNodeLeftClick(data.node, data.event);
        });
        
        this.editor.eventBus.on('node:rightClick', (data) => {
            this.handleNodeRightClick(data.node, data.event);
        });
        
        // Cancel on background click
        this.editor.eventBus.on('canvas:click', () => {
            if (this.state.isCreating) {
                this.cancel();
            }
        });
    }
    
    /**
     * Handle left-click on a node
     */
    handleNodeLeftClick(node, event) {
        // Only start connection if we're in select tool mode
        if (this.editor.currentTool !== 'select') return;
        
        // If already creating, cancel and start new
        if (this.state.isCreating) {
            this.cancel();
        }
        
        this.startConnection(node);
    }
    
    /**
     * Handle right-click on a node
     */
    handleNodeRightClick(node, event) {
        event.preventDefault();
        event.stopPropagation();
        
        // If we're creating a connection and this is a valid target
        if (this.state.isCreating && this.state.validTargets.has(node.id)) {
            this.completeConnection(node);
        } else if (!this.state.isCreating) {
            // Show context menu if not creating connection
            this.editor.contextMenu.show('node', {
                x: event.clientX,
                y: event.clientY,
                node: node
            });
        }
    }
    
    /**
     * Start creating a connection from a node
     */
    startConnection(sourceNode) {
        this.state.isCreating = true;
        this.state.sourceNode = sourceNode;
        
        // Visual feedback on source node
        sourceNode.element.classList.add('connection-source');
        
        // Create preview line
        this.createPreviewLine();
        
        // Calculate valid targets
        this.calculateValidTargets();
        
        // Show hint
        this.showHint();
        
        // Emit event
        this.editor.eventBus.emit('connection:started', { 
            source: sourceNode 
        });
    }
    
    /**
     * Complete the connection to a target node
     */
    completeConnection(targetNode) {
        if (!this.state.isCreating || !this.state.sourceNode) return;
        
        // Create the connection
        const connection = this.editor.connectionFactory.create({
            from: this.state.sourceNode.id,
            to: targetNode.id,
            type: this.determineConnectionType(),
            label: ''
        });
        
        // Add to state
        this.editor.state.addConnection(connection);
        
        // Emit event
        this.editor.eventBus.emit('connection:created', {
            connection: connection,
            source: this.state.sourceNode,
            target: targetNode
        });
        
        // Clean up
        this.cleanup();
        
        // Show success feedback
        this.showSuccessFeedback(connection);
    }
    
    /**
     * Cancel connection creation
     */
    cancel() {
        if (!this.state.isCreating) return;
        
        // Show cancel feedback
        this.showCancelFeedback();
        
        // Clean up
        this.cleanup();
        
        // Emit event
        this.editor.eventBus.emit('connection:cancelled');
    }
    
    /**
     * Create the preview line element
     */
    createPreviewLine() {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('class', 'connection-preview');
        line.setAttribute('fill', 'none');
        
        // Apply preview style
        Object.entries(this.previewStyle).forEach(([key, value]) => {
            line.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
        });
        
        // Add to canvas
        const connectionsGroup = this.editor.canvas.querySelector('.connections-layer');
        connectionsGroup.appendChild(line);
        
        this.state.previewLine = line;
        
        // Initial position
        this.updatePreviewLine();
    }
    
    /**
     * Update preview line to follow mouse
     */
    updatePreviewLine() {
        if (!this.state.previewLine || !this.state.sourceNode) return;
        
        const sourcePoint = this.getConnectionPoint(this.state.sourceNode, this.mousePos);
        const path = this.generateCurvedPath(sourcePoint, this.mousePos);
        
        this.state.previewLine.setAttribute('d', path);
    }
    
    /**
     * Calculate valid target nodes
     */
    calculateValidTargets() {
        this.state.validTargets.clear();
        
        this.editor.state.diagram.nodes.forEach(node => {
            // Can't connect to self
            if (node.id === this.state.sourceNode.id) return;
            
            // Can't create duplicate connections
            const existingConnection = this.editor.state.diagram.connections.values()
                .find(conn => 
                    (conn.from === this.state.sourceNode.id && conn.to === node.id) ||
                    (conn.to === this.state.sourceNode.id && conn.from === node.id)
                );
            
            if (!existingConnection) {
                this.state.validTargets.add(node.id);
            }
        });
    }
    
    /**
     * Highlight valid target nodes
     */
    highlightValidTargets() {
        // Remove previous highlights
        document.querySelectorAll('.connection-target').forEach(el => {
            el.classList.remove('connection-target');
        });
        
        // Highlight valid targets near mouse
        const threshold = 100; // pixels
        
        this.state.validTargets.forEach(nodeId => {
            const node = this.editor.state.diagram.nodes.get(nodeId);
            const distance = this.getDistanceToNode(node, this.mousePos);
            
            if (distance < threshold) {
                node.element.classList.add('connection-target');
                
                // Stronger highlight if very close
                if (distance < 30) {
                    node.element.classList.add('connection-target-active');
                } else {
                    node.element.classList.remove('connection-target-active');
                }
            }
        });
    }
    
    /**
     * Get optimal connection point on a node
     */
    getConnectionPoint(node, targetPos) {
        const bounds = node.getBounds();
        const center = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2
        };
        
        // Calculate angle to target
        const angle = Math.atan2(
            targetPos.y - center.y,
            targetPos.x - center.x
        );
        
        // Determine which side to connect from
        const sides = [
            { angle: 0, point: { x: bounds.x + bounds.width, y: center.y } }, // right
            { angle: Math.PI / 2, point: { x: center.x, y: bounds.y + bounds.height } }, // bottom
            { angle: Math.PI, point: { x: bounds.x, y: center.y } }, // left
            { angle: -Math.PI / 2, point: { x: center.x, y: bounds.y } } // top
        ];
        
        // Find closest side
        let closestSide = sides[0];
        let minDiff = Math.PI;
        
        sides.forEach(side => {
            const diff = Math.abs(angle - side.angle);
            if (diff < minDiff) {
                minDiff = diff;
                closestSide = side;
            }
        });
        
        return closestSide.point;
    }
    
    /**
     * Generate curved path between two points
     */
    generateCurvedPath(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate control points for bezier curve
        const curvature = Math.min(distance * 0.3, 50);
        
        const cp1 = {
            x: start.x + dx * 0.3,
            y: start.y + curvature
        };
        
        const cp2 = {
            x: end.x - dx * 0.3,
            y: end.y - curvature
        };
        
        return `M ${start.x},${start.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`;
    }
    
    /**
     * Get distance from mouse to node
     */
    getDistanceToNode(node, point) {
        const bounds = node.getBounds();
        const center = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2
        };
        
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Determine connection type based on node types
     */
    determineConnectionType() {
        // Logic to determine arrow type based on source/target node types
        const sourceType = this.state.sourceNode.data.shape;
        
        if (sourceType === 'diamond') {
            return 'arrow'; // Decision nodes use arrows
        }
        
        return 'line'; // Default
    }
    
    /**
     * Show hint for connection creation
     */
    showHint() {
        const hint = document.createElement('div');
        hint.className = 'connection-hint';
        hint.innerHTML = `
            <div class="hint-content">
                <span class="hint-icon">→</span>
                <span>Right-click target node to connect</span>
                <kbd>ESC</kbd> to cancel
            </div>
        `;
        
        hint.style.cssText = `
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: rgba(183, 148, 244, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(183, 148, 244, 0.3);
            border-radius: 24px;
            color: #B794F4;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideUp 0.3s ease-out;
            z-index: 1000;
        `;
        
        document.body.appendChild(hint);
        this.state.hint = hint;
    }
    
    /**
     * Show success feedback
     */
    showSuccessFeedback(connection) {
        // Briefly highlight the new connection
        connection.element.classList.add('connection-created');
        
        setTimeout(() => {
            connection.element.classList.remove('connection-created');
        }, 600);
    }
    
    /**
     * Show cancel feedback
     */
    showCancelFeedback() {
        // Brief red flash on preview line
        if (this.state.previewLine) {
            this.state.previewLine.style.stroke = '#EF4444';
            this.state.previewLine.style.opacity = '0';
        }
    }
    
    /**
     * Clean up connection creation state
     */
    cleanup() {
        // Remove visual elements
        if (this.state.previewLine) {
            this.state.previewLine.remove();
        }
        
        if (this.state.hint) {
            this.state.hint.style.opacity = '0';
            this.state.hint.style.transform = 'translateX(-50%) translateY(10px)';
            setTimeout(() => this.state.hint.remove(), 300);
        }
        
        // Remove classes
        if (this.state.sourceNode) {
            this.state.sourceNode.element.classList.remove('connection-source');
        }
        
        document.querySelectorAll('.connection-target, .connection-target-active').forEach(el => {
            el.classList.remove('connection-target', 'connection-target-active');
        });
        
        // Reset state
        this.state = {
            isCreating: false,
            sourceNode: null,
            previewLine: null,
            validTargets: new Set(),
            mousePos: { x: 0, y: 0 }
        };
    }
    
    /**
     * Destroy the connection flow handler
     */
    destroy() {
        this.cleanup();
        // Remove event listeners would go here
    }
}