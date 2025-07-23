/**
 * Mermaid Visual Editor - Core Module
 * Hybrid approach with progressive enhancement
 */

import { CanvasRenderer } from '../renderer/canvas-renderer.js';
import { SVGRenderer } from '../renderer/svg-renderer.js';
import { StateManager } from '../state/state-manager.js';
import { CodeEditor } from '../ui/code-editor.js';
import { VisualEditor } from '../ui/visual-editor.js';
import { CommandManager } from '../utils/command-manager.js';
import { PerformanceMonitor } from '../utils/performance-monitor.js';
import mermaid from 'mermaid';

export class MermaidEditor {
    constructor(containerId, options = {}) {
        this.container = typeof containerId === 'string' 
            ? document.getElementById(containerId) 
            : containerId;
            
        this.options = {
            mode: 'dual', // 'dual', 'code', 'visual'
            theme: 'dark',
            renderThreshold: 100, // Switch to Canvas above this many nodes
            enableTouch: true,
            enableCollaboration: false,
            autoSave: true,
            autoSaveInterval: 30000, // 30 seconds
            ...options
        };
        
        this.initialize();
    }
    
    async initialize() {
        // Initialize state management
        this.state = new StateManager({
            code: this.options.initialCode || 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]',
            mode: this.options.mode,
            theme: this.options.theme
        });
        
        // Initialize command manager for undo/redo
        this.commands = new CommandManager();
        
        // Initialize performance monitor
        this.performance = new PerformanceMonitor();
        
        // Initialize Mermaid
        this.initializeMermaid();
        
        // Create UI structure
        this.createUI();
        
        // Initialize renderers
        this.canvasRenderer = new CanvasRenderer(this.visualContainer);
        this.svgRenderer = new SVGRenderer(this.visualContainer);
        
        // Initialize editors
        if (this.options.mode !== 'visual') {
            this.codeEditor = new CodeEditor(this.codeContainer, {
                onChange: this.handleCodeChange.bind(this),
                theme: this.options.theme
            });
        }
        
        if (this.options.mode !== 'code') {
            this.visualEditor = new VisualEditor(this.visualContainer, {
                onNodeAdd: this.handleNodeAdd.bind(this),
                onNodeMove: this.handleNodeMove.bind(this),
                onConnectionAdd: this.handleConnectionAdd.bind(this),
                enableTouch: this.options.enableTouch
            });
        }
        
        // Set up auto-save
        if (this.options.autoSave) {
            this.setupAutoSave();
        }
        
        // Initial render
        this.render();
        
        // Emit ready event
        this.emit('ready');
    }
    
    initializeMermaid() {
        mermaid.initialize({
            startOnLoad: false,
            theme: this.options.theme,
            themeVariables: this.getThemeVariables(),
            flowchart: {
                useMaxWidth: false,
                htmlLabels: true,
                curve: 'basis'
            }
        });
    }
    
    getThemeVariables() {
        const themes = {
            dark: {
                primaryColor: '#1a1b23',
                primaryTextColor: '#fafafa',
                primaryBorderColor: '#6366f1',
                lineColor: '#6366f1',
                secondaryColor: '#818cf8',
                tertiaryColor: '#4f46e5',
                background: '#0f1013',
                mainBkg: '#1a1b23',
                secondBkg: '#13141a',
                tertiaryBkg: '#0f1013'
            },
            light: {
                primaryColor: '#f3f4f6',
                primaryTextColor: '#111827',
                primaryBorderColor: '#4f46e5',
                lineColor: '#4f46e5',
                secondaryColor: '#6366f1',
                tertiaryColor: '#818cf8',
                background: '#ffffff',
                mainBkg: '#f3f4f6',
                secondBkg: '#e5e7eb',
                tertiaryBkg: '#d1d5db'
            }
        };
        
        return themes[this.options.theme] || themes.dark;
    }
    
    createUI() {
        const html = `
            <div class="mermaid-editor ${this.options.mode}-mode" data-theme="${this.options.theme}">
                ${this.createToolbar()}
                <div class="editor-body">
                    ${this.options.mode !== 'visual' ? this.createCodePanel() : ''}
                    ${this.options.mode !== 'code' ? this.createVisualPanel() : ''}
                </div>
                ${this.createStatusBar()}
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Cache DOM references
        this.editorElement = this.container.querySelector('.mermaid-editor');
        this.codeContainer = this.container.querySelector('.code-panel-content');
        this.visualContainer = this.container.querySelector('.visual-panel-content');
        this.statusBar = this.container.querySelector('.editor-status-bar');
    }
    
    createToolbar() {
        return `
            <div class="editor-toolbar">
                <div class="toolbar-group">
                    <button class="toolbar-btn" data-action="new" title="New Diagram">📄</button>
                    <button class="toolbar-btn" data-action="open" title="Open">📁</button>
                    <button class="toolbar-btn" data-action="save" title="Save">💾</button>
                    <div class="toolbar-separator"></div>
                    <button class="toolbar-btn" data-action="undo" title="Undo">↶</button>
                    <button class="toolbar-btn" data-action="redo" title="Redo">↷</button>
                </div>
                
                <div class="toolbar-group">
                    <select class="toolbar-select" data-action="template">
                        <option value="">Templates...</option>
                        <option value="flowchart">Flowchart</option>
                        <option value="sequence">Sequence</option>
                        <option value="class">Class Diagram</option>
                        <option value="state">State Diagram</option>
                        <option value="er">ER Diagram</option>
                        <option value="gantt">Gantt Chart</option>
                        <option value="pie">Pie Chart</option>
                    </select>
                </div>
                
                <div class="toolbar-group toolbar-right">
                    <button class="toolbar-btn" data-action="zoom-in" title="Zoom In">🔍+</button>
                    <button class="toolbar-btn" data-action="zoom-out" title="Zoom Out">🔍-</button>
                    <button class="toolbar-btn" data-action="fit" title="Fit to Screen">⊡</button>
                    <div class="toolbar-separator"></div>
                    <button class="toolbar-btn" data-action="export" title="Export">📤</button>
                    <button class="toolbar-btn" data-action="settings" title="Settings">⚙️</button>
                </div>
            </div>
        `;
    }
    
    createCodePanel() {
        return `
            <div class="code-panel">
                <div class="panel-header">
                    <h3>Code Editor</h3>
                    <button class="panel-btn" data-action="format">Format</button>
                </div>
                <div class="code-panel-content"></div>
            </div>
        `;
    }
    
    createVisualPanel() {
        return `
            <div class="visual-panel">
                <div class="panel-header">
                    <h3>Visual Editor</h3>
                    <div class="render-info">
                        <span class="render-mode">SVG</span>
                        <span class="node-count">0 nodes</span>
                    </div>
                </div>
                <div class="visual-panel-content">
                    <div class="visual-canvas"></div>
                    ${this.createNodePalette()}
                </div>
            </div>
        `;
    }
    
    createNodePalette() {
        return `
            <div class="node-palette">
                <div class="palette-item" draggable="true" data-node-type="process">
                    <div class="node-preview node-process">Process</div>
                </div>
                <div class="palette-item" draggable="true" data-node-type="decision">
                    <div class="node-preview node-decision">Decision</div>
                </div>
                <div class="palette-item" draggable="true" data-node-type="start-end">
                    <div class="node-preview node-start-end">Start/End</div>
                </div>
                <div class="palette-item" draggable="true" data-node-type="data">
                    <div class="node-preview node-data">Data</div>
                </div>
            </div>
        `;
    }
    
    createStatusBar() {
        return `
            <div class="editor-status-bar">
                <div class="status-left">
                    <span class="status-item" id="render-status">Ready</span>
                    <span class="status-item" id="node-info">0 nodes, 0 edges</span>
                </div>
                <div class="status-right">
                    <span class="status-item" id="performance-info">60 fps</span>
                    <span class="status-item" id="save-status">Saved</span>
                </div>
            </div>
        `;
    }
    
    async render() {
        const startTime = performance.now();
        
        try {
            // Parse diagram to determine complexity
            const diagram = await this.parseDiagram(this.state.get('code'));
            const nodeCount = diagram.nodes.length;
            
            // Update status
            this.updateStatus('render-status', 'Rendering...');
            this.updateStatus('node-info', `${nodeCount} nodes, ${diagram.edges.length} edges`);
            
            // Choose renderer based on complexity
            const useCanvas = nodeCount > this.options.renderThreshold;
            const renderer = useCanvas ? this.canvasRenderer : this.svgRenderer;
            
            // Update render mode indicator
            const renderModeEl = this.container.querySelector('.render-mode');
            if (renderModeEl) {
                renderModeEl.textContent = useCanvas ? 'Canvas' : 'SVG';
            }
            
            // Render diagram
            await renderer.render(diagram, this.state.get('theme'));
            
            // Update visual editor if active
            if (this.visualEditor && this.options.mode !== 'code') {
                this.visualEditor.updateDiagram(diagram);
            }
            
            // Track performance
            const renderTime = performance.now() - startTime;
            this.performance.recordRenderTime(renderTime);
            
            this.updateStatus('render-status', `Rendered in ${Math.round(renderTime)}ms`);
            
        } catch (error) {
            console.error('Render error:', error);
            this.updateStatus('render-status', 'Error: ' + error.message);
        }
    }
    
    async parseDiagram(code) {
        // For now, use a simple parser
        // In production, this would use the full Mermaid parser
        const lines = code.split('\n').filter(line => line.trim());
        const nodes = [];
        const edges = [];
        const nodeMap = new Map();
        
        let nodeId = 0;
        
        lines.forEach(line => {
            // Simple pattern matching for demonstration
            const nodeMatch = line.match(/(\w+)\[(.*?)\]/g);
            const edgeMatch = line.match(/(\w+)\s*-->\s*(\w+)/);
            
            if (nodeMatch) {
                nodeMatch.forEach(match => {
                    const [, id, label] = match.match(/(\w+)\[(.*?)\]/);
                    if (!nodeMap.has(id)) {
                        const node = {
                            id,
                            label: label || id,
                            type: this.detectNodeType(label),
                            x: Math.random() * 600 + 100,
                            y: Math.random() * 400 + 100
                        };
                        nodes.push(node);
                        nodeMap.set(id, node);
                    }
                });
            }
            
            if (edgeMatch) {
                const [, from, to] = edgeMatch;
                edges.push({
                    id: `edge-${edges.length}`,
                    from,
                    to,
                    label: ''
                });
            }
        });
        
        return { nodes, edges, code };
    }
    
    detectNodeType(label) {
        if (label.startsWith('{') && label.endsWith('}')) return 'decision';
        if (label.startsWith('(') && label.endsWith(')')) return 'start-end';
        if (label.startsWith('[') && label.endsWith(']')) return 'process';
        return 'process';
    }
    
    handleCodeChange(newCode) {
        this.state.set('code', newCode);
        
        // Debounced render
        clearTimeout(this.renderTimeout);
        this.renderTimeout = setTimeout(() => {
            this.render();
        }, 500);
        
        // Record command for undo/redo
        this.commands.execute({
            execute: () => this.state.set('code', newCode),
            undo: () => this.state.set('code', this.previousCode)
        });
        
        this.previousCode = newCode;
    }
    
    handleNodeAdd(nodeType, position) {
        // Generate unique ID
        const id = `node_${Date.now()}`;
        const label = `New ${nodeType}`;
        
        // Add to code
        const currentCode = this.state.get('code');
        const newLine = `    ${id}[${label}]`;
        const newCode = currentCode + '\n' + newLine;
        
        this.state.set('code', newCode);
        if (this.codeEditor) {
            this.codeEditor.setValue(newCode);
        }
        
        this.render();
    }
    
    handleNodeMove(nodeId, newPosition) {
        // Update node position in visual editor
        // This would be synced with layout algorithm
        this.visualEditor.updateNodePosition(nodeId, newPosition);
    }
    
    handleConnectionAdd(fromId, toId) {
        // Add connection to code
        const currentCode = this.state.get('code');
        const newLine = `    ${fromId} --> ${toId}`;
        const newCode = currentCode + '\n' + newLine;
        
        this.state.set('code', newCode);
        if (this.codeEditor) {
            this.codeEditor.setValue(newCode);
        }
        
        this.render();
    }
    
    setupAutoSave() {
        setInterval(() => {
            this.save();
        }, this.options.autoSaveInterval);
        
        // Also save on significant changes
        this.state.on('change', () => {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.save();
            }, 5000); // 5 seconds after last change
        });
    }
    
    save() {
        const data = {
            code: this.state.get('code'),
            theme: this.state.get('theme'),
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage for now
        localStorage.setItem('mermaid-editor-autosave', JSON.stringify(data));
        
        this.updateStatus('save-status', 'Saved');
        
        // In production, this would sync to backend
        if (this.options.enableCollaboration) {
            // this.syncToBackend(data);
        }
    }
    
    load() {
        const saved = localStorage.getItem('mermaid-editor-autosave');
        if (saved) {
            const data = JSON.parse(saved);
            this.state.set('code', data.code);
            this.state.set('theme', data.theme);
            
            if (this.codeEditor) {
                this.codeEditor.setValue(data.code);
            }
            
            this.render();
        }
    }
    
    setMode(mode) {
        this.options.mode = mode;
        this.editorElement.className = `mermaid-editor ${mode}-mode`;
        
        // Reinitialize editors as needed
        if (mode === 'code' && !this.codeEditor) {
            this.createCodePanel();
            this.codeEditor = new CodeEditor(this.codeContainer, {
                onChange: this.handleCodeChange.bind(this),
                theme: this.options.theme
            });
        }
        
        if (mode === 'visual' && !this.visualEditor) {
            this.createVisualPanel();
            this.visualEditor = new VisualEditor(this.visualContainer, {
                onNodeAdd: this.handleNodeAdd.bind(this),
                onNodeMove: this.handleNodeMove.bind(this),
                onConnectionAdd: this.handleConnectionAdd.bind(this)
            });
        }
        
        this.render();
    }
    
    updateStatus(id, text) {
        const element = this.container.querySelector(`#${id}`);
        if (element) {
            element.textContent = text;
        }
    }
    
    // Event emitter methods
    on(event, handler) {
        this.handlers = this.handlers || {};
        this.handlers[event] = this.handlers[event] || [];
        this.handlers[event].push(handler);
    }
    
    emit(event, data) {
        if (this.handlers && this.handlers[event]) {
            this.handlers[event].forEach(handler => handler(data));
        }
    }
    
    // Public API
    getCode() {
        return this.state.get('code');
    }
    
    setCode(code) {
        this.state.set('code', code);
        if (this.codeEditor) {
            this.codeEditor.setValue(code);
        }
        this.render();
    }
    
    export(format = 'svg') {
        const renderer = this.svgRenderer; // Always use SVG for export
        return renderer.export(format);
    }
    
    destroy() {
        // Cleanup
        if (this.codeEditor) this.codeEditor.destroy();
        if (this.visualEditor) this.visualEditor.destroy();
        if (this.canvasRenderer) this.canvasRenderer.destroy();
        if (this.svgRenderer) this.svgRenderer.destroy();
        
        clearTimeout(this.renderTimeout);
        clearTimeout(this.saveTimeout);
        
        this.container.innerHTML = '';
    }
}