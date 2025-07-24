/**
 * Canvas Manager - Manages multiple canvases and nested canvas relationships
 * Coordinates rendering and interactions across canvas hierarchy
 */

export class CanvasManager {
    constructor(editor) {
        this.editor = editor;
        this.canvases = new Map();
        this.activeCanvas = null;
        this.canvasHierarchy = new Map(); // parent -> children mapping
        
        // Register main canvas
        this.registerCanvas(editor.mainCanvas, null);
        this.setActiveCanvas(editor.mainCanvas.id);
    }

    // Register a canvas
    registerCanvas(canvas, parentCanvas = null) {
        this.canvases.set(canvas.id, {
            canvas,
            parent: parentCanvas,
            children: new Set(),
            level: parentCanvas ? this.getCanvasLevel(parentCanvas.id) + 1 : 0
        });
        
        // Update hierarchy
        if (parentCanvas) {
            const parentEntry = this.canvases.get(parentCanvas.id);
            if (parentEntry) {
                parentEntry.children.add(canvas.id);
            }
        }
        
        // Emit event
        this.editor.eventBus.emit('canvas:registered', {
            canvasId: canvas.id,
            parentId: parentCanvas?.id
        });
        
        return canvas.id;
    }

    // Unregister a canvas
    unregisterCanvas(canvasId) {
        const entry = this.canvases.get(canvasId);
        if (!entry) return;
        
        // Remove from parent's children
        if (entry.parent) {
            const parentEntry = this.canvases.get(entry.parent.id);
            if (parentEntry) {
                parentEntry.children.delete(canvasId);
            }
        }
        
        // Unregister all children recursively
        entry.children.forEach(childId => {
            this.unregisterCanvas(childId);
        });
        
        // Remove canvas
        this.canvases.delete(canvasId);
        
        // If this was the active canvas, switch to parent or main
        if (this.activeCanvas === canvasId) {
            const newActiveId = entry.parent?.id || this.editor.mainCanvas.id;
            this.setActiveCanvas(newActiveId);
        }
        
        this.editor.eventBus.emit('canvas:unregistered', { canvasId });
    }

    // Set active canvas
    setActiveCanvas(canvasId) {
        if (!this.canvases.has(canvasId)) {
            console.warn(`Canvas ${canvasId} not found`);
            return;
        }
        
        const previousActive = this.activeCanvas;
        this.activeCanvas = canvasId;
        
        // Update state
        this.editor.state.update(state => ({
            ...state,
            ui: {
                ...state.ui,
                selectedCanvas: canvasId
            }
        }));
        
        this.editor.eventBus.emit('canvas:activated', {
            canvasId,
            previousCanvasId: previousActive
        });
    }

    // Get canvas by ID
    getCanvas(canvasId) {
        const entry = this.canvases.get(canvasId);
        return entry?.canvas || null;
    }

    // Get active canvas
    getActiveCanvas() {
        return this.getCanvas(this.activeCanvas);
    }

    // Get canvas level in hierarchy
    getCanvasLevel(canvasId) {
        const entry = this.canvases.get(canvasId);
        return entry?.level || 0;
    }

    // Get all canvases at a specific level
    getCanvasesByLevel(level) {
        const result = [];
        this.canvases.forEach((entry, id) => {
            if (entry.level === level) {
                result.push(entry.canvas);
            }
        });
        return result;
    }

    // Get canvas hierarchy
    getHierarchy(canvasId = null) {
        if (!canvasId) {
            // Return full hierarchy starting from root canvases
            const roots = [];
            this.canvases.forEach((entry, id) => {
                if (!entry.parent) {
                    roots.push(this.buildHierarchyNode(id));
                }
            });
            return roots;
        }
        
        // Return hierarchy for specific canvas
        return this.buildHierarchyNode(canvasId);
    }

    buildHierarchyNode(canvasId) {
        const entry = this.canvases.get(canvasId);
        if (!entry) return null;
        
        return {
            id: canvasId,
            canvas: entry.canvas,
            level: entry.level,
            children: Array.from(entry.children).map(childId => 
                this.buildHierarchyNode(childId)
            ).filter(Boolean)
        };
    }

    // Get ancestors of a canvas
    getAncestors(canvasId) {
        const ancestors = [];
        let currentId = canvasId;
        
        while (currentId) {
            const entry = this.canvases.get(currentId);
            if (!entry || !entry.parent) break;
            
            ancestors.push(entry.parent);
            currentId = entry.parent.id;
        }
        
        return ancestors;
    }

    // Get descendants of a canvas
    getDescendants(canvasId) {
        const descendants = [];
        const entry = this.canvases.get(canvasId);
        
        if (!entry) return descendants;
        
        const collectDescendants = (id) => {
            const childEntry = this.canvases.get(id);
            if (!childEntry) return;
            
            childEntry.children.forEach(childId => {
                descendants.push(this.getCanvas(childId));
                collectDescendants(childId);
            });
        };
        
        collectDescendants(canvasId);
        return descendants;
    }

    // Check if canvas is ancestor of another
    isAncestorOf(ancestorId, descendantId) {
        const ancestors = this.getAncestors(descendantId);
        return ancestors.some(canvas => canvas.id === ancestorId);
    }

    // Render all canvases (used for X-ray vision)
    renderAll(options = {}) {
        const { maxLevel = Infinity, opacity = 1 } = options;
        
        // Render in level order
        for (let level = 0; level <= maxLevel; level++) {
            const canvases = this.getCanvasesByLevel(level);
            const levelOpacity = this.calculateLevelOpacity(level, opacity);
            
            canvases.forEach(canvas => {
                canvas.render({ opacity: levelOpacity });
            });
        }
    }

    // Calculate opacity for X-ray vision
    calculateLevelOpacity(level, baseOpacity) {
        const opacityLevels = [1.0, 0.3, 0.15, 0.05];
        
        if (level < opacityLevels.length) {
            return opacityLevels[level] * baseOpacity;
        }
        
        // Exponential decay for deeper levels
        return Math.max(0.02, Math.pow(0.5, level)) * baseOpacity;
    }

    // Handle canvas interactions
    propagateEvent(eventName, data, canvasId) {
        const entry = this.canvases.get(canvasId);
        if (!entry) return;
        
        // Check if event should propagate to parent
        if (data.propagate !== false && entry.parent) {
            this.editor.eventBus.emit(`canvas:${eventName}`, {
                ...data,
                originalCanvas: canvasId,
                currentCanvas: entry.parent.id
            });
        }
    }

    // Create nested canvas for a node
    createNestedCanvas(node) {
        if (node.innerCanvas) {
            console.warn('Node already has inner canvas');
            return node.innerCanvas;
        }
        
        // Create container for nested canvas
        const container = document.createElement('div');
        container.className = 'nested-canvas-container';
        container.style.display = 'none'; // Hidden by default
        
        // Create nested canvas instance
        const nestedCanvas = new (this.editor.Canvas)(container, this.editor);
        nestedCanvas.parentNode = node;
        
        // Register in manager
        const parentCanvas = this.getCanvasForNode(node);
        this.registerCanvas(nestedCanvas, parentCanvas);
        
        // Update node
        node.innerCanvas = nestedCanvas;
        
        this.editor.eventBus.emit('canvas:nested-created', {
            nodeId: node.id,
            canvasId: nestedCanvas.id
        });
        
        return nestedCanvas;
    }

    // Find which canvas contains a node
    getCanvasForNode(node) {
        // This would typically be tracked in the node data
        // For now, check all canvases
        for (const [id, entry] of this.canvases) {
            const nodes = this.editor.state.get().diagram.nodes;
            for (const [nodeId, n] of nodes) {
                if (n === node && n.canvas?.id === id) {
                    return entry.canvas;
                }
            }
        }
        
        return this.editor.mainCanvas;
    }

    // Transfer nodes between canvases
    transferNodes(nodeIds, targetCanvasId) {
        const targetCanvas = this.getCanvas(targetCanvasId);
        if (!targetCanvas) {
            console.error('Target canvas not found');
            return;
        }
        
        const nodes = this.editor.state.get().diagram.nodes;
        const nodesToTransfer = nodeIds.map(id => nodes.get(id)).filter(Boolean);
        
        // Update node canvas references
        nodesToTransfer.forEach(node => {
            node.canvas = targetCanvas;
            
            // Adjust position relative to new canvas
            if (targetCanvas.parentNode) {
                node.position.x -= targetCanvas.parentNode.position.x;
                node.position.y -= targetCanvas.parentNode.position.y;
            }
        });
        
        // Update state
        this.editor.state.update(state => ({
            ...state,
            diagram: {
                ...state.diagram,
                nodes: new Map(nodes)
            }
        }));
        
        this.editor.eventBus.emit('canvas:nodes-transferred', {
            nodeIds,
            targetCanvasId
        });
    }

    // Get visible canvases based on X-ray level
    getVisibleCanvases(xrayLevel) {
        if (xrayLevel === 0) {
            // Only show active canvas
            return [this.getActiveCanvas()];
        }
        
        const visible = [];
        const activeLevel = this.getCanvasLevel(this.activeCanvas);
        
        // Get canvases within X-ray range
        for (let level = Math.max(0, activeLevel - xrayLevel); 
             level <= activeLevel + xrayLevel; 
             level++) {
            visible.push(...this.getCanvasesByLevel(level));
        }
        
        return visible;
    }

    // Export canvas hierarchy data
    exportHierarchy() {
        return {
            canvases: Array.from(this.canvases.entries()).map(([id, entry]) => ({
                id,
                level: entry.level,
                parentId: entry.parent?.id,
                childrenIds: Array.from(entry.children)
            })),
            activeCanvas: this.activeCanvas
        };
    }

    // Import canvas hierarchy data
    importHierarchy(data) {
        // This would recreate the canvas hierarchy from saved data
        // Implementation depends on how canvases are persisted
        console.log('Importing canvas hierarchy:', data);
    }

    // Debug utilities
    getStats() {
        return {
            totalCanvases: this.canvases.size,
            maxLevel: Math.max(...Array.from(this.canvases.values()).map(e => e.level)),
            activeCanvas: this.activeCanvas,
            hierarchy: this.getHierarchy()
        };
    }
} 