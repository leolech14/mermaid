/**
 * Editor Fixes - Fixes for right-click, drag-drop, and cursor issues
 */

export function applyEditorFixes() {
    // Fix 1: Bind event handlers properly to preserve 'this' context
    fixEventHandlerBindings();
    
    // Fix 2: Implement drag-drop for node palette
    fixNodePaletteDragDrop();
    
    // Fix 3: Fix context menu not showing
    fixContextMenus();
    
    // Fix cursor getting stuck
    fixCursorIssues();
}

function fixEventHandlerBindings() {
    // Get the editor core instance
    const editor = window.editorCore;
    if (!editor) {
        console.error('Editor core not found');
        return;
    }
    
    // Remove old event listeners and add properly bound ones
    const canvas = editor.canvas;
    if (canvas) {
        // Remove old listeners
        const oldListeners = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(oldListeners, canvas);
        editor.canvas = oldListeners;
        
        // Add new properly bound listeners
        editor.canvas.addEventListener('mousedown', (e) => editor.handleCanvasMouseDown(e));
        editor.canvas.addEventListener('mousemove', (e) => editor.handleCanvasMouseMove(e));
        editor.canvas.addEventListener('mouseup', (e) => editor.handleCanvasMouseUp(e));
        editor.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            editor.handleCanvasContextMenu(e);
        });
        editor.canvas.addEventListener('dblclick', (e) => editor.handleCanvasDoubleClick(e));
    }
}

function fixNodePaletteDragDrop() {
    const editor = window.editorCore;
    const canvas = document.getElementById('editor-canvas');
    const svg = document.getElementById('svg-container');
    
    // Set up drag and drop for node palette
    const nodeTypes = document.querySelectorAll('.node-type[draggable="true"]');
    
    nodeTypes.forEach(nodeType => {
        nodeType.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('nodeType', nodeType.dataset.type);
            nodeType.style.opacity = '0.5';
        });
        
        nodeType.addEventListener('dragend', () => {
            nodeType.style.opacity = '1';
        });
    });
    
    // Set up drop zone
    if (canvas) {
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const nodeType = e.dataTransfer.getData('nodeType');
            if (nodeType && editor) {
                const rect = svg.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Create node at drop position
                if (window.editorManagers && window.editorManagers.nodeManager) {
                    const node = window.editorManagers.nodeManager.createNode({
                        type: nodeType,
                        x: x - 60, // Center the node
                        y: y - 30,
                        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1)
                    });
                    
                    // Select the new node
                    editor.selectNode(node);
                    editor.updateCode();
                }
            }
        });
    }
}

function fixContextMenus() {
    // Ensure modal system can show context menus
    const modalSystem = window.modalSystem;
    if (!modalSystem) {
        console.error('Modal system not found');
        return;
    }
    
    // Make sure context menus close when clicking elsewhere
    document.addEventListener('click', (e) => {
        // Close context menu if clicking outside
        if (!e.target.closest('.modal-container')) {
            const activeModal = modalSystem.activeModal;
            if (activeModal && modalSystem.modals.get(activeModal)?.config.type === 'contextMenu') {
                modalSystem.close(activeModal);
            }
        }
    });
    
    // Re-register context menu event handlers
    const editor = window.editorCore;
    if (!editor) return;
    
    // Canvas right-click
    document.addEventListener('editor:codeUpdated', () => {
        // This ensures the editor is fully initialized
    });
    
    // For debugging - log when context menu events fire
    document.addEventListener('node:nodeContextMenu', (e) => {
        console.log('Node context menu event:', e.detail);
        const { event, node } = e.detail;
        modalSystem.open('nodeContext', {
            x: event.clientX,
            y: event.clientY,
            node: node
        });
    });
    
    document.addEventListener('connection:connectionContextMenu', (e) => {
        console.log('Connection context menu event:', e.detail);
        const { event, connection } = e.detail;
        modalSystem.open('connectionContext', {
            x: event.clientX,
            y: event.clientY,
            connection: connection
        });
    });
}

function fixCursorIssues() {
    // Prevent cursor from getting stuck
    const canvas = document.getElementById('editor-canvas');
    const svg = document.getElementById('svg-container');
    
    if (canvas && svg) {
        // Ensure mouse events bubble properly
        svg.style.pointerEvents = 'auto';
        
        // Fix cursor on mouse leave
        canvas.addEventListener('mouseleave', () => {
            const editor = window.editorCore;
            if (editor && editor.interactionState) {
                // Reset interaction states
                if (editor.interactionState.isDragging) {
                    editor.endNodeDrag();
                }
                if (editor.interactionState.isResizing) {
                    editor.endNodeResize();
                }
                if (editor.interactionState.isConnecting) {
                    if (editor.interactionState.connectionLine) {
                        editor.interactionState.connectionLine.remove();
                        editor.interactionState.connectionLine = null;
                    }
                    editor.interactionState.isConnecting = false;
                }
                if (editor.interactionState.isSelecting) {
                    editor.endSelection();
                }
            }
        });
        
        // Ensure cursor updates based on tool
        document.addEventListener('click', (e) => {
            const toolBtn = e.target.closest('.tool-btn');
            if (toolBtn && toolBtn.dataset.tool) {
                const tool = toolBtn.dataset.tool;
                canvas.className = `editor-canvas tool-${tool}`;
            }
        });
    }
}

// Auto-apply fixes when module loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyEditorFixes);
} else {
    // DOM already loaded
    setTimeout(applyEditorFixes, 100); // Small delay to ensure everything is initialized
}