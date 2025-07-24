/**
 * Context Menu Debug Helper
 * Helps identify why context menus aren't showing
 */

export function enableContextMenuDebugging() {
    console.log('=== Context Menu Debugging Enabled ===');
    
    // Log all registered modals
    if (window.modalSystem) {
        console.log('Registered modals:', Array.from(window.modalSystem.modals.keys()));
    }
    
    // Intercept all right-click events
    document.addEventListener('contextmenu', (e) => {
        console.log('Right-click detected on:', e.target);
        console.log('Event coordinates:', { x: e.clientX, y: e.clientY });
        
        // Check what element was clicked
        const node = e.target.closest('.node-group');
        const connection = e.target.closest('.connection-path, .connection-group');
        const canvas = e.target.closest('#editor-canvas');
        
        if (node) {
            console.log('Clicked on node:', node.id);
        } else if (connection) {
            console.log('Clicked on connection:', connection.id);
        } else if (canvas) {
            console.log('Clicked on canvas background');
        }
    }, true); // Use capture phase
    
    // Log all custom events
    const customEvents = [
        'node:nodeContextMenu',
        'connection:connectionContextMenu',
        'editor:contextMenu',
        'modal:action'
    ];
    
    customEvents.forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            console.log(`Custom event fired: ${eventName}`, e.detail);
        });
    });
    
    // Log modal open/close
    const originalOpen = window.modalSystem?.open;
    const originalClose = window.modalSystem?.close;
    
    if (window.modalSystem) {
        window.modalSystem.open = function(id, data) {
            console.log(`Opening modal: ${id}`, data);
            return originalOpen.call(this, id, data);
        };
        
        window.modalSystem.close = function(id) {
            console.log(`Closing modal: ${id}`);
            return originalClose.call(this, id);
        };
    }
}

// Auto-enable debugging
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableContextMenuDebugging);
} else {
    enableContextMenuDebugging();
}