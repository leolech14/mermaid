/**
 * Legacy Adapter - Maps old editor functions to new modular editor core
 * This ensures backward compatibility during the transition
 */

(function(window) {
    'use strict';
    
    // Wait for editor core to be ready
    function initLegacyAdapter() {
        if (!window.editorCore) {
            console.warn('Editor core not found, retrying...');
            setTimeout(initLegacyAdapter, 100);
            return;
        }
        
        const editor = window.editorCore;
        const state = window.editorManagers?.stateManager;
        const nodeManager = window.editorManagers?.nodeManager;
        const connectionManager = window.editorManagers?.connectionManager;
        
        // Tool functions
        window.setTool = function(tool) {
            editor.setTool(tool);
        };
        
        // Node functions
        window.createNode = function(x, y, label = 'New Node', type = 'rectangle') {
            return nodeManager?.createNode({
                x: x,
                y: y,
                label: label,
                type: type
            });
        };
        
        window.updateNode = function(nodeId, updates) {
            nodeManager?.updateNode(nodeId, updates);
        };
        
        window.deleteNode = function(nodeId) {
            nodeManager?.deleteNode(nodeId);
        };
        
        window.duplicateNode = function(nodeId) {
            return nodeManager?.duplicateNode(nodeId);
        };
        
        // Connection functions
        window.createConnection = function(fromId, toId, label = '') {
            return connectionManager?.createConnection({
                from: fromId,
                to: toId,
                label: label
            });
        };
        
        window.updateConnection = function(connId, updates) {
            connectionManager?.updateConnection(connId, updates);
        };
        
        window.deleteConnection = function(connId) {
            connectionManager?.deleteConnection(connId);
        };
        
        // Selection functions
        window.selectNode = function(nodeId) {
            editor.selectNode(state?.state.nodes.get(nodeId));
        };
        
        window.selectConnection = function(connId) {
            editor.selectConnection(state?.state.connections.get(connId));
        };
        
        window.clearSelection = function() {
            editor.clearSelection();
        };
        
        // State functions
        window.undo = function() {
            state?.undo();
        };
        
        window.redo = function() {
            state?.redo();
        };
        
        window.saveDiagram = function() {
            state?.saveState();
            console.log('Diagram saved');
        };
        
        window.newDiagram = function() {
            if (confirm('Create new diagram? All unsaved changes will be lost.')) {
                state?.clear();
                editor.updateCode();
            }
        };
        
        // Export functions
        window.exportToMermaid = function() {
            const nodeCode = nodeManager?.exportToMermaid() || '';
            const connectionCode = connectionManager?.exportToMermaid() || '';
            return nodeCode + '\n' + connectionCode;
        };
        
        window.updateCode = function() {
            editor.updateCode();
        };
        
        // Import function (placeholder)
        window.importFromCode = function(code) {
            editor.importFromCode(code);
        };
        
        // Background functions
        window.setBackgroundStyle = function(style) {
            // This would update background style
            console.log('Set background style:', style);
        };
        
        // Get state info
        window.getSelectedNodes = function() {
            return Array.from(state?.state.selectedNodes || []);
        };
        
        window.getSelectedConnections = function() {
            return Array.from(state?.state.selectedConnections || []);
        };
        
        window.getNodeById = function(nodeId) {
            return state?.state.nodes.get(nodeId);
        };
        
        window.getConnectionById = function(connId) {
            return state?.state.connections.get(connId);
        };
        
        // Initialize function (no-op since editor auto-initializes)
        window.init = function() {
            console.log('Legacy init called - editor already initialized');
        };
        
        console.log('Legacy adapter initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLegacyAdapter);
    } else {
        initLegacyAdapter();
    }
    
})(window);