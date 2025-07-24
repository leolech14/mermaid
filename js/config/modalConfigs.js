/**
 * Modal Configurations - Single source of truth for all modal definitions
 * 
 * EDITING GUIDE:
 * 1. Each modal MUST have a unique ID (key)
 * 2. Each modal MUST specify a type: 'dialog', 'panel', 'popup', 'drawer', or 'contextMenu'
 * 3. Use template for static HTML, populate for dynamic content
 * 4. Actions map button selectors to handler functions
 * 5. All handlers receive (data, close) parameters
 */

export const modalConfigs = {
    // ============================================
    // NODE EDIT MODAL
    // ============================================
    nodeEdit: {
        type: 'dialog',
        template: `
            <div class="modal-header">
                <h3>Edit Node</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <!-- Basic Properties -->
                <fieldset class="modal-section">
                    <legend>Basic Properties</legend>
                    <div class="form-group">
                        <label for="node-id">ID</label>
                        <input type="text" id="node-id" readonly>
                    </div>
                    <div class="form-group">
                        <label for="node-label">Label</label>
                        <input type="text" id="node-label">
                    </div>
                    <div class="form-group">
                        <label for="node-type">Type</label>
                        <select id="node-type">
                            <option value="rectangle">Rectangle</option>
                            <option value="diamond">Diamond</option>
                            <option value="circle">Circle</option>
                            <option value="hexagon">Hexagon</option>
                        </select>
                    </div>
                </fieldset>

                <!-- Position & Size -->
                <fieldset class="modal-section">
                    <legend>Position & Size</legend>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="node-x">X</label>
                            <input type="number" id="node-x">
                        </div>
                        <div class="form-group">
                            <label for="node-y">Y</label>
                            <input type="number" id="node-y">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="node-width">Width</label>
                            <input type="number" id="node-width" min="50">
                        </div>
                        <div class="form-group">
                            <label for="node-height">Height</label>
                            <input type="number" id="node-height" min="30">
                        </div>
                    </div>
                </fieldset>

                <!-- Styling -->
                <fieldset class="modal-section">
                    <legend>Styling</legend>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="node-fill">Fill Color</label>
                            <input type="color" id="node-fill" value="#2D3748">
                        </div>
                        <div class="form-group">
                            <label for="node-border">Border Color</label>
                            <input type="color" id="node-border" value="#B794F4">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="node-border-width">Border Width</label>
                            <input type="range" id="node-border-width" min="1" max="10" value="2">
                            <span class="range-value">2</span>
                        </div>
                        <div class="form-group">
                            <label for="node-border-style">Border Style</label>
                            <select id="node-border-style">
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="node-shadow">
                            Drop Shadow
                        </label>
                    </div>
                </fieldset>

                <!-- Text Styling -->
                <fieldset class="modal-section">
                    <legend>Text Styling</legend>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="node-text-color">Text Color</label>
                            <input type="color" id="node-text-color" value="#F7FAFC">
                        </div>
                        <div class="form-group">
                            <label for="node-font-size">Font Size</label>
                            <input type="range" id="node-font-size" min="10" max="24" value="14">
                            <span class="range-value">14</span>
                        </div>
                    </div>
                </fieldset>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-apply">Apply</button>
            </div>
        `,
        populate: (element, data) => {
            // Populate form fields with node data
            element.querySelector('#node-id').value = data.id || '';
            element.querySelector('#node-label').value = data.label || '';
            element.querySelector('#node-type').value = data.type || 'rectangle';
            element.querySelector('#node-x').value = Math.round(data.x || 0);
            element.querySelector('#node-y').value = Math.round(data.y || 0);
            element.querySelector('#node-width').value = data.width || 120;
            element.querySelector('#node-height').value = data.height || 60;
            element.querySelector('#node-fill').value = data.fillColor || '#2D3748';
            element.querySelector('#node-border').value = data.borderColor || '#B794F4';
            element.querySelector('#node-border-width').value = data.borderWidth || 2;
            element.querySelector('#node-border-style').value = data.borderStyle || 'solid';
            element.querySelector('#node-shadow').checked = data.shadow || false;
            element.querySelector('#node-text-color').value = data.textColor || '#F7FAFC';
            element.querySelector('#node-font-size').value = data.fontSize || 14;

            // Update range displays
            element.querySelectorAll('input[type="range"]').forEach(range => {
                const display = range.nextElementSibling;
                if (display && display.classList.contains('range-value')) {
                    display.textContent = range.value;
                    range.addEventListener('input', () => {
                        display.textContent = range.value;
                    });
                }
            });
        },
        actions: {
            '.modal-cancel': (data, close) => close(),
            '.modal-apply': (data, close) => {
                // Gather form data
                const element = document.getElementById('modal-nodeEdit');
                const formData = {
                    id: element.querySelector('#node-id').value,
                    label: element.querySelector('#node-label').value,
                    type: element.querySelector('#node-type').value,
                    x: parseFloat(element.querySelector('#node-x').value),
                    y: parseFloat(element.querySelector('#node-y').value),
                    width: parseFloat(element.querySelector('#node-width').value),
                    height: parseFloat(element.querySelector('#node-height').value),
                    fillColor: element.querySelector('#node-fill').value,
                    borderColor: element.querySelector('#node-border').value,
                    borderWidth: parseFloat(element.querySelector('#node-border-width').value),
                    borderStyle: element.querySelector('#node-border-style').value,
                    shadow: element.querySelector('#node-shadow').checked,
                    textColor: element.querySelector('#node-text-color').value,
                    fontSize: parseFloat(element.querySelector('#node-font-size').value)
                };

                // Trigger node update event
                document.dispatchEvent(new CustomEvent('nodeUpdate', { 
                    detail: formData 
                }));

                close();
            }
        }
    },

    // ============================================
    // CONNECTION EDIT MODAL
    // ============================================
    connectionEdit: {
        type: 'dialog',
        template: `
            <div class="modal-header">
                <h3>Edit Connection</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <!-- Basic Properties -->
                <fieldset class="modal-section">
                    <legend>Basic Properties</legend>
                    <div class="form-group">
                        <label for="conn-id">ID</label>
                        <input type="text" id="conn-id" readonly>
                    </div>
                    <div class="form-group">
                        <label for="conn-label">Label</label>
                        <input type="text" id="conn-label">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="conn-from">From Node</label>
                            <input type="text" id="conn-from" readonly>
                        </div>
                        <div class="form-group">
                            <label for="conn-to">To Node</label>
                            <input type="text" id="conn-to" readonly>
                        </div>
                    </div>
                </fieldset>

                <!-- Line Styling -->
                <fieldset class="modal-section">
                    <legend>Line Styling</legend>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="conn-style">Style</label>
                            <select id="conn-style">
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="conn-width">Width</label>
                            <input type="range" id="conn-width" min="1" max="10" value="2">
                            <span class="range-value">2</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="conn-color">Color</label>
                        <input type="color" id="conn-color" value="#FBB6CE">
                    </div>
                </fieldset>

                <!-- Arrow & Path -->
                <fieldset class="modal-section">
                    <legend>Arrow & Path</legend>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="conn-arrow">Arrow Style</label>
                            <select id="conn-arrow">
                                <option value="default">Default</option>
                                <option value="open">Open</option>
                                <option value="dot">Dot</option>
                                <option value="diamond">Diamond</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="conn-path">Path Type</label>
                            <select id="conn-path">
                                <option value="straight">Straight</option>
                                <option value="curved">Curved</option>
                                <option value="step">Step</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="conn-animated">
                            Animated
                        </label>
                    </div>
                </fieldset>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-apply">Apply</button>
            </div>
        `,
        populate: (element, data) => {
            element.querySelector('#conn-id').value = data.id || '';
            element.querySelector('#conn-label').value = data.label || '';
            element.querySelector('#conn-from').value = data.from?.id || '';
            element.querySelector('#conn-to').value = data.to?.id || '';
            element.querySelector('#conn-style').value = data.style || 'solid';
            element.querySelector('#conn-width').value = data.strokeWidth || 2;
            element.querySelector('#conn-color').value = data.strokeColor || '#FBB6CE';
            element.querySelector('#conn-arrow').value = data.arrowStyle || 'default';
            element.querySelector('#conn-path').value = data.pathType || 'straight';
            element.querySelector('#conn-animated').checked = data.animated || false;

            // Update range display
            const widthRange = element.querySelector('#conn-width');
            const widthDisplay = widthRange.nextElementSibling;
            widthDisplay.textContent = widthRange.value;
            widthRange.addEventListener('input', () => {
                widthDisplay.textContent = widthRange.value;
            });
        },
        actions: {
            '.modal-cancel': (data, close) => close(),
            '.modal-apply': (data, close) => {
                const element = document.getElementById('modal-connectionEdit');
                const formData = {
                    id: element.querySelector('#conn-id').value,
                    label: element.querySelector('#conn-label').value,
                    style: element.querySelector('#conn-style').value,
                    strokeWidth: parseFloat(element.querySelector('#conn-width').value),
                    strokeColor: element.querySelector('#conn-color').value,
                    arrowStyle: element.querySelector('#conn-arrow').value,
                    pathType: element.querySelector('#conn-path').value,
                    animated: element.querySelector('#conn-animated').checked
                };

                document.dispatchEvent(new CustomEvent('connectionUpdate', {
                    detail: formData
                }));

                close();
            }
        }
    },

    // ============================================
    // BATCH EDIT MODAL
    // ============================================
    batchEdit: {
        type: 'dialog',
        template: `
            <div class="modal-header">
                <h3>Batch Edit Selected Items</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <!-- Node Properties -->
                <fieldset class="modal-section" id="batch-node-section">
                    <legend>Node Properties (<span id="batch-node-count">0</span> selected)</legend>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="batch-node-fill">Fill Color</label>
                            <input type="color" id="batch-node-fill" value="#2D3748">
                        </div>
                        <div class="form-group">
                            <label for="batch-node-border">Border Color</label>
                            <input type="color" id="batch-node-border" value="#B794F4">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="batch-node-border-width">Border Width</label>
                            <input type="range" id="batch-node-border-width" min="1" max="10" value="2">
                            <span class="range-value">2</span>
                        </div>
                        <div class="form-group">
                            <label for="batch-node-border-style">Border Style</label>
                            <select id="batch-node-border-style">
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="batch-node-text-color">Text Color</label>
                            <input type="color" id="batch-node-text-color" value="#F7FAFC">
                        </div>
                        <div class="form-group">
                            <label for="batch-node-font-size">Font Size</label>
                            <input type="range" id="batch-node-font-size" min="10" max="24" value="14">
                            <span class="range-value">14</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="batch-node-shadow">
                            Add Shadow
                        </label>
                    </div>
                </fieldset>

                <!-- Connection Properties -->
                <fieldset class="modal-section" id="batch-conn-section">
                    <legend>Connection Properties (<span id="batch-conn-count">0</span> selected)</legend>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="batch-conn-style">Line Style</label>
                            <select id="batch-conn-style">
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="batch-conn-width">Line Width</label>
                            <input type="range" id="batch-conn-width" min="1" max="10" value="2">
                            <span class="range-value">2</span>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="batch-conn-color">Line Color</label>
                            <input type="color" id="batch-conn-color" value="#FBB6CE">
                        </div>
                        <div class="form-group">
                            <label for="batch-conn-arrow">Arrow Style</label>
                            <select id="batch-conn-arrow">
                                <option value="default">Default</option>
                                <option value="open">Open</option>
                                <option value="dot">Dot</option>
                                <option value="diamond">Diamond</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="batch-conn-animated">
                            Animated
                        </label>
                    </div>
                </fieldset>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-apply">Apply to All</button>
            </div>
        `,
        populate: (element, data) => {
            // Update counts
            element.querySelector('#batch-node-count').textContent = data.nodeCount || 0;
            element.querySelector('#batch-conn-count').textContent = data.connectionCount || 0;

            // Show/hide sections based on selection
            element.querySelector('#batch-node-section').style.display = 
                data.nodeCount > 0 ? 'block' : 'none';
            element.querySelector('#batch-conn-section').style.display = 
                data.connectionCount > 0 ? 'block' : 'none';

            // Update range displays
            element.querySelectorAll('input[type="range"]').forEach(range => {
                const display = range.nextElementSibling;
                if (display && display.classList.contains('range-value')) {
                    display.textContent = range.value;
                    range.addEventListener('input', () => {
                        display.textContent = range.value;
                    });
                }
            });
        },
        actions: {
            '.modal-cancel': (data, close) => close(),
            '.modal-apply': (data, close) => {
                const element = document.getElementById('modal-batchEdit');
                const updates = {
                    nodes: data.nodeCount > 0 ? {
                        fillColor: element.querySelector('#batch-node-fill').value,
                        borderColor: element.querySelector('#batch-node-border').value,
                        borderWidth: parseFloat(element.querySelector('#batch-node-border-width').value),
                        borderStyle: element.querySelector('#batch-node-border-style').value,
                        textColor: element.querySelector('#batch-node-text-color').value,
                        fontSize: parseFloat(element.querySelector('#batch-node-font-size').value),
                        shadow: element.querySelector('#batch-node-shadow').checked
                    } : null,
                    connections: data.connectionCount > 0 ? {
                        style: element.querySelector('#batch-conn-style').value,
                        strokeWidth: parseFloat(element.querySelector('#batch-conn-width').value),
                        strokeColor: element.querySelector('#batch-conn-color').value,
                        arrowStyle: element.querySelector('#batch-conn-arrow').value,
                        animated: element.querySelector('#batch-conn-animated').checked
                    } : null
                };

                document.dispatchEvent(new CustomEvent('batchUpdate', {
                    detail: updates
                }));

                close();
            }
        }
    },

    // ============================================
    // NODE CONTEXT MENU
    // ============================================
    nodeContext: {
        type: 'contextMenu',
        template: `
            <div class="context-menu-item" data-action="edit">Edit Node</div>
            <div class="context-menu-item" data-action="duplicate">Duplicate</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="connect">Create Connection</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="bring-front">Bring to Front</div>
            <div class="context-menu-item" data-action="send-back">Send to Back</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item context-menu-danger" data-action="delete">Delete</div>
        `,
        actions: {
            '[data-action="edit"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('nodeEdit', { detail: data }));
                close();
            },
            '[data-action="duplicate"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('nodeDuplicate', { detail: data }));
                close();
            },
            '[data-action="connect"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('nodeConnect', { detail: data }));
                close();
            },
            '[data-action="bring-front"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('nodeBringFront', { detail: data }));
                close();
            },
            '[data-action="send-back"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('nodeSendBack', { detail: data }));
                close();
            },
            '[data-action="delete"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('nodeDelete', { detail: data }));
                close();
            }
        }
    },

    // ============================================
    // CONNECTION CONTEXT MENU
    // ============================================
    connectionContext: {
        type: 'contextMenu',
        template: `
            <div class="context-menu-item" data-action="edit">Edit Connection</div>
            <div class="context-menu-item" data-action="add-label">Add Label</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="reverse">Reverse Direction</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item context-menu-danger" data-action="delete">Delete</div>
        `,
        actions: {
            '[data-action="edit"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('connectionEdit', { detail: data }));
                close();
            },
            '[data-action="add-label"]': (data, close) => {
                const label = prompt('Enter connection label:', data.label || '');
                if (label !== null) {
                    document.dispatchEvent(new CustomEvent('connectionLabelUpdate', { 
                        detail: { ...data, label }
                    }));
                }
                close();
            },
            '[data-action="reverse"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('connectionReverse', { detail: data }));
                close();
            },
            '[data-action="delete"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('connectionDelete', { detail: data }));
                close();
            }
        }
    },

    // ============================================
    // MULTI-SELECT CONTEXT MENU
    // ============================================
    multiSelectContext: {
        type: 'contextMenu',
        template: `
            <div class="context-menu-header">
                <span id="multi-select-count">0 items selected</span>
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="batch-edit">
                <strong>✏️ Batch Edit All Properties...</strong>
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="align-left">Align Left</div>
            <div class="context-menu-item" data-action="align-center">Align Center</div>
            <div class="context-menu-item" data-action="align-right">Align Right</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="align-top">Align Top</div>
            <div class="context-menu-item" data-action="align-middle">Align Middle</div>
            <div class="context-menu-item" data-action="align-bottom">Align Bottom</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="distribute-h">Distribute Horizontally</div>
            <div class="context-menu-item" data-action="distribute-v">Distribute Vertically</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item context-menu-danger" data-action="delete">Delete Selected</div>
        `,
        populate: (element, data) => {
            const total = (data.nodeCount || 0) + (data.connectionCount || 0);
            element.querySelector('#multi-select-count').textContent = 
                `${data.nodeCount || 0} nodes, ${data.connectionCount || 0} connections`;
        },
        actions: {
            '[data-action="batch-edit"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('openBatchEdit', { detail: data }));
                close();
            },
            '[data-action="align-left"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('alignNodes', { 
                    detail: { ...data, alignment: 'left' }
                }));
                close();
            },
            '[data-action="align-center"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('alignNodes', { 
                    detail: { ...data, alignment: 'center' }
                }));
                close();
            },
            '[data-action="align-right"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('alignNodes', { 
                    detail: { ...data, alignment: 'right' }
                }));
                close();
            },
            '[data-action="align-top"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('alignNodes', { 
                    detail: { ...data, alignment: 'top' }
                }));
                close();
            },
            '[data-action="align-middle"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('alignNodes', { 
                    detail: { ...data, alignment: 'middle' }
                }));
                close();
            },
            '[data-action="align-bottom"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('alignNodes', { 
                    detail: { ...data, alignment: 'bottom' }
                }));
                close();
            },
            '[data-action="distribute-h"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('distributeNodes', { 
                    detail: { ...data, direction: 'horizontal' }
                }));
                close();
            },
            '[data-action="distribute-v"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('distributeNodes', { 
                    detail: { ...data, direction: 'vertical' }
                }));
                close();
            },
            '[data-action="delete"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('deleteSelected', { detail: data }));
                close();
            }
        }
    },

    // ============================================
    // BACKGROUND CONTEXT MENU
    // ============================================
    backgroundContext: {
        type: 'contextMenu',
        template: `
            <div class="context-menu-item" data-action="add-node">Add Node Here</div>
            <div class="context-menu-item" data-action="paste">Paste</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="select-all">Select All</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="zoom-in">Zoom In</div>
            <div class="context-menu-item" data-action="zoom-out">Zoom Out</div>
            <div class="context-menu-item" data-action="zoom-fit">Zoom to Fit</div>
        `,
        actions: {
            '[data-action="add-node"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('createNode', { 
                    detail: { x: data.position.x, y: data.position.y } 
                }));
                close();
            },
            '[data-action="paste"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('paste', { detail: data }));
                close();
            },
            '[data-action="select-all"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('selectAll', { detail: {} }));
                close();
            },
            '[data-action="zoom-in"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('zoomIn', { detail: {} }));
                close();
            },
            '[data-action="zoom-out"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('zoomOut', { detail: {} }));
                close();
            },
            '[data-action="zoom-fit"]': (data, close) => {
                document.dispatchEvent(new CustomEvent('zoomFit', { detail: {} }));
                close();
            }
        }
    },

    // ============================================
    // MULTI-NODE CONTEXT MENU
    // ============================================
    multiNodeContext: {
        type: 'contextMenu',
        template: `
            <div class="context-menu-header">Multiple Nodes Selected</div>
            <div class="context-menu-item" data-action="edit">Edit Selected Nodes</div>
            <div class="context-menu-item" data-action="align-horizontal">Align Horizontally</div>
            <div class="context-menu-item" data-action="align-vertical">Align Vertically</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="group">Group</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item context-menu-danger" data-action="delete">Delete All</div>
        `,
        actions: {
            '[data-action="edit"]': (data, close) => {
                window.modalSystem.open('batchEdit', { items: data.nodes, type: 'nodes' });
                close();
            },
            '[data-action="delete"]': (data, close) => {
                if (confirm(`Delete ${data.nodes.length} nodes?`)) {
                    data.nodes.forEach(node => {
                        document.dispatchEvent(new CustomEvent('deleteNode', { detail: { id: node.id } }));
                    });
                }
                close();
            }
        }
    },

    // ============================================
    // MULTI-CONNECTION CONTEXT MENU
    // ============================================
    multiConnectionContext: {
        type: 'contextMenu',
        template: `
            <div class="context-menu-header">Multiple Connections Selected</div>
            <div class="context-menu-item" data-action="edit">Edit Selected Connections</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item context-menu-danger" data-action="delete">Delete All</div>
        `,
        actions: {
            '[data-action="edit"]': (data, close) => {
                window.modalSystem.open('batchEdit', { items: data.connections, type: 'connections' });
                close();
            },
            '[data-action="delete"]': (data, close) => {
                if (confirm(`Delete ${data.connections.length} connections?`)) {
                    data.connections.forEach(conn => {
                        document.dispatchEvent(new CustomEvent('deleteConnection', { detail: { id: conn.id } }));
                    });
                }
                close();
            }
        }
    }
};

// ============================================
// MODAL REGISTRATION HELPER
// ============================================
export function registerAllModals(modalSystem) {
    Object.entries(modalConfigs).forEach(([id, config]) => {
        modalSystem.register(id, config);
    });
}