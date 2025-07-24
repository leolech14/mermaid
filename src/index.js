/**
 * Mermaid Editor V2 - Entry Point
 * Modern visual editor with nested canvases and X-ray vision
 */

import { MermaidEditor } from './MermaidEditor.js';

// Export for use as a module
export { MermaidEditor };

// Auto-initialize if DOM is ready and container exists
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('mermaid-editor');
        if (container) {
            window.mermaidEditor = new MermaidEditor(container, {
                theme: 'dark',
                features: {
                    nestedCanvas: true,
                    xrayVision: true,
                    connectionFlow: true
                }
            });
        }
    });
} 