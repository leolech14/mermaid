/**
 * XRayVision.js - Implements the Alt+X transparency animation for nested canvases
 * 
 * Shows inner canvases of nodes with smooth transitions and level management
 */

export class XRayVision {
    constructor(editor) {
        this.editor = editor;
        this.isActive = false;
        this.currentLevel = 0;
        this.maxLevel = 0;
        
        // Animation settings
        this.transitionDuration = 300; // ms
        this.levelOpacities = [1.0, 0.3, 0.15, 0.05]; // Opacity per level
        
        // Affected elements tracking
        this.affectedNodes = new Map();
        this.visibleCanvases = new Set();
        
        this.setupEventListeners();
    }
    
    /**
     * Set up keyboard event listeners
     */
    setupEventListeners() {
        // Track Alt+X combination
        let altPressed = false;
        let xPressed = false;
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt') altPressed = true;
            if (e.key === 'x' || e.key === 'X') xPressed = true;
            
            if (altPressed && xPressed && !this.isActive) {
                this.activate();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt') altPressed = false;
            if (e.key === 'x' || e.key === 'X') xPressed = false;
            
            if (!altPressed || !xPressed) {
                this.deactivate();
            }
        });
        
        // Handle window blur (user switches away)
        window.addEventListener('blur', () => {
            altPressed = false;
            xPressed = false;
            this.deactivate();
        });
    }
    
    /**
     * Activate X-ray vision
     */
    activate() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.editor.eventBus.emit('xray:activated');
        
        // Calculate max depth
        this.calculateMaxLevel();
        
        // Start the reveal animation
        this.revealNestedCanvases();
        
        // Add visual indicator
        this.showIndicator();
    }
    
    /**
     * Deactivate X-ray vision
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.editor.eventBus.emit('xray:deactivated');
        
        // Hide nested canvases
        this.hideNestedCanvases();
        
        // Remove visual indicator
        this.hideIndicator();
    }
    
    /**
     * Calculate the maximum nesting level in the diagram
     */
    calculateMaxLevel() {
        this.maxLevel = 0;
        
        const checkNode = (node, level = 0) => {
            if (node.innerCanvas) {
                this.maxLevel = Math.max(this.maxLevel, level + 1);
                node.innerCanvas.nodes.forEach(innerNode => {
                    checkNode(innerNode, level + 1);
                });
            }
        };
        
        this.editor.state.diagram.nodes.forEach(node => {
            checkNode(node, 0);
        });
    }
    
    /**
     * Reveal nested canvases with animation
     */
    revealNestedCanvases() {
        const mainCanvas = this.editor.canvas;
        const allNodes = this.getAllNodesWithLevels();
        
        // Group nodes by level
        const nodesByLevel = new Map();
        allNodes.forEach(({ node, level }) => {
            if (!nodesByLevel.has(level)) {
                nodesByLevel.set(level, []);
            }
            nodesByLevel.get(level).push(node);
        });
        
        // Animate each level
        nodesByLevel.forEach((nodes, level) => {
            setTimeout(() => {
                this.animateLevel(nodes, level);
            }, level * 100); // Stagger animation by level
        });
    }
    
    /**
     * Animate nodes at a specific level
     */
    animateLevel(nodes, level) {
        const targetOpacity = this.levelOpacities[level] || 0.05;
        
        nodes.forEach(node => {
            // Store original opacity
            if (!this.affectedNodes.has(node.id)) {
                this.affectedNodes.set(node.id, {
                    originalOpacity: node.opacity || 1.0,
                    originalZIndex: node.element.style.zIndex || 'auto'
                });
            }
            
            // Apply X-ray effect
            node.element.style.transition = `opacity ${this.transitionDuration}ms ease-out`;
            node.element.style.opacity = targetOpacity;
            
            // Adjust z-index based on level
            node.element.style.zIndex = 1000 - (level * 10);
            
            // Reveal inner canvas if exists
            if (node.innerCanvas && level < this.maxLevel) {
                this.revealCanvas(node.innerCanvas, level);
            }
        });
    }
    
    /**
     * Reveal a specific nested canvas
     */
    revealCanvas(canvas, parentLevel) {
        // Add canvas to visible set
        this.visibleCanvases.add(canvas.id);
        
        // Create container for the inner canvas
        const container = document.createElement('div');
        container.className = 'xray-canvas-container';
        container.style.position = 'absolute';
        container.style.pointerEvents = 'none';
        
        // Position below parent node
        const parentBounds = canvas.parentNode.getBounds();
        const offset = (parentLevel + 1) * 20; // Offset for visual clarity
        
        container.style.left = `${parentBounds.x + offset}px`;
        container.style.top = `${parentBounds.y + parentBounds.height + offset}px`;
        container.style.width = `${parentBounds.width}px`;
        container.style.height = `${parentBounds.height}px`;
        
        // Add glass morphism effect
        container.style.background = 'rgba(255, 255, 255, 0.05)';
        container.style.backdropFilter = 'blur(10px) saturate(180%)';
        container.style.border = '1px solid rgba(183, 148, 244, 0.3)';
        container.style.borderRadius = '8px';
        container.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.15)';
        
        // Animate appearance
        container.style.opacity = '0';
        container.style.transform = 'translateY(-20px) scale(0.95)';
        container.style.transition = `all ${this.transitionDuration}ms ease-out`;
        
        // Add to DOM
        this.editor.container.appendChild(container);
        
        // Clone and scale the canvas content
        const preview = canvas.showPreview();
        preview.style.transform = 'scale(0.8)';
        preview.style.transformOrigin = 'center';
        container.appendChild(preview);
        
        // Trigger animation
        requestAnimationFrame(() => {
            container.style.opacity = '0.8';
            container.style.transform = 'translateY(0) scale(1)';
        });
        
        // Store reference for cleanup
        canvas.xrayContainer = container;
    }
    
    /**
     * Hide all nested canvases
     */
    hideNestedCanvases() {
        // Restore original node opacities
        this.affectedNodes.forEach((original, nodeId) => {
            const node = this.editor.state.diagram.nodes.get(nodeId);
            if (node && node.element) {
                node.element.style.transition = `opacity ${this.transitionDuration}ms ease-out`;
                node.element.style.opacity = original.originalOpacity;
                node.element.style.zIndex = original.originalZIndex;
            }
        });
        
        // Hide and remove canvas containers
        this.visibleCanvases.forEach(canvasId => {
            const canvas = this.findCanvasById(canvasId);
            if (canvas && canvas.xrayContainer) {
                canvas.xrayContainer.style.opacity = '0';
                canvas.xrayContainer.style.transform = 'translateY(-20px) scale(0.95)';
                
                setTimeout(() => {
                    canvas.xrayContainer.remove();
                    delete canvas.xrayContainer;
                }, this.transitionDuration);
            }
        });
        
        // Clear tracking
        this.affectedNodes.clear();
        this.visibleCanvases.clear();
    }
    
    /**
     * Get all nodes with their nesting levels
     */
    getAllNodesWithLevels() {
        const result = [];
        
        const collectNodes = (nodes, level = 0) => {
            nodes.forEach(node => {
                result.push({ node, level });
                
                if (node.innerCanvas) {
                    collectNodes(node.innerCanvas.nodes.values(), level + 1);
                }
            });
        };
        
        collectNodes(this.editor.state.diagram.nodes.values());
        return result;
    }
    
    /**
     * Find canvas by ID across all levels
     */
    findCanvasById(canvasId) {
        const searchCanvas = (nodes) => {
            for (const node of nodes.values()) {
                if (node.innerCanvas && node.innerCanvas.id === canvasId) {
                    return node.innerCanvas;
                }
                if (node.innerCanvas) {
                    const found = searchCanvas(node.innerCanvas.nodes);
                    if (found) return found;
                }
            }
            return null;
        };
        
        return searchCanvas(this.editor.state.diagram.nodes);
    }
    
    /**
     * Show visual indicator for X-ray mode
     */
    showIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'xray-indicator';
        indicator.className = 'xray-mode-indicator';
        indicator.innerHTML = `
            <div class="xray-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 8L8 10V14L12 16L16 14V10L12 8Z" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                    <circle cx="12" cy="12" r="2" fill="currentColor"/>
                </svg>
            </div>
            <span>X-Ray Vision Active</span>
            <kbd>Alt+X</kbd>
        `;
        
        // Style the indicator
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            background: rgba(183, 148, 244, 0.1);
            backdrop-filter: blur(10px) saturate(180%);
            border: 1px solid rgba(183, 148, 244, 0.3);
            border-radius: 24px;
            color: #B794F4;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: xrayPulse 2s ease-in-out infinite;
        `;
        
        this.editor.container.appendChild(indicator);
    }
    
    /**
     * Hide visual indicator
     */
    hideIndicator() {
        const indicator = document.getElementById('xray-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translateY(-10px)';
            setTimeout(() => indicator.remove(), 300);
        }
    }
    
    /**
     * Clean up
     */
    destroy() {
        this.deactivate();
        // Remove event listeners would go here
    }
}