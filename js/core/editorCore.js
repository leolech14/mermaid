/**
 * Editor Core - Main integration layer for the modular Mermaid Editor
 * 
 * ARCHITECTURE:
 * - Initializes and coordinates all manager modules
 * - Maps legacy event handlers to new event-driven architecture
 * - Provides unified API for editor operations
 * - Handles tool switching and interaction modes
 */

import { NodeManager } from '../components/nodeManager.js';
import { ConnectionManager } from '../components/connectionManager.js';
import { stateManager } from './stateManager.js';
import { modalSystem } from './modalSystem.js';

export class EditorCore {
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
export const editorCore = new EditorCore();