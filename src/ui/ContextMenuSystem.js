/**
 * Context Menu System - Handles all right-click context menus
 * Implements glass morphism design with smooth animations
 */

export class ContextMenuSystem {
    constructor(editor) {
        this.editor = editor;
        this.currentMenu = null;
        this.menuContainer = null;
        
        this.createContainer();
        this.bindEvents();
        this.registerMenus();
    }

    createContainer() {
        // Create menu container
        this.menuContainer = document.createElement('div');
        this.menuContainer.className = 'context-menu-container';
        this.menuContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(this.menuContainer);
    }

    bindEvents() {
        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (this.currentMenu && !this.currentMenu.contains(e.target)) {
                this.closeMenu();
            }
        });
        
        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentMenu) {
                this.closeMenu();
            }
        });
        
        // Subscribe to canvas events
        this.editor.eventBus.on('canvas:contextmenu', (data) => {
            this.handleCanvasContextMenu(data);
        });
        
        this.editor.eventBus.on('node:contextmenu', (data) => {
            this.handleNodeContextMenu(data);
        });
        
        this.editor.eventBus.on('connection:contextmenu', (data) => {
            this.handleConnectionContextMenu(data);
        });
    }

    registerMenus() {
        // Define menu configurations
        this.menus = {
            canvas: {
                items: [
                    {
                        label: 'Create Node',
                        icon: 'add_box',
                        action: 'createNode',
                        shortcut: 'N'
                    },
                    {
                        label: 'Paste',
                        icon: 'content_paste',
                        action: 'paste',
                        shortcut: 'Ctrl+V',
                        enabled: () => this.editor.clipboard && this.editor.clipboard.hasData()
                    },
                    { type: 'separator' },
                    {
                        label: 'Select All',
                        icon: 'select_all',
                        action: 'selectAll',
                        shortcut: 'Ctrl+A'
                    },
                    {
                        label: 'Zoom to Fit',
                        icon: 'zoom_out_map',
                        action: 'zoomToFit',
                        shortcut: 'Ctrl+0'
                    },
                    { type: 'separator' },
                    {
                        label: 'Export',
                        icon: 'download',
                        submenu: [
                            { label: 'Export as SVG', action: 'exportSVG' },
                            { label: 'Export as PNG', action: 'exportPNG' },
                            { label: 'Export as JSON', action: 'exportJSON' }
                        ]
                    }
                ]
            },
            
            node: {
                items: [
                    {
                        label: 'Edit Label',
                        icon: 'edit',
                        action: 'editLabel',
                        shortcut: 'F2'
                    },
                    {
                        label: 'Edit Properties',
                        icon: 'tune',
                        action: 'editProperties'
                    },
                    { type: 'separator' },
                    {
                        label: 'Copy',
                        icon: 'content_copy',
                        action: 'copy',
                        shortcut: 'Ctrl+C'
                    },
                    {
                        label: 'Cut',
                        icon: 'content_cut',
                        action: 'cut',
                        shortcut: 'Ctrl+X'
                    },
                    {
                        label: 'Duplicate',
                        icon: 'control_point_duplicate',
                        action: 'duplicate',
                        shortcut: 'Ctrl+D'
                    },
                    { type: 'separator' },
                    {
                        label: 'Create Inner Canvas',
                        icon: 'dashboard',
                        action: 'createInnerCanvas',
                        enabled: (node) => !node.innerCanvas
                    },
                    {
                        label: 'Enter Inner Canvas',
                        icon: 'login',
                        action: 'enterInnerCanvas',
                        enabled: (node) => node.innerCanvas
                    },
                    { type: 'separator' },
                    {
                        label: 'Bring to Front',
                        icon: 'flip_to_front',
                        action: 'bringToFront'
                    },
                    {
                        label: 'Send to Back',
                        icon: 'flip_to_back',
                        action: 'sendToBack'
                    },
                    { type: 'separator' },
                    {
                        label: 'Delete',
                        icon: 'delete',
                        action: 'delete',
                        shortcut: 'Delete',
                        className: 'danger'
                    }
                ]
            },
            
            connection: {
                items: [
                    {
                        label: 'Edit Label',
                        icon: 'edit',
                        action: 'editLabel'
                    },
                    {
                        label: 'Change Style',
                        icon: 'brush',
                        submenu: [
                            { label: 'Solid', action: 'styleeSolid' },
                            { label: 'Dashed', action: 'styleDashed' },
                            { label: 'Dotted', action: 'styleDotted' }
                        ]
                    },
                    { type: 'separator' },
                    {
                        label: 'Delete',
                        icon: 'delete',
                        action: 'delete',
                        shortcut: 'Delete',
                        className: 'danger'
                    }
                ]
            }
        };
    }

    showMenu(menuType, position, context = {}) {
        this.closeMenu();
        
        const menuConfig = this.menus[menuType];
        if (!menuConfig) return;
        
        // Create menu element
        const menu = document.createElement('div');
        menu.className = 'context-menu glass-panel';
        menu.style.cssText = `
            position: absolute;
            min-width: 200px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
        `;
        
        // Add glass effect
        const glassInner = document.createElement('div');
        glassInner.className = 'glass-inner-glow';
        menu.appendChild(glassInner);
        
        // Create menu items
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'context-menu-items';
        itemsContainer.style.cssText = `
            position: relative;
            padding: 4px;
        `;
        
        menuConfig.items.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                separator.style.cssText = `
                    height: 1px;
                    background: var(--color-border);
                    margin: 4px 8px;
                    opacity: 0.3;
                `;
                itemsContainer.appendChild(separator);
            } else {
                const menuItem = this.createMenuItem(item, context);
                itemsContainer.appendChild(menuItem);
            }
        });
        
        menu.appendChild(itemsContainer);
        
        // Position menu
        this.positionMenu(menu, position);
        
        // Add to container
        this.menuContainer.appendChild(menu);
        this.currentMenu = menu;
        
        // Animate in
        requestAnimationFrame(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1) translateY(0)';
        });
    }

    createMenuItem(item, context) {
        const menuItem = document.createElement('div');
        menuItem.className = `context-menu-item ${item.className || ''}`;
        
        // Check if enabled
        const isEnabled = !item.enabled || item.enabled(context);
        if (!isEnabled) {
            menuItem.classList.add('disabled');
        }
        
        menuItem.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 12px;
            cursor: ${isEnabled ? 'pointer' : 'default'};
            border-radius: 4px;
            transition: all 0.15s ease;
            user-select: none;
            opacity: ${isEnabled ? '1' : '0.5'};
        `;
        
        // Icon
        if (item.icon) {
            const icon = document.createElement('span');
            icon.className = 'context-menu-icon';
            icon.style.cssText = `
                width: 20px;
                height: 20px;
                margin-right: 8px;
                opacity: 0.8;
            `;
            icon.innerHTML = this.getIcon(item.icon);
            menuItem.appendChild(icon);
        }
        
        // Label
        const label = document.createElement('span');
        label.className = 'context-menu-label';
        label.style.cssText = `
            flex: 1;
            font-size: 14px;
        `;
        label.textContent = item.label;
        menuItem.appendChild(label);
        
        // Shortcut
        if (item.shortcut) {
            const shortcut = document.createElement('span');
            shortcut.className = 'context-menu-shortcut';
            shortcut.style.cssText = `
                font-size: 12px;
                opacity: 0.6;
                margin-left: 16px;
            `;
            shortcut.textContent = item.shortcut;
            menuItem.appendChild(shortcut);
        }
        
        // Submenu arrow
        if (item.submenu) {
            const arrow = document.createElement('span');
            arrow.className = 'context-menu-arrow';
            arrow.style.cssText = `
                margin-left: 8px;
                opacity: 0.6;
            `;
            arrow.innerHTML = '▶';
            menuItem.appendChild(arrow);
        }
        
        // Events
        if (isEnabled) {
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = 'var(--color-surface-hover)';
                
                if (item.submenu) {
                    this.showSubmenu(menuItem, item.submenu, context);
                }
            });
            
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = '';
            });
            
            if (!item.submenu) {
                menuItem.addEventListener('click', () => {
                    this.handleAction(item.action, context);
                    this.closeMenu();
                });
            }
        }
        
        return menuItem;
    }

    showSubmenu(parentItem, items, context) {
        // Implementation for submenus
        // Similar to showMenu but positioned relative to parent item
    }

    positionMenu(menu, position) {
        // Add to container temporarily to get dimensions
        menu.style.visibility = 'hidden';
        this.menuContainer.appendChild(menu);
        
        const menuRect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let x = position.x;
        let y = position.y;
        
        // Adjust if menu would go off screen
        if (x + menuRect.width > windowWidth - 10) {
            x = windowWidth - menuRect.width - 10;
        }
        
        if (y + menuRect.height > windowHeight - 10) {
            y = windowHeight - menuRect.height - 10;
        }
        
        // Ensure minimum distance from edges
        x = Math.max(10, x);
        y = Math.max(10, y);
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.visibility = '';
    }

    handleCanvasContextMenu(data) {
        this.showMenu('canvas', data.screenPoint, { point: data.point });
    }

    handleNodeContextMenu(data) {
        this.showMenu('node', data.screenPoint, data.node);
    }

    handleConnectionContextMenu(data) {
        this.showMenu('connection', data.screenPoint, data.connection);
    }

    handleAction(action, context) {
        // Emit action event for the editor to handle
        this.editor.eventBus.emit(`contextmenu:${action}`, context);
        
        // Also handle some common actions directly
        switch (action) {
            case 'createNode':
                const nodeData = {
                    position: context.point || { x: 100, y: 100 },
                    label: 'New Node'
                };
                this.editor.createNode(nodeData);
                break;
                
            case 'delete':
                if (context.id) {
                    if (context.type === 'node') {
                        this.editor.deleteNode(context.id);
                    } else if (context.type === 'connection') {
                        this.editor.deleteConnection(context.id);
                    }
                }
                break;
                
            case 'selectAll':
                this.editor.selectAll();
                break;
                
            case 'zoomToFit':
                this.editor.toolbar.fitToScreen();
                break;
        }
    }

    closeMenu() {
        if (this.currentMenu) {
            // Animate out
            this.currentMenu.style.opacity = '0';
            this.currentMenu.style.transform = 'scale(0.95) translateY(-10px)';
            
            setTimeout(() => {
                if (this.currentMenu && this.currentMenu.parentNode) {
                    this.currentMenu.parentNode.removeChild(this.currentMenu);
                }
                this.currentMenu = null;
            }, 150);
        }
    }

    getIcon(iconName) {
        // Simple icon mapping - in production, use proper icon system
        const icons = {
            'add_box': '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>',
            'edit': '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
            'delete': '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
            // Add more icons as needed
        };
        
        return icons[iconName] || '';
    }

    destroy() {
        this.closeMenu();
        if (this.menuContainer && this.menuContainer.parentNode) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
        }
    }
} 