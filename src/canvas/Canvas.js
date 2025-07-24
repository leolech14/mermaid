/**
 * Canvas - Main rendering surface with pixel-perfect support
 * Implements high-performance rendering with sub-pixel precision
 */

export class Canvas {
    constructor(container, editor) {
        this.container = container;
        this.editor = editor;
        this.id = `canvas_${Date.now()}`;
        
        // Create canvas elements
        this.createElements();
        
        // Setup high-DPI support
        this.setupHighDPI();
        
        // Initialize rendering context
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        
        // Rendering state
        this.renderState = {
            isDirty: true,
            lastRender: 0,
            renderQueue: new Set()
        };
        
        // Interaction state
        this.interactionState = {
            mousePosition: { x: 0, y: 0 },
            hoveredNode: null,
            activeConnections: new Set()
        };
        
        // Bind events
        this.bindEvents();
    }

    createElements() {
        // Create wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'canvas-wrapper';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.width = '100%';
        this.wrapper.style.height = '100%';
        this.wrapper.style.overflow = 'hidden';
        
        // Create main canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'main-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.cursor = 'default';
        
        // Create overlay for interactions
        this.overlay = document.createElement('div');
        this.overlay.className = 'canvas-overlay';
        this.overlay.style.position = 'absolute';
        this.overlay.style.left = '0';
        this.overlay.style.top = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.pointerEvents = 'none';
        
        // Append elements
        this.wrapper.appendChild(this.canvas);
        this.wrapper.appendChild(this.overlay);
        this.container.appendChild(this.wrapper);
    }

    setupHighDPI() {
        // Get device pixel ratio
        this.dpr = window.devicePixelRatio || 1;
        
        // Get display size
        const rect = this.wrapper.getBoundingClientRect();
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;
        
        // Set actual size in memory
        this.canvas.width = Math.floor(this.displayWidth * this.dpr);
        this.canvas.height = Math.floor(this.displayHeight * this.dpr);
        
        // Scale down using CSS
        this.canvas.style.width = this.displayWidth + 'px';
        this.canvas.style.height = this.displayHeight + 'px';
        
        // Store dimensions for calculations
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Keyboard events (when focused)
        this.canvas.tabIndex = 0;
        this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.canvas.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Observe container size changes
        this.resizeObserver = new ResizeObserver(entries => {
            this.handleResize();
        });
        this.resizeObserver.observe(this.wrapper);
    }

    // Rendering methods
    render() {
        if (!this.renderState.isDirty) return;
        
        const state = this.editor.state.get();
        const { zoom, pan } = state.ui;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Save context state
        this.ctx.save();
        
        // Apply DPI scaling
        this.ctx.scale(this.dpr, this.dpr);
        
        // Apply zoom and pan transformations
        this.ctx.translate(
            this.displayWidth / 2 + pan.x,
            this.displayHeight / 2 + pan.y
        );
        this.ctx.scale(zoom, zoom);
        this.ctx.translate(-this.displayWidth / 2, -this.displayHeight / 2);
        
        // Render background
        this.renderBackground();
        
        // Render grid if enabled
        if (state.ui.showGrid) {
            this.renderGrid();
        }
        
        // Render connections
        this.renderConnections(state.diagram.connections);
        
        // Render nodes
        this.renderNodes(state.diagram.nodes);
        
        // Render selection
        this.renderSelection();
        
        // Render interaction overlays
        this.renderInteractionOverlays();
        
        // Restore context state
        this.ctx.restore();
        
        this.renderState.isDirty = false;
        this.renderState.lastRender = performance.now();
    }

    renderBackground() {
        const theme = this.editor.options.theme;
        
        if (theme === 'dark') {
            // Apply gradient background for depth
            const gradient = this.ctx.createRadialGradient(
                this.displayWidth / 2, this.displayHeight / 2, 0,
                this.displayWidth / 2, this.displayHeight / 2, 
                Math.max(this.displayWidth, this.displayHeight)
            );
            gradient.addColorStop(0, '#1A1A1A');
            gradient.addColorStop(1, '#121212');
            
            this.ctx.fillStyle = gradient;
        } else {
            this.ctx.fillStyle = '#FFFFFF';
        }
        
        this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
    }

    renderGrid() {
        const gridSize = 20;
        const { zoom, pan } = this.editor.state.get().ui;
        
        // Calculate visible grid bounds
        const startX = Math.floor((-pan.x - this.displayWidth / 2) / zoom / gridSize) * gridSize;
        const endX = Math.ceil((-pan.x + this.displayWidth / 2) / zoom / gridSize) * gridSize;
        const startY = Math.floor((-pan.y - this.displayHeight / 2) / zoom / gridSize) * gridSize;
        const endY = Math.ceil((-pan.y + this.displayHeight / 2) / zoom / gridSize) * gridSize;
        
        // Set grid style
        this.ctx.strokeStyle = this.editor.options.theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)';
        this.ctx.lineWidth = 1 / zoom;
        
        // Draw vertical lines
        this.ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
            // Ensure pixel-perfect lines
            const pixelX = Math.round(x * zoom) / zoom;
            this.ctx.moveTo(pixelX, startY);
            this.ctx.lineTo(pixelX, endY);
        }
        
        // Draw horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            // Ensure pixel-perfect lines
            const pixelY = Math.round(y * zoom) / zoom;
            this.ctx.moveTo(startX, pixelY);
            this.ctx.lineTo(endX, pixelY);
        }
        
        this.ctx.stroke();
    }

    renderNodes(nodes) {
        // Convert Map to array and sort by z-index
        const nodeArray = Array.from(nodes.values()).sort((a, b) => {
            return (a.zIndex || 0) - (b.zIndex || 0);
        });
        
        nodeArray.forEach(node => {
            this.renderNode(node);
        });
    }

    renderNode(node) {
        const { x, y } = node.position;
        const { width, height } = node.size;
        
        // Apply pixel-perfect positioning
        const pixelX = Math.round(x);
        const pixelY = Math.round(y);
        
        // Node background with glass morphism
        this.ctx.save();
        
        // Create clipping path for rounded corners
        const radius = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(pixelX + radius, pixelY);
        this.ctx.lineTo(pixelX + width - radius, pixelY);
        this.ctx.quadraticCurveTo(pixelX + width, pixelY, pixelX + width, pixelY + radius);
        this.ctx.lineTo(pixelX + width, pixelY + height - radius);
        this.ctx.quadraticCurveTo(pixelX + width, pixelY + height, pixelX + width - radius, pixelY + height);
        this.ctx.lineTo(pixelX + radius, pixelY + height);
        this.ctx.quadraticCurveTo(pixelX, pixelY + height, pixelX, pixelY + height - radius);
        this.ctx.lineTo(pixelX, pixelY + radius);
        this.ctx.quadraticCurveTo(pixelX, pixelY, pixelX + radius, pixelY);
        this.ctx.closePath();
        
        // Fill background
        this.ctx.fillStyle = this.getNodeColor(node);
        this.ctx.fill();
        
        // Add glass effect overlay
        const gradient = this.ctx.createLinearGradient(pixelX, pixelY, pixelX, pixelY + height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = this.getNodeBorderColor(node);
        this.ctx.lineWidth = node.selected ? 2 : 1;
        this.ctx.stroke();
        
        // Render label
        this.ctx.fillStyle = this.editor.options.theme === 'dark' ? '#F7FAFC' : '#1A202C';
        this.ctx.font = `14px Inter, system-ui, -apple-system, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            node.label,
            pixelX + width / 2,
            pixelY + height / 2
        );
        
        // Render nested canvas indicator if present
        if (node.innerCanvas) {
            this.renderNestedCanvasIndicator(node);
        }
        
        this.ctx.restore();
    }

    renderConnections(connections) {
        const connectionArray = Array.from(connections.values());
        
        connectionArray.forEach(connection => {
            this.renderConnection(connection);
        });
    }

    renderConnection(connection) {
        const nodes = this.editor.state.get().diagram.nodes;
        const fromNode = nodes.get(connection.from);
        const toNode = nodes.get(connection.to);
        
        if (!fromNode || !toNode) return;
        
        // Calculate connection points
        const fromPoint = this.getConnectionPoint(fromNode, toNode);
        const toPoint = this.getConnectionPoint(toNode, fromNode);
        
        // Draw connection path
        this.ctx.beginPath();
        this.ctx.moveTo(fromPoint.x, fromPoint.y);
        
        // Use bezier curve for smooth connections
        const cp1x = fromPoint.x + (toPoint.x - fromPoint.x) * 0.5;
        const cp1y = fromPoint.y;
        const cp2x = toPoint.x - (toPoint.x - fromPoint.x) * 0.5;
        const cp2y = toPoint.y;
        
        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toPoint.x, toPoint.y);
        
        // Style
        this.ctx.strokeStyle = this.getConnectionColor(connection);
        this.ctx.lineWidth = connection.selected ? 3 : 2;
        this.ctx.stroke();
        
        // Draw arrow
        this.drawArrow(toPoint, Math.atan2(toPoint.y - cp2y, toPoint.x - cp2x));
        
        // Draw label if present
        if (connection.label) {
            const midX = (fromPoint.x + toPoint.x) / 2;
            const midY = (fromPoint.y + toPoint.y) / 2;
            
            this.ctx.fillStyle = this.editor.options.theme === 'dark' ? '#E2E8F0' : '#2D3748';
            this.ctx.font = '12px Inter, system-ui, -apple-system, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Background for label
            const metrics = this.ctx.measureText(connection.label);
            const padding = 4;
            this.ctx.fillStyle = this.editor.options.theme === 'dark' 
                ? 'rgba(26, 32, 44, 0.9)' 
                : 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(
                midX - metrics.width / 2 - padding,
                midY - 8 - padding,
                metrics.width + padding * 2,
                16 + padding * 2
            );
            
            // Label text
            this.ctx.fillStyle = this.editor.options.theme === 'dark' ? '#E2E8F0' : '#2D3748';
            this.ctx.fillText(connection.label, midX, midY);
        }
    }

    // Helper methods
    getNodeColor(node) {
        if (this.editor.options.theme === 'dark') {
            if (node.type === 'start') return '#22543D';
            if (node.type === 'end') return '#742A2A';
            if (node.type === 'decision') return '#744210';
            return '#2D3748';
        } else {
            if (node.type === 'start') return '#C6F6D5';
            if (node.type === 'end') return '#FED7E2';
            if (node.type === 'decision') return '#FEFCBF';
            return '#E2E8F0';
        }
    }

    getNodeBorderColor(node) {
        if (node.selected) {
            return '#BB86FC';
        }
        if (node === this.interactionState.hoveredNode) {
            return '#03DAC6';
        }
        return this.editor.options.theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.12)' 
            : 'rgba(0, 0, 0, 0.12)';
    }

    getConnectionColor(connection) {
        if (connection.selected) {
            return '#BB86FC';
        }
        if (this.interactionState.activeConnections.has(connection.id)) {
            return '#03DAC6';
        }
        return this.editor.options.theme === 'dark' ? '#718096' : '#A0AEC0';
    }

    getConnectionPoint(fromNode, toNode) {
        const fromCenter = {
            x: fromNode.position.x + fromNode.size.width / 2,
            y: fromNode.position.y + fromNode.size.height / 2
        };
        
        const toCenter = {
            x: toNode.position.x + toNode.size.width / 2,
            y: toNode.position.y + toNode.size.height / 2
        };
        
        const angle = Math.atan2(
            toCenter.y - fromCenter.y,
            toCenter.x - fromCenter.x
        );
        
        // Calculate intersection with node boundary
        const hw = fromNode.size.width / 2;
        const hh = fromNode.size.height / 2;
        
        let x, y;
        if (Math.abs(Math.cos(angle)) * hh > Math.abs(Math.sin(angle)) * hw) {
            // Intersects left or right edge
            x = fromCenter.x + Math.sign(Math.cos(angle)) * hw;
            y = fromCenter.y + Math.tan(angle) * Math.sign(Math.cos(angle)) * hw;
        } else {
            // Intersects top or bottom edge
            x = fromCenter.x + Math.sign(Math.sin(angle)) * hh / Math.tan(angle);
            y = fromCenter.y + Math.sign(Math.sin(angle)) * hh;
        }
        
        return { x, y };
    }

    drawArrow(point, angle) {
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        this.ctx.save();
        this.ctx.translate(point.x, point.y);
        this.ctx.rotate(angle);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-arrowLength, -arrowLength * Math.tan(arrowAngle));
        this.ctx.lineTo(-arrowLength, arrowLength * Math.tan(arrowAngle));
        this.ctx.closePath();
        
        this.ctx.fillStyle = this.ctx.strokeStyle;
        this.ctx.fill();
        
        this.ctx.restore();
    }

    renderNestedCanvasIndicator(node) {
        const { x, y } = node.position;
        const { width, height } = node.size;
        
        // Draw small icon in corner
        const iconSize = 16;
        const iconX = x + width - iconSize - 4;
        const iconY = y + 4;
        
        this.ctx.save();
        
        // Icon background
        this.ctx.fillStyle = 'rgba(187, 134, 252, 0.2)';
        this.ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        // Icon
        this.ctx.strokeStyle = '#BB86FC';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(iconX + 4, iconY + 4, 8, 8);
        this.ctx.strokeRect(iconX + 2, iconY + 2, 8, 8);
        
        this.ctx.restore();
    }

    renderSelection() {
        const state = this.editor.state.get();
        
        // Render selection box if selecting
        const selectionState = this.editor.state ? this.editor.state.get('ui.selection') : null;
        if (selectionState && selectionState.isSelecting && selectionState.selectionBox) {
            const { start, end } = selectionState.selectionBox;
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            
            this.ctx.strokeStyle = '#BB86FC';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(x, y, width, height);
            this.ctx.setLineDash([]);
            
            this.ctx.fillStyle = 'rgba(187, 134, 252, 0.1)';
            this.ctx.fillRect(x, y, width, height);
        }
    }

    renderInteractionOverlays() {
        // Render connection creation line
        const connectionState = this.editor.state ? this.editor.state.get('ui.connection') : null;
        if (connectionState && connectionState.isConnecting && connectionState.line) {
            const { start, end } = connectionState.line;
            
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            
            this.ctx.strokeStyle = '#03DAC6';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    // Event handlers
    handleMouseDown(e) {
        const point = this.getMousePosition(e);
        const transformedPoint = this.screenToCanvas(point);
        
        this.editor.eventBus.emit('canvas:mousedown', {
            point: transformedPoint,
            button: e.button,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey
        });
    }

    handleMouseMove(e) {
        const point = this.getMousePosition(e);
        const transformedPoint = this.screenToCanvas(point);
        
        this.interactionState.mousePosition = transformedPoint;
        
        // Check for hovered node
        const hoveredNode = this.getNodeAt(transformedPoint);
        if (hoveredNode !== this.interactionState.hoveredNode) {
            this.interactionState.hoveredNode = hoveredNode;
            this.markDirty();
        }
        
        this.editor.eventBus.emit('canvas:mousemove', {
            point: transformedPoint,
            delta: {
                x: e.movementX,
                y: e.movementY
            }
        });
    }

    handleMouseUp(e) {
        const point = this.getMousePosition(e);
        const transformedPoint = this.screenToCanvas(point);
        
        this.editor.eventBus.emit('canvas:mouseup', {
            point: transformedPoint,
            button: e.button
        });
    }

    handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.editor.eventBus.emit('canvas:zoom', delta);
    }

    handleContextMenu(e) {
        e.preventDefault();
        
        const point = this.getMousePosition(e);
        const transformedPoint = this.screenToCanvas(point);
        
        this.editor.eventBus.emit('canvas:contextmenu', {
            point: transformedPoint,
            screenPoint: point
        });
    }

    handleTouchStart(e) {
        const touches = Array.from(e.touches).map(touch => ({
            id: touch.identifier,
            point: this.screenToCanvas(this.getTouchPosition(touch))
        }));
        
        this.editor.eventBus.emit('canvas:touchstart', { touches });
    }

    handleTouchMove(e) {
        e.preventDefault();
        
        const touches = Array.from(e.touches).map(touch => ({
            id: touch.identifier,
            point: this.screenToCanvas(this.getTouchPosition(touch))
        }));
        
        this.editor.eventBus.emit('canvas:touchmove', { touches });
    }

    handleTouchEnd(e) {
        const touches = Array.from(e.changedTouches).map(touch => ({
            id: touch.identifier,
            point: this.screenToCanvas(this.getTouchPosition(touch))
        }));
        
        this.editor.eventBus.emit('canvas:touchend', { touches });
    }

    handleKeyDown(e) {
        this.editor.eventBus.emit('canvas:keydown', {
            key: e.key,
            code: e.code,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey
        });
    }

    handleKeyUp(e) {
        this.editor.eventBus.emit('canvas:keyup', {
            key: e.key,
            code: e.code
        });
    }

    handleResize() {
        this.setupHighDPI();
        this.markDirty();
    }

    // Utility methods
    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getTouchPosition(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    screenToCanvas(point) {
        const { zoom, pan } = this.editor.state.get().ui;
        
        return {
            x: (point.x - this.displayWidth / 2 - pan.x) / zoom + this.displayWidth / 2,
            y: (point.y - this.displayHeight / 2 - pan.y) / zoom + this.displayHeight / 2
        };
    }

    canvasToScreen(point) {
        const { zoom, pan } = this.editor.state.get().ui;
        
        return {
            x: (point.x - this.displayWidth / 2) * zoom + this.displayWidth / 2 + pan.x,
            y: (point.y - this.displayHeight / 2) * zoom + this.displayHeight / 2 + pan.y
        };
    }

    getNodeAt(point) {
        const nodes = Array.from(this.editor.state.get().diagram.nodes.values());
        
        // Check in reverse order (top to bottom)
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            if (this.pointInNode(point, node)) {
                return node;
            }
        }
        
        return null;
    }

    pointInNode(point, node) {
        return point.x >= node.position.x &&
               point.x <= node.position.x + node.size.width &&
               point.y >= node.position.y &&
               point.y <= node.position.y + node.size.height;
    }

    markDirty() {
        this.renderState.isDirty = true;
    }

    // Public API
    focus() {
        this.canvas.focus();
    }

    destroy() {
        // Remove event listeners
        this.resizeObserver.disconnect();
        window.removeEventListener('resize', this.handleResize);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Remove elements
        this.container.removeChild(this.wrapper);
    }
} 