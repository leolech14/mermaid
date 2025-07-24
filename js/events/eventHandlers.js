/**
 * Event Handlers Module - Centralized event handling
 * Replaces all inline event handlers with proper event delegation
 */

export class EventHandlers {
    constructor(editor) {
        this.editor = editor;
        this.init();
    }
    
    init() {
        // Toolbar button handlers
        this.initToolbarHandlers();
        
        // Property panel handlers
        this.initPropertyHandlers();
        
        // Context menu handlers
        this.initContextMenuHandlers();
        
        // Dialog handlers
        this.initDialogHandlers();
        
        // Global keyboard shortcuts
        this.initKeyboardHandlers();
    }
    
    /**
     * Initialize toolbar event handlers
     */
    initToolbarHandlers() {
        // Main toolbar buttons
        this.addClickHandler('#newDiagramBtn', () => this.editor.newDiagram());
        this.addClickHandler('#saveDiagramBtn', () => this.editor.saveDiagram());
        this.addClickHandler('#undoBtn', () => this.editor.undo());
        this.addClickHandler('#redoBtn', () => this.editor.redo());
        this.addClickHandler('#exportBtn', () => this.editor.exportSVG());
        this.addClickHandler('#gridBtn', () => this.editor.toggleGrid());
        this.addClickHandler('#formatBtn', () => this.editor.formatCode());
        
        // Diagram type selector
        this.addChangeHandler('#diagramType', (e) => this.editor.changeDiagramType(e.target.value));
        
        // Code panel buttons
        this.addClickHandler('#copyCodeBtn', () => this.editor.copyCode());
        
        // Visual panel buttons
        this.addClickHandler('#zoomInBtn', () => this.editor.zoomIn());
        this.addClickHandler('#zoomOutBtn', () => this.editor.zoomOut());
        this.addClickHandler('#resetZoomBtn', () => this.editor.resetZoom());
        
        // Palette toggle
        this.addClickHandler('#paletteToggle', () => this.editor.togglePalette());
    }
    
    /**
     * Initialize property panel handlers
     */
    initPropertyHandlers() {
        // Node properties
        this.addChangeHandler('#propLabel', () => this.editor.updateNodeProperty('label'));
        this.addChangeHandler('#propWidth', () => this.editor.updateNodeProperty('width'));
        this.addChangeHandler('#propHeight', () => this.editor.updateNodeProperty('height'));
        this.addChangeHandler('#propBorderStyle', () => this.editor.updateNodeProperty('borderStyle'));
        this.addChangeHandler('#propBorderWidth', () => this.editor.updateNodeProperty('borderWidth'));
        this.addChangeHandler('#propCornerRadius', () => this.editor.updateNodeProperty('cornerRadius'));
        
        // Color options - use event delegation
        const colorOptions = document.querySelector('.color-options');
        if (colorOptions) {
            colorOptions.addEventListener('click', (e) => {
                const colorOption = e.target.closest('.color-option');
                if (colorOption) {
                    const color = colorOption.dataset.color;
                    this.editor.setNodeColor(color);
                }
            });
        }
    }
    
    /**
     * Initialize context menu handlers
     */
    initContextMenuHandlers() {
        // Node context menu
        this.delegateContextMenu('#contextMenu', {
            'showNodeProperties': () => this.editor.showNodeProperties(),
            'duplicateNode': () => this.editor.duplicateNode(),
            'deleteNode': () => this.editor.deleteNode(),
            'changeNodeType': (type) => this.editor.changeNodeType(type)
        });
        
        // Connection context menu
        this.delegateContextMenu('#connectionContextMenu', {
            'editConnectionLabel': () => this.editor.editConnectionLabel(),
            'setConnectionStyle': (style) => this.editor.setConnectionStyle(style),
            'setConnectionThickness': (thickness) => this.editor.setConnectionThickness(thickness),
            'setConnectionColor': () => this.editor.setConnectionColor(),
            'deleteConnection': () => this.editor.deleteConnection()
        });
        
        // Background context menu
        this.delegateContextMenu('#backgroundContextMenu', {
            'openBackgroundEditor': () => this.editor.openBackgroundEditor(),
            'toggleGrid': () => this.editor.toggleGrid(),
            'changeGridSize': () => this.editor.changeGridSize(),
            'addNodeAtPosition': () => this.editor.addNodeAtPosition(),
            'exportSVG': () => this.editor.exportSVG(),
            'resetView': () => this.editor.resetView()
        });
        
        // Multi-select context menu
        this.delegateContextMenu('#multiSelectContextMenu', {
            'editGroupStyle': () => this.editor.editGroupStyle(),
            'alignNodes': (direction) => this.editor.alignNodes(direction),
            'distributeNodes': (direction) => this.editor.distributeNodes(direction),
            'groupNodes': () => this.editor.groupNodes(),
            'duplicateSelection': () => this.editor.duplicateSelection(),
            'deleteSelection': () => this.editor.deleteSelection()
        });
    }
    
    /**
     * Initialize dialog handlers
     */
    initDialogHandlers() {
        // Background editor
        this.addClickHandler('#closeBackgroundEditorBtn', () => this.editor.closeBackgroundEditor());
        this.addClickHandler('#addColorSlotBtn', () => this.editor.addColorSlot());
        this.addChangeHandler('#bgStyle', () => this.editor.updateBackgroundStyle());
        this.addChangeHandler('#colorPicker', (e) => this.editor.updateColorSlot(e.target.value));
        this.addClickHandler('#generateRandomPaletteBtn', () => this.editor.generateRandomPalette());
        this.addClickHandler('#generateRandomBackgroundBtn', () => this.editor.generateRandomBackground());
        this.addClickHandler('#resetBackgroundBtn', () => this.editor.resetBackground());
        
        // Color slot delegation
        const colorSlots = document.querySelector('#colorSlots');
        if (colorSlots) {
            colorSlots.addEventListener('click', (e) => {
                const slot = e.target.closest('.color-slot');
                if (slot) {
                    const index = Array.from(colorSlots.children).indexOf(slot);
                    this.editor.editColorSlot(index);
                }
            });
        }
        
        // Group style editor
        this.addClickHandler('#closeGroupStyleEditorBtn', () => this.editor.closeGroupStyleEditor());
        this.addClickHandler('#applyGroupChangesBtn', () => this.editor.applyGroupChanges());
        this.addClickHandler('#cycleGroupConnectionColorBtn', () => this.editor.cycleGroupConnectionColor());
        
        // Group style color options
        const groupColorOptions = document.querySelector('#groupStyleEditor .color-options');
        if (groupColorOptions) {
            groupColorOptions.addEventListener('click', (e) => {
                const colorOption = e.target.closest('.color-option');
                if (colorOption) {
                    const color = colorOption.style.background;
                    this.editor.applyGroupNodeColor(color);
                }
            });
        }
        
        // Group style selects
        this.addChangeHandler('#groupNodeBorderStyle', (e) => this.editor.applyGroupNodeBorderStyle(e.target.value));
        this.addChangeHandler('#groupNodeBorderWidth', (e) => this.editor.applyGroupNodeBorderWidth(e.target.value));
        this.addChangeHandler('#groupConnectionStyle', (e) => this.editor.applyGroupConnectionStyle(e.target.value));
        this.addChangeHandler('#groupConnectionThickness', (e) => this.editor.applyGroupConnectionThickness(e.target.value));
    }
    
    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z: Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.editor.undo();
            }
            
            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.editor.redo();
            }
            
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.editor.saveDiagram();
            }
            
            // Ctrl/Cmd + A: Select All
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.editor.selectAll();
            }
            
            // Ctrl/Cmd + C: Copy
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault();
                this.editor.copy();
            }
            
            // Ctrl/Cmd + V: Paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                this.editor.paste();
            }
            
            // Delete/Backspace: Delete selected
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (!this.isTextInput(e.target)) {
                    e.preventDefault();
                    this.editor.deleteSelected();
                }
            }
            
            // Escape: Cancel operations
            if (e.key === 'Escape') {
                this.editor.cancelOperation();
            }
        });
    }
    
    /**
     * Helper: Add click handler
     */
    addClickHandler(selector, handler) {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('click', handler);
        }
    }
    
    /**
     * Helper: Add change handler
     */
    addChangeHandler(selector, handler) {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('change', handler);
        }
    }
    
    /**
     * Helper: Delegate context menu clicks
     */
    delegateContextMenu(menuSelector, handlers) {
        const menu = document.querySelector(menuSelector);
        if (!menu) return;
        
        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (!item) return;
            
            // Extract action from onclick or data attribute
            const onclick = item.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/(\w+)\((.*?)\)/);
                if (match) {
                    const [, action, args] = match;
                    if (handlers[action]) {
                        // Parse arguments if any
                        const parsedArgs = args ? args.replace(/['"]/g, '').split(',').map(a => a.trim()) : [];
                        handlers[action](...parsedArgs);
                    }
                }
            }
        });
    }
    
    /**
     * Helper: Check if element is text input
     */
    isTextInput(element) {
        const tagName = element.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || element.contentEditable === 'true';
    }
    
    /**
     * Clean up event handlers
     */
    destroy() {
        // Remove global keyboard handler
        document.removeEventListener('keydown', this.keyboardHandler);
    }
}