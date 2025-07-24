/**
 * Toolbar - Main toolbar component with tool selection and actions
 * Implements glass morphism UI with smooth micro-interactions
 */

export class Toolbar {
    constructor(container, editor) {
        this.container = container;
        this.editor = editor;
        this.tools = ['select', 'node', 'connection', 'pan'];
        this.currentTool = 'select';
        
        this.create();
        this.bindEvents();
    }

    create() {
        // Create toolbar structure
        this.element = document.createElement('div');
        this.element.className = 'toolbar';
        this.element.innerHTML = `
            <div class="toolbar-section toolbar-tools">
                <div class="toolbar-group">
                    ${this.createToolButtons()}
                </div>
            </div>
            
            <div class="toolbar-section toolbar-actions">
                <div class="toolbar-group">
                    <button class="toolbar-button" data-action="undo" title="Undo (Ctrl+Z)">
                        <svg class="toolbar-icon" viewBox="0 0 24 24">
                            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
                        </svg>
                    </button>
                    <button class="toolbar-button" data-action="redo" title="Redo (Ctrl+Y)">
                        <svg class="toolbar-icon" viewBox="0 0 24 24">
                            <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <div class="toolbar-group">
                    <button class="toolbar-button" data-action="zoom-in" title="Zoom In">
                        <svg class="toolbar-icon" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                    <span class="toolbar-zoom-level">100%</span>
                    <button class="toolbar-button" data-action="zoom-out" title="Zoom Out">
                        <svg class="toolbar-icon" viewBox="0 0 24 24">
                            <path d="M19 13H5v-2h14v2z"/>
                        </svg>
                    </button>
                    <button class="toolbar-button" data-action="zoom-fit" title="Fit to Screen">
                        <svg class="toolbar-icon" viewBox="0 0 24 24">
                            <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <div class="toolbar-group">
                    <button class="toolbar-button" data-action="grid" title="Toggle Grid">
                        <svg class="toolbar-icon" viewBox="0 0 24 24">
                            <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
                        </svg>
                    </button>
                    <button class="toolbar-button" data-action="xray" title="X-Ray Vision (Alt+X)">
                        <svg class="toolbar-icon" viewBox="0 0 24 24">
                            <path d="M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-8C6.48 5 2 9.48 2 15s4.48 10 10 10 10-4.48 10-10S17.52 5 12 5zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        </svg>
                    </button>
                    <button class="toolbar-button" data-action="theme" title="Toggle Theme">
                        <svg class="toolbar-icon" viewBox="0 0 24 24">
                            <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM12 4.5v15a7.5 7.5 0 0 1 0-15z"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="toolbar-section toolbar-info">
                <span class="toolbar-status" id="toolbar-status">Ready</span>
            </div>
        `;
        
        this.container.appendChild(this.element);
        
        // Get references to elements
        this.toolButtons = this.element.querySelectorAll('.toolbar-tool');
        this.actionButtons = this.element.querySelectorAll('[data-action]');
        this.zoomLevel = this.element.querySelector('.toolbar-zoom-level');
        this.status = this.element.querySelector('#toolbar-status');
        
        // Set initial tool
        this.setTool(this.currentTool);
    }

    createToolButtons() {
        const toolConfigs = {
            select: {
                icon: 'M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z',
                title: 'Select Tool (V)'
            },
            node: {
                icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z',
                title: 'Node Tool (N)'
            },
            connection: {
                icon: 'M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2c-1.19 0-2.34.21-3.41.6L6.5 4.69A9.87 9.87 0 0 0 2 12zm10-8c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8zm6.5 8L15 8.5 11.5 12 15 15.5 18.5 12z',
                title: 'Connection Tool (C)'
            },
            pan: {
                icon: 'M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z',
                title: 'Pan Tool (H)'
            }
        };
        
        return this.tools.map(tool => {
            const config = toolConfigs[tool];
            return `
                <button class="toolbar-button toolbar-tool" data-tool="${tool}" title="${config.title}">
                    <svg class="toolbar-icon" viewBox="0 0 24 24">
                        <path d="${config.icon}"/>
                    </svg>
                </button>
            `;
        }).join('');
    }

    bindEvents() {
        // Tool selection
        this.toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tool = button.dataset.tool;
                this.setTool(tool);
                this.editor.eventBus.emit('tool:change', tool);
            });
        });
        
        // Action buttons
        this.actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                this.handleAction(action);
            });
        });
        
        // Subscribe to editor events
        this.editor.eventBus.on('ui:zoom', ({ zoom }) => {
            this.updateZoomLevel(zoom);
        });
        
        this.editor.eventBus.on('history:change', () => {
            this.updateHistoryButtons();
        });
        
        this.editor.eventBus.on('ui:status', ({ message }) => {
            this.setStatus(message);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    setTool(tool) {
        if (!this.tools.includes(tool)) return;
        
        this.currentTool = tool;
        
        // Update UI
        this.toolButtons.forEach(button => {
            if (button.dataset.tool === tool) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Apply micro-interaction
        const activeButton = this.element.querySelector(`[data-tool="${tool}"]`);
        if (activeButton && this.editor.options.performance.animations) {
            activeButton.animate([
                { transform: 'scale(0.95)' },
                { transform: 'scale(1.05)' },
                { transform: 'scale(1)' }
            ], {
                duration: 200,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            });
        }
    }

    handleAction(action) {
        switch (action) {
            case 'undo':
                this.editor.history.undo();
                break;
                
            case 'redo':
                this.editor.history.redo();
                break;
                
            case 'zoom-in':
                this.editor.zoom(0.1);
                break;
                
            case 'zoom-out':
                this.editor.zoom(-0.1);
                break;
                
            case 'zoom-fit':
                this.fitToScreen();
                break;
                
            case 'grid':
                this.toggleGrid();
                break;
                
            case 'xray':
                this.editor.toggleXRayVision();
                break;
                
            case 'theme':
                this.toggleTheme();
                break;
        }
        
        // Visual feedback
        const button = this.element.querySelector(`[data-action="${action}"]`);
        if (button) {
            button.classList.add('active');
            setTimeout(() => button.classList.remove('active'), 150);
        }
    }

    handleKeyboard(e) {
        // Tool shortcuts
        const toolShortcuts = {
            'v': 'select',
            'n': 'node',
            'c': 'connection',
            'h': 'pan'
        };
        
        if (toolShortcuts[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const tool = toolShortcuts[e.key.toLowerCase()];
            this.setTool(tool);
            this.editor.eventBus.emit('tool:change', tool);
        }
        
        // Action shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.handleAction('redo');
                    } else {
                        this.handleAction('undo');
                    }
                    break;
                    
                case 'y':
                    e.preventDefault();
                    this.handleAction('redo');
                    break;
                    
                case '=':
                case '+':
                    e.preventDefault();
                    this.handleAction('zoom-in');
                    break;
                    
                case '-':
                    e.preventDefault();
                    this.handleAction('zoom-out');
                    break;
                    
                case '0':
                    e.preventDefault();
                    this.handleAction('zoom-fit');
                    break;
            }
        }
    }

    updateZoomLevel(zoom) {
        const percentage = Math.round(zoom * 100);
        this.zoomLevel.textContent = `${percentage}%`;
        
        // Add animation
        if (this.editor.options.performance.animations) {
            this.zoomLevel.animate([
                { transform: 'scale(1.2)', opacity: 0.8 },
                { transform: 'scale(1)', opacity: 1 }
            ], {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            });
        }
    }

    updateHistoryButtons() {
        const undoButton = this.element.querySelector('[data-action="undo"]');
        const redoButton = this.element.querySelector('[data-action="redo"]');
        
        if (undoButton) {
            undoButton.disabled = !this.editor.history.canUndo();
            undoButton.classList.toggle('disabled', !this.editor.history.canUndo());
        }
        
        if (redoButton) {
            redoButton.disabled = !this.editor.history.canRedo();
            redoButton.classList.toggle('disabled', !this.editor.history.canRedo());
        }
    }

    toggleGrid() {
        const showGrid = !this.editor.state.get().ui.showGrid;
        
        this.editor.state.update(state => ({
            ...state,
            ui: { ...state.ui, showGrid }
        }));
        
        const button = this.element.querySelector('[data-action="grid"]');
        if (button) {
            button.classList.toggle('active', showGrid);
        }
    }

    toggleTheme() {
        const currentTheme = this.editor.options.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.editor.options.theme = newTheme;
        this.editor.applyTheme();
        
        // Animate theme transition
        document.documentElement.animate([
            { opacity: 0.8 },
            { opacity: 1 }
        ], {
            duration: 300,
            easing: 'ease-in-out'
        });
    }

    fitToScreen() {
        // Calculate bounding box of all nodes
        const nodes = Array.from(this.editor.state.get().diagram.nodes.values());
        
        if (nodes.length === 0) {
            this.editor.state.update(state => ({
                ...state,
                ui: { ...state.ui, zoom: 1, pan: { x: 0, y: 0 } }
            }));
            return;
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        nodes.forEach(node => {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + node.size.width);
            maxY = Math.max(maxY, node.position.y + node.size.height);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;
        
        const canvas = this.editor.mainCanvas;
        const padding = 50;
        const scaleX = (canvas.displayWidth - padding * 2) / width;
        const scaleY = (canvas.displayHeight - padding * 2) / height;
        const zoom = Math.min(scaleX, scaleY, 2); // Max zoom 200%
        
        this.editor.state.update(state => ({
            ...state,
            ui: {
                ...state.ui,
                zoom,
                pan: {
                    x: -centerX * zoom + canvas.displayWidth / 2,
                    y: -centerY * zoom + canvas.displayHeight / 2
                }
            }
        }));
        
        // Animate the transition
        if (this.editor.options.performance.animations) {
            this.editor.animationManager.animate('canvas-fit', {
                zoom: [this.editor.state.get().ui.zoom, zoom],
                panX: [this.editor.state.get().ui.pan.x, -centerX * zoom + canvas.displayWidth / 2],
                panY: [this.editor.state.get().ui.pan.y, -centerY * zoom + canvas.displayHeight / 2]
            }, 500, 'cubic-bezier(0.4, 0, 0.2, 1)');
        }
    }

    setStatus(message, duration = 3000) {
        this.status.textContent = message;
        
        // Auto-clear temporary messages
        if (duration > 0) {
            clearTimeout(this.statusTimeout);
            this.statusTimeout = setTimeout(() => {
                this.status.textContent = 'Ready';
            }, duration);
        }
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyboard);
        this.element.remove();
    }
} 