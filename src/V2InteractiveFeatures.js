/**
 * V2 Interactive Features
 * Adds all the interactive functionality from standalone to the modular V2 editor
 */

export class V2InteractiveFeatures {
    constructor(editor) {
        this.editor = editor;
        this.state = editor.state;
        this.eventBus = editor.eventBus;
        
        // Feature states
        this.draggedNodes = [];
        this.isSelecting = false;
        this.selectionBox = null;
        this.connectionPreview = null;
        
        this.setupFeatures();
    }
    
    setupFeatures() {
        // Wait for editor ready
        this.eventBus.once('editor:ready', () => {
            this.initializeNodeCreation();
            this.initializeNodeDragging();
            this.initializeSelection();
            this.initializeConnections();
            this.initializeKeyboardShortcuts();
            this.initializeContextMenus();
            this.initializeNodePalette();
        });
    }
    
    /**
     * Node Creation - Right-click on canvas
     */
    initializeNodeCreation() {
        const canvas = this.editor.mainCanvas.element;
        if (!canvas) return;
        
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const point = this.editor.mainCanvas.screenToCanvas(e.clientX, e.clientY);
            
            // Show context menu for node creation
            this.showCanvasContextMenu(e.clientX, e.clientY, point);
        });
    }
    
    showCanvasContextMenu(x, y, canvasPoint) {
        const menu = this.editor.contextMenu;
        if (!menu) return;
        
        const items = [
            {
                label: 'Create Process Node',
                icon: '📦',
                action: () => this.createNode('process', canvasPoint)
            },
            {
                label: 'Create Decision Node',
                icon: '💎',
                action: () => this.createNode('decision', canvasPoint)
            },
            {
                label: 'Create Start Node',
                icon: '🟢',
                action: () => this.createNode('start', canvasPoint)
            },
            {
                label: 'Create End Node',
                icon: '🔴',
                action: () => this.createNode('end', canvasPoint)
            },
            { divider: true },
            {
                label: 'Select All',
                icon: '⬚',
                action: () => this.selectAll()
            }
        ];
        
        menu.show(x, y, items);
    }
    
    createNode(type, position) {
        const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const nodeData = {
            id: nodeId,
            type: type,
            label: this.getDefaultLabel(type),
            position: {
                x: Math.round(position.x / 20) * 20, // Snap to grid
                y: Math.round(position.y / 20) * 20
            },
            size: { width: 120, height: 60 },
            style: this.getNodeStyle(type)
        };
        
        // Add to state
        this.state.update(`diagram.nodes.${nodeId}`, nodeData);
        
        // Emit event
        this.eventBus.emit('node:created', { node: nodeData });
        
        // Add to history
        this.editor.history.push({
            type: 'node:create',
            data: nodeData
        });
        
        return nodeData;
    }
    
    getDefaultLabel(type) {
        const labels = {
            start: 'Start',
            end: 'End',
            process: 'Process',
            decision: 'Decision'
        };
        return labels[type] || 'New Node';
    }
    
    getNodeStyle(type) {
        const styles = {
            start: {
                fill: 'var(--color-surface-2)',
                stroke: 'var(--color-success)',
                strokeWidth: 2,
                rx: 30
            },
            end: {
                fill: 'var(--color-surface-2)',
                stroke: 'var(--color-error)',
                strokeWidth: 2,
                rx: 30
            },
            process: {
                fill: 'var(--color-surface-2)',
                stroke: 'var(--color-primary)',
                strokeWidth: 2,
                rx: 8
            },
            decision: {
                fill: 'var(--color-surface-2)',
                stroke: 'var(--color-secondary)',
                strokeWidth: 2,
                rx: 8,
                transform: 'rotate(45deg)'
            }
        };
        return styles[type] || styles.process;
    }
    
    /**
     * Node Dragging
     */
    initializeNodeDragging() {
        this.eventBus.on('node:mousedown', ({ node, event }) => {
            if (this.state.get('ui.currentTool') !== 'select') return;
            
            // Add to selection if not selected
            if (!this.state.get('ui.selection.nodes').has(node.id)) {
                if (!event.ctrlKey && !event.metaKey) {
                    this.clearSelection();
                }
                this.selectNode(node);
            }
            
            // Start dragging
            this.startDragging(event);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.draggedNodes.length > 0) {
                this.updateDragging(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.draggedNodes.length > 0) {
                this.endDragging();
            }
        });
    }
    
    startDragging(event) {
        const selectedNodes = this.state.get('ui.selection.nodes');
        const canvas = this.editor.mainCanvas;
        
        this.draggedNodes = Array.from(selectedNodes).map(nodeId => {
            const node = this.state.get(`diagram.nodes.${nodeId}`);
            if (!node) return null;
            
            const mousePos = canvas.screenToCanvas(event.clientX, event.clientY);
            return {
                node: node,
                offset: {
                    x: mousePos.x - node.position.x,
                    y: mousePos.y - node.position.y
                }
            };
        }).filter(Boolean);
    }
    
    updateDragging(event) {
        const canvas = this.editor.mainCanvas;
        const mousePos = canvas.screenToCanvas(event.clientX, event.clientY);
        
        this.draggedNodes.forEach(({ node, offset }) => {
            const newPos = {
                x: Math.round((mousePos.x - offset.x) / 20) * 20,
                y: Math.round((mousePos.y - offset.y) / 20) * 20
            };
            
            // Update position
            this.state.update(`diagram.nodes.${node.id}.position`, newPos);
            
            // Update visual
            this.eventBus.emit('node:moved', {
                nodeId: node.id,
                position: newPos
            });
        });
        
        // Check for drag-into (nested canvas)
        this.checkDragInto(mousePos);
    }
    
    endDragging() {
        if (this.draggedNodes.length > 0) {
            // Record in history
            this.editor.history.push({
                type: 'nodes:move',
                data: this.draggedNodes.map(d => ({
                    nodeId: d.node.id,
                    from: d.originalPosition,
                    to: d.node.position
                }))
            });
        }
        
        this.draggedNodes = [];
        this.completeDragInto();
    }
    
    /**
     * Selection System
     */
    initializeSelection() {
        const canvas = this.editor.mainCanvas.element;
        
        canvas.addEventListener('mousedown', (e) => {
            if (e.target === canvas && this.state.get('ui.currentTool') === 'select') {
                this.startSelectionBox(e);
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (this.isSelecting) {
                this.updateSelectionBox(e);
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            if (this.isSelecting) {
                this.endSelectionBox();
            }
        });
    }
    
    startSelectionBox(event) {
        this.isSelecting = true;
        const canvas = this.editor.mainCanvas;
        this.selectionStart = canvas.screenToCanvas(event.clientX, event.clientY);
        
        // Create visual selection box
        this.selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.selectionBox.setAttribute('class', 'selection-box');
        this.selectionBox.style.fill = 'rgba(183, 148, 244, 0.1)';
        this.selectionBox.style.stroke = 'var(--color-primary)';
        this.selectionBox.style.strokeWidth = '1';
        this.selectionBox.style.strokeDasharray = '5, 5';
        
        canvas.element.appendChild(this.selectionBox);
    }
    
    updateSelectionBox(event) {
        if (!this.selectionBox) return;
        
        const canvas = this.editor.mainCanvas;
        const current = canvas.screenToCanvas(event.clientX, event.clientY);
        
        const x = Math.min(this.selectionStart.x, current.x);
        const y = Math.min(this.selectionStart.y, current.y);
        const width = Math.abs(current.x - this.selectionStart.x);
        const height = Math.abs(current.y - this.selectionStart.y);
        
        this.selectionBox.setAttribute('x', x);
        this.selectionBox.setAttribute('y', y);
        this.selectionBox.setAttribute('width', width);
        this.selectionBox.setAttribute('height', height);
        
        // Check which nodes are in selection
        this.updateNodesInSelection({ x, y, width, height });
    }
    
    endSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        this.isSelecting = false;
    }
    
    updateNodesInSelection(bounds) {
        const nodes = this.state.get('diagram.nodes');
        
        nodes.forEach((node, id) => {
            const inSelection = (
                node.position.x < bounds.x + bounds.width &&
                node.position.x + node.size.width > bounds.x &&
                node.position.y < bounds.y + bounds.height &&
                node.position.y + node.size.height > bounds.y
            );
            
            if (inSelection) {
                this.selectNode(node);
            }
        });
    }
    
    /**
     * Connection System
     */
    initializeConnections() {
        // Enhanced connection flow is handled by ConnectionFlow module
        // Add visual preview
        this.eventBus.on('connection:preview', ({ from, to }) => {
            this.showConnectionPreview(from, to);
        });
        
        this.eventBus.on('connection:preview:clear', () => {
            this.clearConnectionPreview();
        });
    }
    
    showConnectionPreview(from, to) {
        if (!this.connectionPreview) {
            this.connectionPreview = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            this.connectionPreview.setAttribute('class', 'connection-preview');
            this.connectionPreview.style.stroke = 'var(--color-primary)';
            this.connectionPreview.style.strokeWidth = '2';
            this.connectionPreview.style.strokeDasharray = '5, 5';
            this.connectionPreview.style.fill = 'none';
            this.connectionPreview.style.opacity = '0.6';
            
            this.editor.mainCanvas.element.appendChild(this.connectionPreview);
        }
        
        // Calculate path
        const x1 = from.position.x + from.size.width / 2;
        const y1 = from.position.y + from.size.height;
        const x2 = to.x || (to.position.x + to.size.width / 2);
        const y2 = to.y || to.position.y;
        
        const controlOffset = Math.abs(y2 - y1) * 0.5;
        const path = `M ${x1} ${y1} C ${x1} ${y1 + controlOffset}, ${x2} ${y2 - controlOffset}, ${x2} ${y2}`;
        
        this.connectionPreview.setAttribute('d', path);
    }
    
    clearConnectionPreview() {
        if (this.connectionPreview) {
            this.connectionPreview.remove();
            this.connectionPreview = null;
        }
    }
    
    /**
     * Keyboard Shortcuts
     */
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.deleteSelected();
            }
            // Select All
            else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.selectAll();
            }
            // Duplicate
            else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.duplicateSelected();
            }
            // Escape
            else if (e.key === 'Escape') {
                this.clearSelection();
                this.eventBus.emit('operation:cancel');
            }
        });
    }
    
    /**
     * Context Menus
     */
    initializeContextMenus() {
        this.eventBus.on('node:contextmenu', ({ node, event }) => {
            event.preventDefault();
            this.showNodeContextMenu(event.clientX, event.clientY, node);
        });
    }
    
    showNodeContextMenu(x, y, node) {
        const menu = this.editor.contextMenu;
        if (!menu) return;
        
        const items = [
            {
                label: 'Edit Label',
                icon: '✏️',
                action: () => this.editNodeLabel(node)
            },
            {
                label: 'Duplicate',
                icon: '📋',
                action: () => this.duplicateNode(node)
            },
            { divider: true },
            {
                label: 'Delete',
                icon: '🗑️',
                action: () => this.deleteNode(node)
            }
        ];
        
        menu.show(x, y, items);
    }
    
    /**
     * Node Palette
     */
    initializeNodePalette() {
        const palette = this.editor.container.querySelector('.sidebar-content');
        if (!palette) return;
        
        const nodeTypes = [
            { type: 'start', label: 'Start', icon: '🟢' },
            { type: 'process', label: 'Process', icon: '📦' },
            { type: 'decision', label: 'Decision', icon: '💎' },
            { type: 'end', label: 'End', icon: '🔴' }
        ];
        
        palette.innerHTML = '<h3>Node Palette</h3>';
        
        nodeTypes.forEach(nodeType => {
            const item = document.createElement('div');
            item.className = 'palette-item';
            item.innerHTML = `
                <span class="palette-icon">${nodeType.icon}</span>
                <span class="palette-label">${nodeType.label}</span>
            `;
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('nodeType', nodeType.type);
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            palette.appendChild(item);
        });
        
        // Setup drop zone
        const canvas = this.editor.mainCanvas.element;
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('nodeType');
            if (nodeType) {
                const pos = this.editor.mainCanvas.screenToCanvas(e.clientX, e.clientY);
                this.createNode(nodeType, pos);
            }
        });
    }
    
    /**
     * Helper Methods
     */
    selectNode(node) {
        this.state.update(`ui.selection.nodes`, (nodes) => {
            const newSet = new Set(nodes);
            newSet.add(node.id);
            return newSet;
        });
        
        this.eventBus.emit('node:selected', { node });
    }
    
    clearSelection() {
        this.state.update('ui.selection.nodes', new Set());
        this.state.update('ui.selection.connections', new Set());
        this.eventBus.emit('selection:cleared');
    }
    
    selectAll() {
        const allNodeIds = Array.from(this.state.get('diagram.nodes').keys());
        this.state.update('ui.selection.nodes', new Set(allNodeIds));
        
        const allConnIds = Array.from(this.state.get('diagram.connections').keys());
        this.state.update('ui.selection.connections', new Set(allConnIds));
        
        this.eventBus.emit('selection:all');
    }
    
    deleteSelected() {
        const selectedNodes = this.state.get('ui.selection.nodes');
        const selectedConns = this.state.get('ui.selection.connections');
        
        // Delete connections first
        selectedConns.forEach(id => {
            this.state.update(`diagram.connections.${id}`, undefined);
            this.eventBus.emit('connection:deleted', { id });
        });
        
        // Delete nodes and their connections
        selectedNodes.forEach(nodeId => {
            // Remove connections to/from this node
            const connections = this.state.get('diagram.connections');
            connections.forEach((conn, id) => {
                if (conn.from === nodeId || conn.to === nodeId) {
                    this.state.update(`diagram.connections.${id}`, undefined);
                    this.eventBus.emit('connection:deleted', { id });
                }
            });
            
            // Remove node
            this.state.update(`diagram.nodes.${nodeId}`, undefined);
            this.eventBus.emit('node:deleted', { id: nodeId });
        });
        
        this.clearSelection();
    }
    
    duplicateSelected() {
        const selectedNodes = this.state.get('ui.selection.nodes');
        const offset = 20;
        const newNodes = new Map();
        
        selectedNodes.forEach(nodeId => {
            const original = this.state.get(`diagram.nodes.${nodeId}`);
            if (original) {
                const newNode = this.createNode(original.type, {
                    x: original.position.x + offset,
                    y: original.position.y + offset
                });
                newNode.label = original.label + ' (Copy)';
                newNodes.set(nodeId, newNode.id);
            }
        });
        
        // Duplicate connections between selected nodes
        const connections = this.state.get('diagram.connections');
        connections.forEach(conn => {
            if (newNodes.has(conn.from) && newNodes.has(conn.to)) {
                this.createConnection(
                    newNodes.get(conn.from),
                    newNodes.get(conn.to),
                    conn.label
                );
            }
        });
    }
    
    createConnection(fromId, toId, label = '') {
        const connId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const connection = {
            id: connId,
            from: fromId,
            to: toId,
            label: label,
            style: {
                stroke: 'var(--color-primary)',
                strokeWidth: 2
            }
        };
        
        this.state.update(`diagram.connections.${connId}`, connection);
        this.eventBus.emit('connection:created', { connection });
        
        return connection;
    }
    
    // Nested Canvas (Drag-into)
    checkDragInto(mousePos) {
        // Implementation for nested canvas check
        const nodes = this.state.get('diagram.nodes');
        let targetNode = null;
        
        nodes.forEach((node, id) => {
            // Skip if node is being dragged
            if (this.draggedNodes.some(d => d.node.id === id)) return;
            
            const bounds = {
                left: node.position.x,
                top: node.position.y,
                right: node.position.x + node.size.width,
                bottom: node.position.y + node.size.height
            };
            
            if (mousePos.x >= bounds.left && mousePos.x <= bounds.right &&
                mousePos.y >= bounds.top && mousePos.y <= bounds.bottom) {
                targetNode = node;
            }
        });
        
        if (targetNode !== this.dragTarget) {
            if (this.dragTarget) {
                this.eventBus.emit('node:dragleave', { node: this.dragTarget });
            }
            if (targetNode) {
                this.eventBus.emit('node:dragenter', { node: targetNode });
            }
            this.dragTarget = targetNode;
        }
    }
    
    completeDragInto() {
        if (this.dragTarget && this.draggedNodes.length > 0) {
            // Create nested canvas
            this.eventBus.emit('canvas:nest', {
                parent: this.dragTarget,
                nodes: this.draggedNodes.map(d => d.node)
            });
        }
        
        this.dragTarget = null;
    }
}