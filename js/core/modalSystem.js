/**
 * Modal System - Centralized modal management with foolproof architecture
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. Single source of truth for all modals
 * 2. Type-safe configuration with validation
 * 3. Consistent API across all modal types
 * 4. Automatic cleanup and memory management
 * 5. Clear separation of concerns
 */

class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
        this.config = null;
        this.init();
    }

    init() {
        // Global ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal);
            }
        });

        // Click outside handler
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target.classList.contains('modal-overlay')) {
                this.close(this.activeModal);
            }
        });
    }

    /**
     * Register a modal with validated configuration
     * @param {string} id - Unique modal identifier
     * @param {ModalConfig} config - Modal configuration object
     */
    register(id, config) {
        // Validate configuration
        this.validateConfig(id, config);
        
        // Store modal configuration
        this.modals.set(id, {
            id,
            config,
            element: null,
            isOpen: false,
            data: null
        });

        // Create DOM element if template provided
        if (config.template) {
            this.createModalElement(id, config);
        }
    }

    /**
     * Open a modal with optional data
     * @param {string} id - Modal identifier
     * @param {Object} data - Data to pass to modal
     */
    open(id, data = {}) {
        const modal = this.modals.get(id);
        if (!modal) {
            throw new Error(`Modal '${id}' not registered`);
        }

        // Close any active modal
        if (this.activeModal && this.activeModal !== id) {
            this.close(this.activeModal);
        }

        // Initialize modal
        modal.data = data;
        modal.isOpen = true;
        this.activeModal = id;

        // Show modal element
        if (modal.element) {
            modal.element.style.display = 'block';
            modal.element.classList.add('modal-open');
            
            // Position context menus at cursor
            if (modal.config.type === 'contextMenu' && data.x && data.y) {
                const container = modal.element.querySelector('.modal-container');
                if (container) {
                    container.style.position = 'fixed';
                    container.style.left = data.x + 'px';
                    container.style.top = data.y + 'px';
                    
                    // Ensure menu doesn't go off screen
                    setTimeout(() => {
                        const rect = container.getBoundingClientRect();
                        if (rect.right > window.innerWidth) {
                            container.style.left = (window.innerWidth - rect.width - 10) + 'px';
                        }
                        if (rect.bottom > window.innerHeight) {
                            container.style.top = (window.innerHeight - rect.height - 10) + 'px';
                        }
                    }, 0);
                }
            }
        }

        // Call lifecycle hooks
        if (modal.config.onBeforeOpen) {
            modal.config.onBeforeOpen(data);
        }

        // Populate modal with data
        if (modal.config.populate) {
            modal.config.populate(modal.element, data);
        }

        if (modal.config.onAfterOpen) {
            modal.config.onAfterOpen(data);
        }

        return modal;
    }

    /**
     * Close a modal
     * @param {string} id - Modal identifier
     */
    close(id) {
        const modal = this.modals.get(id);
        if (!modal || !modal.isOpen) return;

        // Call lifecycle hooks
        if (modal.config.onBeforeClose) {
            const preventClose = modal.config.onBeforeClose(modal.data);
            if (preventClose === false) return;
        }

        // Hide modal element
        if (modal.element) {
            modal.element.style.display = 'none';
            modal.element.classList.remove('modal-open');
        }

        // Clean up state
        modal.isOpen = false;
        modal.data = null;
        
        if (this.activeModal === id) {
            this.activeModal = null;
        }

        if (modal.config.onAfterClose) {
            modal.config.onAfterClose();
        }
    }

    /**
     * Update modal data
     * @param {string} id - Modal identifier
     * @param {Object} data - New data
     */
    update(id, data) {
        const modal = this.modals.get(id);
        if (!modal || !modal.isOpen) return;

        modal.data = { ...modal.data, ...data };

        if (modal.config.populate) {
            modal.config.populate(modal.element, modal.data);
        }

        if (modal.config.onUpdate) {
            modal.config.onUpdate(modal.data);
        }
    }

    /**
     * Get modal instance
     * @param {string} id - Modal identifier
     */
    get(id) {
        return this.modals.get(id);
    }

    /**
     * Create modal DOM element from template
     */
    createModalElement(id, config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'modal-wrapper';
        wrapper.id = `modal-${id}`;
        wrapper.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container">
                ${config.template}
            </div>
        `;

        // Add event listeners for close button
        const closeBtn = wrapper.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close(id));
        }

        // Store reference and append to body
        const modal = this.modals.get(id);
        modal.element = wrapper;
        document.body.appendChild(wrapper);

        // Bind action buttons if configured
        if (config.actions) {
            this.bindActions(id, config.actions);
        }
    }

    /**
     * Bind action buttons to modal
     */
    bindActions(id, actions) {
        const modal = this.modals.get(id);
        if (!modal || !modal.element) return;

        Object.entries(actions).forEach(([selector, handler]) => {
            const button = modal.element.querySelector(selector);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    handler(modal.data, () => this.close(id));
                });
            }
        });
    }

    /**
     * Validate modal configuration
     */
    validateConfig(id, config) {
        const required = ['type'];
        const valid = ['type', 'template', 'populate', 'actions', 
                      'onBeforeOpen', 'onAfterOpen', 'onBeforeClose', 
                      'onAfterClose', 'onUpdate'];

        // Check required fields
        required.forEach(field => {
            if (!config[field]) {
                throw new Error(`Modal '${id}' missing required field: ${field}`);
            }
        });

        // Check for unknown fields
        Object.keys(config).forEach(field => {
            if (!valid.includes(field)) {
                console.warn(`Modal '${id}' has unknown field: ${field}`);
            }
        });

        // Validate types
        const validTypes = ['dialog', 'panel', 'popup', 'drawer', 'contextMenu'];
        if (!validTypes.includes(config.type)) {
            throw new Error(`Modal '${id}' has invalid type: ${config.type}`);
        }
    }

    /**
     * Destroy modal and clean up
     */
    destroy(id) {
        const modal = this.modals.get(id);
        if (!modal) return;

        // Close if open
        if (modal.isOpen) {
            this.close(id);
        }

        // Remove DOM element
        if (modal.element && modal.element.parentNode) {
            modal.element.parentNode.removeChild(modal.element);
        }

        // Remove from registry
        this.modals.delete(id);
    }

    /**
     * Destroy all modals
     */
    destroyAll() {
        this.modals.forEach((modal, id) => {
            this.destroy(id);
        });
    }
}

// Export singleton instance
export const modalSystem = new ModalSystem();

// Type definitions for better IDE support
/**
 * @typedef {Object} ModalConfig
 * @property {'dialog'|'panel'|'popup'|'drawer'|'contextMenu'} type - Modal type
 * @property {string} [template] - HTML template string
 * @property {Function} [populate] - Function to populate modal with data
 * @property {Object} [actions] - Button selector to handler mapping
 * @property {Function} [onBeforeOpen] - Called before modal opens
 * @property {Function} [onAfterOpen] - Called after modal opens
 * @property {Function} [onBeforeClose] - Called before modal closes (return false to prevent)
 * @property {Function} [onAfterClose] - Called after modal closes
 * @property {Function} [onUpdate] - Called when modal data updates
 */