/**
 * Connection Manager - Handles all connection-related functionality
 * 
 * ARCHITECTURE:
 * - Single responsibility: Connection creation, manipulation, and rendering
 * - Works with NodeManager for endpoints
 * - Event-driven communication
 * - Automatic path calculation and updates
 */

export class ConnectionManager {
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