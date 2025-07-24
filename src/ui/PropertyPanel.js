/**
 * Property Panel - Edit properties of selected nodes and connections
 * Stub implementation for V2
 */

export class PropertyPanel {
    constructor(container, editor) {
        this.container = container;
        this.editor = editor;
        
        this.create();
    }

    create() {
        // Create basic property panel
        this.element = document.createElement('div');
        this.element.className = 'property-panel';
        this.element.innerHTML = `
            <div class="property-panel-header">
                <h3>Properties</h3>
            </div>
            <div class="property-panel-content">
                <p style="color: var(--color-text-secondary); padding: 20px; text-align: center;">
                    Select an item to edit properties
                </p>
            </div>
        `;
        
        this.container.appendChild(this.element);
    }

    updateSelection(selection) {
        // TODO: Update panel based on selection
        console.log('PropertyPanel: Selection updated', selection);
    }

    destroy() {
        this.element.remove();
    }
} 