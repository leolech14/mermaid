/**
 * Mermaid Editor V2 - Main Editor Class
 * Implements semantic beauty with pixel-perfect precision
 * Following modern UI/UX principles for 2026
 */

import { StateManager } from './core/StateManager.js';
import { EventBus } from './core/EventBus.js';
import { HistoryManager } from './core/HistoryManager.js';
import { Canvas } from './canvas/Canvas.js';
import { CanvasManager } from './canvas/CanvasManager.js';
import { NestedCanvas } from '../v2-architecture/NestedCanvas.js';
import { XRayVision } from '../v2-architecture/XRayVision.js';
import { ConnectionFlow } from '../v2-architecture/ConnectionFlow.js';
import { Toolbar } from './ui/Toolbar.js';
import { ContextMenuSystem } from './ui/ContextMenuSystem.js';
import { PropertyPanel } from './ui/PropertyPanel.js';
import { AnimationManager } from './utils/AnimationManager.js';
import { ContrastManager } from './utils/ContrastManager.js';
import { PixelPerfectRenderer } from './utils/PixelPerfectRenderer.js';

export class MermaidEditor {
    constructor(container, options = {}) {
        // Ensure container is a DOM element
        this.container = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        
        if (!this.container) {
            throw new Error('Container element not found');
        }
        
        this.options = {
            theme: 'dark',
            features: {
                nestedCanvas: true,
                xrayVision: true,
                connectionFlow: true,
                aiPersonalization: true
            },
            performance: {
                targetFPS: 60,
                reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            },
            accessibility: {
                minContrast: 4.5,
                semanticHTML: true,
                ariaCompliance: true
            },
            ...options
        };

        // Initialize core systems first
        this.initializeCoreSystems();
        
        // Then setup pixel-perfect container (creates HTML structure)
        this.setupPixelPerfectContainer();
        
        // Apply theme before creating UI components
        this.applyTheme();
        
        // Now initialize UI components (they need the HTML structure)
        this.initializeUIComponents();
        
        // Initialize feature modules
        this.initializeFeatures();
        
        // Start initialization
        this.init();
    }
    
    // Getter for canvas to maintain compatibility
    get canvas() {
        return this.mainCanvas ? this.mainCanvas.element : null;
    }

    setupPixelPerfectContainer() {
        // Debug log
        console.log('Setting up pixel perfect container:', this.container);
        
        if (!this.container) {
            throw new Error('Container is not defined');
        }
        
        // Ensure container is a DOM element
        if (!(this.container instanceof HTMLElement)) {
            console.error('Container is not an HTMLElement:', this.container);
            throw new Error('Container must be an HTMLElement');
        }
        
        // Ensure pixel-perfect rendering
        try {
            this.container.style.transform = 'translateZ(0)';
            this.container.style.imageRendering = 'crisp-edges';
            this.container.classList.add('mermaid-editor-v2', 'pixel-perfect-container');
        } catch (e) {
            console.error('Error setting container styles:', e);
            throw e;
        }
        
        // Apply semantic HTML structure
        this.container.innerHTML = `
            <header class="editor-header glass-panel" role="banner">
                <div class="glass-inner-glow"></div>
                <div class="header-content"></div>
            </header>
            <main class="editor-main" role="main">
                <aside class="editor-sidebar glass-panel" role="complementary">
                    <div class="glass-inner-glow"></div>
                    <div class="sidebar-content"></div>
                </aside>
                <section class="editor-canvas-area" role="region" aria-label="Canvas">
                    <div class="canvas-container"></div>
                </section>
                <aside class="editor-properties glass-panel" role="complementary">
                    <div class="glass-inner-glow"></div>
                    <div class="properties-content"></div>
                </aside>
            </main>
            <footer class="editor-footer glass-panel" role="contentinfo">
                <div class="glass-inner-glow"></div>
                <div class="footer-content"></div>
            </footer>
        `;
    }

    initializeCoreSystems() {
        // State management with immutable updates
        this.state = new StateManager({
            diagram: {
                nodes: new Map(),
                connections: new Map(),
                canvases: new Map()
            },
            ui: {
                currentTool: 'select',
                xrayActive: false,
                selectedCanvas: null,
                visibleLevels: 0,
                zoom: 1.0,
                pan: { x: 0, y: 0 },
                selection: {
                    isSelecting: false,
                    selectionBox: null,
                    nodes: new Set(),
                    connections: new Set()
                },
                connection: {
                    isConnecting: false,
                    startNode: null,
                    line: null
                }
            },
            preferences: {
                theme: this.options.theme,
                animations: !this.options.performance.reducedMotion,
                hapticFeedback: true
            }
        });
        
        // Event-driven architecture
        this.eventBus = new EventBus();
        
        // History for undo/redo
        this.history = new HistoryManager(this.state);
        
        // Animation management with performance awareness
        this.animationManager = new AnimationManager(this.options.performance);
        
        // Contrast management for accessibility
        this.contrastManager = new ContrastManager(this.options.accessibility);
        
        // Pixel-perfect rendering engine
        this.pixelPerfectRenderer = new PixelPerfectRenderer();
    }

    initializeUIComponents() {
        // Canvas management
        const canvasContainer = this.container.querySelector('.canvas-container');
        this.mainCanvas = new Canvas(canvasContainer, this);
        this.canvasManager = new CanvasManager(this);
        
        // UI components with glass morphism
        const headerContent = this.container.querySelector('.header-content');
        this.toolbar = new Toolbar(headerContent, this);
        
        this.contextMenu = new ContextMenuSystem(this);
        
        const propertiesContent = this.container.querySelector('.properties-content');
        this.propertyPanel = new PropertyPanel(propertiesContent, this);
    }

    initializeFeatures() {
        // Advanced features
        if (this.options.features.nestedCanvas) {
            this.nestedCanvas = new NestedCanvas(this);
        }
        
        if (this.options.features.xrayVision) {
            this.xrayVision = new XRayVision(this);
            this.setupXRayShortcuts();
        }
        
        if (this.options.features.connectionFlow) {
            this.connectionFlow = new ConnectionFlow(this);
        }
        
        if (this.options.features.aiPersonalization) {
            this.setupAIPersonalization();
        }
    }

    applyTheme() {
        const root = document.documentElement;
        
        if (this.options.theme === 'dark') {
            // Modern dark theme with elevated surfaces
            root.style.setProperty('--color-background', '#121212');
            root.style.setProperty('--color-surface-0', '#121212');
            root.style.setProperty('--color-surface-1', '#1E1E1E');
            root.style.setProperty('--color-surface-2', '#232323');
            root.style.setProperty('--color-surface-3', '#292929');
            
            // Accent colors with proper contrast
            root.style.setProperty('--color-primary', '#BB86FC');
            root.style.setProperty('--color-secondary', '#03DAC6');
            root.style.setProperty('--color-error', '#CF6679');
            
            // Glass morphism parameters
            root.style.setProperty('--glass-blur', '16px');
            root.style.setProperty('--glass-opacity', '0.08');
            root.style.setProperty('--glass-border-opacity', '0.12');
        }
    }

    setupXRayShortcuts() {
        // Alt+X for X-ray vision toggle
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'x') {
                e.preventDefault();
                this.toggleXRayVision();
            }
        });
    }

    setupAIPersonalization() {
        // Track user behavior for personalization
        this.behaviorTracker = {
            interactions: [],
            patterns: new Map()
        };
        
        // Track mouse movements for heat mapping
        let mouseBuffer = [];
        document.addEventListener('mousemove', (e) => {
            mouseBuffer.push({
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now()
            });
            
            // Analyze every 100 movements
            if (mouseBuffer.length >= 100) {
                this.analyzeInteractionPatterns(mouseBuffer);
                mouseBuffer = [];
            }
        });
    }

    init() {
        // Set up event listeners
        this.bindEvents();
        
        // Load initial diagram if provided
        if (this.options.initialDiagram) {
            this.loadDiagram(this.options.initialDiagram);
        }
        
        // Emit ready event
        this.eventBus.emit('editor:ready', { editor: this });
        
        // Start render loop
        this.startRenderLoop();
    }

    bindEvents() {
        // Tool switching
        this.eventBus.on('tool:change', (tool) => {
            this.state.update(state => ({
                ...state,
                ui: { ...state.ui, currentTool: tool }
            }));
        });
        
        // Node operations
        this.eventBus.on('node:create', (data) => {
            this.createNode(data);
        });
        
        this.eventBus.on('node:update', (data) => {
            this.updateNode(data.id, data.updates);
        });
        
        this.eventBus.on('node:delete', (nodeId) => {
            this.deleteNode(nodeId);
        });
        
        // Connection operations
        this.eventBus.on('connection:create', (data) => {
            this.createConnection(data);
        });
        
        // Canvas operations
        this.eventBus.on('canvas:zoom', (delta) => {
            this.zoom(delta);
        });
        
        this.eventBus.on('canvas:pan', (offset) => {
            this.pan(offset);
        });
    }

    startRenderLoop() {
        const targetFrameTime = 1000 / this.options.performance.targetFPS;
        let lastTime = performance.now();
        
        const render = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime >= targetFrameTime) {
                this.render(deltaTime);
                lastTime = currentTime;
            }
            
            requestAnimationFrame(render);
        };
        
        // Force initial render
        this.render(0);
        requestAnimationFrame(render);
    }

    render(deltaTime) {
        // Update animations
        this.animationManager.update(deltaTime);
        
        // Render main canvas
        this.mainCanvas.render();
        
        // Render nested canvases if visible
        if (this.state.get().ui.xrayActive && this.nestedCanvas) {
            this.nestedCanvas.renderAll();
        }
        
        // Update performance metrics
        this.eventBus.emit('performance:frame', { deltaTime });
    }

    // Public API methods
    createNode(data) {
        const node = {
            id: `node_${Date.now()}`,
            type: data.type || 'default',
            label: data.label || 'New Node',
            position: data.position || { x: 100, y: 100 },
            size: data.size || { width: 120, height: 60 },
            style: data.style || {},
            level: data.level || 0,
            canvas: data.canvas || this.mainCanvas,
            data: data.data || {}
        };
        
        this.state.update(state => ({
            ...state,
            diagram: {
                ...state.diagram,
                nodes: new Map(state.diagram.nodes).set(node.id, node)
            }
        }));
        
        this.eventBus.emit('node:created', node);
        
        // Mark canvas as dirty to trigger render
        if (this.mainCanvas) {
            this.mainCanvas.markDirty();
        }
        
        // Apply micro-interaction
        if (this.options.performance.animations) {
            this.animationManager.animate(node.id, {
                scale: [0.8, 1],
                opacity: [0, 1]
            }, 300, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
        }
        
        return node;
    }

    updateNode(nodeId, updates) {
        const node = this.state.get().diagram.nodes.get(nodeId);
        if (!node) return;
        
        const updatedNode = { ...node, ...updates };
        
        this.state.update(state => ({
            ...state,
            diagram: {
                ...state.diagram,
                nodes: new Map(state.diagram.nodes).set(nodeId, updatedNode)
            }
        }));
        
        this.eventBus.emit('node:updated', { nodeId, updates });
    }

    deleteNode(nodeId) {
        this.state.update(state => {
            const nodes = new Map(state.diagram.nodes);
            nodes.delete(nodeId);
            
            // Also remove connections to/from this node
            const connections = new Map(state.diagram.connections);
            for (const [id, conn] of connections) {
                if (conn.from === nodeId || conn.to === nodeId) {
                    connections.delete(id);
                }
            }
            
            return {
                ...state,
                diagram: { ...state.diagram, nodes, connections }
            };
        });
        
        this.eventBus.emit('node:deleted', { nodeId });
    }

    createConnection(data) {
        const connection = {
            id: `conn_${Date.now()}`,
            from: data.from,
            to: data.to,
            type: data.type || 'default',
            label: data.label || '',
            path: null, // Will be calculated by renderer
            canvas: data.canvas || this.mainCanvas
        };
        
        this.state.update(state => ({
            ...state,
            diagram: {
                ...state.diagram,
                connections: new Map(state.diagram.connections).set(connection.id, connection)
            }
        }));
        
        this.eventBus.emit('connection:created', connection);
        
        return connection;
    }

    toggleXRayVision() {
        const isActive = !this.state.get().ui.xrayActive;
        
        this.state.update(state => ({
            ...state,
            ui: { ...state.ui, xrayActive: isActive }
        }));
        
        if (isActive) {
            this.xrayVision.activate();
        } else {
            this.xrayVision.deactivate();
        }
        
        // Haptic feedback if available
        if ('vibrate' in navigator && this.state.get().preferences.hapticFeedback) {
            navigator.vibrate(50);
        }
    }

    zoom(delta) {
        const currentZoom = this.state.get().ui.zoom;
        const newZoom = Math.max(0.1, Math.min(5, currentZoom + delta));
        
        this.state.update(state => ({
            ...state,
            ui: { ...state.ui, zoom: newZoom }
        }));
        
        this.eventBus.emit('canvas:zoomed', { zoom: newZoom });
    }

    pan(offset) {
        const currentPan = this.state.get().ui.pan;
        
        this.state.update(state => ({
            ...state,
            ui: {
                ...state.ui,
                pan: {
                    x: currentPan.x + offset.x,
                    y: currentPan.y + offset.y
                }
            }
        }));
        
        this.eventBus.emit('canvas:panned', { pan: this.state.get().ui.pan });
    }

    analyzeInteractionPatterns(mouseData) {
        // Simple heat map analysis for AI personalization
        const heatMap = new Map();
        
        mouseData.forEach(point => {
            const gridX = Math.floor(point.x / 50);
            const gridY = Math.floor(point.y / 50);
            const key = `${gridX},${gridY}`;
            
            heatMap.set(key, (heatMap.get(key) || 0) + 1);
        });
        
        // Find hot spots
        const hotSpots = Array.from(heatMap.entries())
            .filter(([_, count]) => count > 10)
            .map(([key, count]) => {
                const [x, y] = key.split(',').map(Number);
                return { x: x * 50, y: y * 50, intensity: count };
            });
        
        if (hotSpots.length > 0) {
            this.eventBus.emit('ai:hotspots', { hotSpots });
        }
    }

    // Export/Import methods
    exportDiagram() {
        return {
            version: '2.0',
            diagram: {
                nodes: Array.from(this.state.get().diagram.nodes.values()),
                connections: Array.from(this.state.get().diagram.connections.values()),
                canvases: Array.from(this.state.get().diagram.canvases.values())
            },
            ui: this.state.get().ui,
            metadata: {
                created: new Date().toISOString(),
                editor: 'Mermaid Editor V2'
            }
        };
    }

    loadDiagram(data) {
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        
        // Handle both formats (with or without diagram wrapper)
        const diagramData = data.diagram || data;
        
        // Validate version compatibility
        if (data.version && data.version !== '2.0') {
            console.warn('Loading diagram from different version:', data.version);
        }
        
        // Load nodes
        const nodes = new Map();
        if (diagramData.nodes && Array.isArray(diagramData.nodes)) {
            diagramData.nodes.forEach(node => {
                nodes.set(node.id, node);
            });
        }
        
        // Load connections
        const connections = new Map();
        if (diagramData.connections && Array.isArray(diagramData.connections)) {
            diagramData.connections.forEach(conn => {
                connections.set(conn.id, conn);
            });
        }
        
        // Load canvases
        const canvases = new Map();
        if (diagramData.canvases && Array.isArray(diagramData.canvases)) {
            diagramData.canvases.forEach(canvas => {
                canvases.set(canvas.id, canvas);
            });
        }
        
        // Update state
        this.state.update(state => ({
            ...state,
            diagram: { nodes, connections, canvases },
            ui: data.ui || state.ui
        }));
        
        this.eventBus.emit('diagram:loaded', data);
    }

    // Cleanup
    destroy() {
        this.eventBus.emit('editor:destroy');
        this.eventBus.removeAllListeners();
        this.animationManager.destroy();
        this.container.innerHTML = '';
    }
} 