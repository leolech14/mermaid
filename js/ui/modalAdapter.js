/**
 * Modal Adapter - Bridges the new modal system with existing editor code
 * 
 * PURPOSE:
 * - Provides backward compatibility
 * - Maps old function calls to new modal system
 * - Handles event listeners and data flow
 */

import { modalSystem } from '../core/modalSystem.js';
import { registerAllModals } from '../config/modalConfigs.js';

// Initialize modal system
export function initializeModals() {
    // Register all modal configurations
    registerAllModals(modalSystem);

    // Set up event listeners for editor integration
    setupEventListeners();

    // Map legacy functions to new system
    mapLegacyFunctions();
}

/**
 * Set up event listeners to bridge editor and modal system
 */
function setupEventListeners() {
    // Node editing
    document.addEventListener('nodeEdit', (e) => {
        modalSystem.open('nodeEdit', e.detail);
    });

    document.addEventListener('nodeUpdate', (e) => {
        // Update node in editor state
        if (window.updateNode) {
            window.updateNode(e.detail);
        }
    });

    // Connection editing
    document.addEventListener('connectionEdit', (e) => {
        modalSystem.open('connectionEdit', e.detail);
    });

    document.addEventListener('connectionUpdate', (e) => {
        if (window.updateConnection) {
            window.updateConnection(e.detail);
        }
    });

    // Batch editing
    document.addEventListener('openBatchEdit', (e) => {
        modalSystem.open('batchEdit', e.detail);
    });

    document.addEventListener('batchUpdate', (e) => {
        if (window.applyBatchUpdates) {
            window.applyBatchUpdates(e.detail);
        }
    });

    // Context menus
    document.addEventListener('showNodeContext', (e) => {
        const { x, y, node } = e.detail;
        showContextMenu('nodeContext', x, y, node);
    });

    document.addEventListener('showConnectionContext', (e) => {
        const { x, y, connection } = e.detail;
        showContextMenu('connectionContext', x, y, connection);
    });

    document.addEventListener('showMultiSelectContext', (e) => {
        const { x, y, selection } = e.detail;
        showContextMenu('multiSelectContext', x, y, selection);
    });
}

/**
 * Show context menu at specific position
 */
function showContextMenu(menuId, x, y, data) {
    // Close any open context menu
    ['nodeContext', 'connectionContext', 'multiSelectContext'].forEach(id => {
        if (id !== menuId) modalSystem.close(id);
    });

    // Open new context menu
    modalSystem.open(menuId, data);

    // Position the menu
    const menu = modalSystem.get(menuId);
    if (menu && menu.element) {
        const container = menu.element.querySelector('.modal-container');
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;

        // Adjust if menu goes off screen
        const rect = container.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            container.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            container.style.top = `${y - rect.height}px`;
        }
    }
}

/**
 * Map legacy function calls to new modal system
 */
function mapLegacyFunctions() {
    // Node edit popup
    window.openNodeEditPopup = (nodeData) => {
        modalSystem.open('nodeEdit', nodeData);
    };

    window.closeNodeEditPopup = () => {
        modalSystem.close('nodeEdit');
    };

    // Connection edit popup
    window.openConnectionEditPopup = (connectionData) => {
        modalSystem.open('connectionEdit', connectionData);
    };

    window.closeConnectionEditPopup = () => {
        modalSystem.close('connectionEdit');
    };

    // Batch edit popup
    window.openBatchEditPopup = () => {
        const nodeCount = window.state?.selectedNodes?.size || 0;
        const connectionCount = window.state?.selectedConnections?.size || 0;
        modalSystem.open('batchEdit', { nodeCount, connectionCount });
    };

    window.closeBatchEditPopup = () => {
        modalSystem.close('batchEdit');
    };

    // Context menus
    window.showContextMenu = (e, nodeData) => {
        document.dispatchEvent(new CustomEvent('showNodeContext', {
            detail: { x: e.clientX, y: e.clientY, node: nodeData }
        }));
    };

    window.showConnectionContextMenu = (e, connectionData) => {
        document.dispatchEvent(new CustomEvent('showConnectionContext', {
            detail: { x: e.clientX, y: e.clientY, connection: connectionData }
        }));
    };

    window.showMultiSelectContextMenu = (e) => {
        const selection = {
            nodeCount: window.state?.selectedNodes?.size || 0,
            connectionCount: window.state?.selectedConnections?.size || 0,
            nodes: Array.from(window.state?.selectedNodes || []),
            connections: Array.from(window.state?.selectedConnections || [])
        };
        document.dispatchEvent(new CustomEvent('showMultiSelectContext', {
            detail: { x: e.clientX, y: e.clientY, selection }
        }));
    };

    window.hideContextMenu = () => {
        ['nodeContext', 'connectionContext', 'multiSelectContext'].forEach(id => {
            modalSystem.close(id);
        });
    };
}

/**
 * Update functions for editor integration
 */
window.updateNode = (nodeData) => {
    const state = window.state;
    if (!state || !state.nodes) return;

    const node = state.nodes.get(nodeData.id);
    if (!node) return;

    // Update node properties
    Object.assign(node, nodeData);

    // Update visual representation
    if (node.element) {
        // Update shape fill and stroke
        if (node.shape) {
            node.shape.style.fill = nodeData.fillColor;
            node.shape.style.stroke = nodeData.borderColor;
            node.shape.style.strokeWidth = nodeData.borderWidth + 'px';
            node.shape.style.strokeDasharray = 
                nodeData.borderStyle === 'dashed' ? '5,5' :
                nodeData.borderStyle === 'dotted' ? '2,2' : 'none';
            
            if (nodeData.shadow) {
                node.shape.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))';
            } else {
                node.shape.style.filter = 'none';
            }
        }

        // Update text
        if (node.text) {
            node.text.textContent = nodeData.label;
            node.text.style.fill = nodeData.textColor;
            node.text.style.fontSize = nodeData.fontSize + 'px';
        }

        // Update position and size if type changed
        if (node.type !== nodeData.type) {
            // Recreate node with new type
            window.recreateNode?.(node, nodeData);
        } else {
            // Just update position/size
            node.element.setAttribute('transform', `translate(${nodeData.x}, ${nodeData.y})`);
            window.updateNodeVisual?.(node);
        }
    }

    // Update code
    window.updateCodeFromVisual?.();
};

window.updateConnection = (connectionData) => {
    const state = window.state;
    if (!state || !state.connections) return;

    const connection = state.connections.get(connectionData.id);
    if (!connection) return;

    // Update connection properties
    Object.assign(connection, connectionData);

    // Update visual representation
    if (connection.element) {
        connection.element.style.stroke = connectionData.strokeColor;
        connection.element.style.strokeWidth = connectionData.strokeWidth + 'px';
        connection.element.style.strokeDasharray = 
            connectionData.style === 'dashed' ? '5,5' :
            connectionData.style === 'dotted' ? '2,2' : 'none';

        if (connectionData.animated) {
            connection.element.style.animation = 'dash 20s linear infinite';
        } else {
            connection.element.style.animation = 'none';
        }

        // Update arrow marker
        connection.element.setAttribute('marker-end', `url(#arrow-${connectionData.arrowStyle})`);
    }

    // Update label if exists
    if (connection.labelElement) {
        connection.labelElement.textContent = connectionData.label || '';
    }

    // Update code
    window.updateCodeFromVisual?.();
};

window.applyBatchUpdates = (updates) => {
    const state = window.state;
    if (!state) return;

    // Apply node updates
    if (updates.nodes && state.selectedNodes) {
        state.selectedNodes.forEach(nodeId => {
            const node = state.nodes.get(nodeId);
            if (node) {
                const nodeUpdate = { id: nodeId, ...updates.nodes };
                window.updateNode(nodeUpdate);
            }
        });
    }

    // Apply connection updates
    if (updates.connections && state.selectedConnections) {
        state.selectedConnections.forEach(connId => {
            const conn = state.connections.get(connId);
            if (conn) {
                const connUpdate = { id: connId, ...updates.connections };
                window.updateConnection(connUpdate);
            }
        });
    }
};

// Export for use in editor
export { modalSystem };