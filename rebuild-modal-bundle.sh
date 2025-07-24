#!/bin/bash

# Rebuild modal system bundle by concatenating files

echo "Rebuilding modal system bundle..."

cat > js/modalSystem.bundle.js << 'EOF'
/**
 * Modal System Bundle - All-in-one modal system for Mermaid Editor
 * This is a bundled version that doesn't require ES6 modules
 */

// ============================================
// MODAL SYSTEM CORE
// ============================================
EOF

# Add the modal system core (remove export)
echo "const ModalSystem = (function() {" >> js/modalSystem.bundle.js
sed 's/export class ModalSystem/class ModalSystem/' js/core/modalSystem.js | sed 's/export const modalSystem.*//' >> js/modalSystem.bundle.js
echo "    return ModalSystem;" >> js/modalSystem.bundle.js
echo "})();" >> js/modalSystem.bundle.js
echo "" >> js/modalSystem.bundle.js

# Add modal configs (remove export)
echo "// ============================================" >> js/modalSystem.bundle.js
echo "// MODAL CONFIGURATIONS" >> js/modalSystem.bundle.js
echo "// ============================================" >> js/modalSystem.bundle.js
sed 's/export const modalConfigs/const modalConfigs/' js/config/modalConfigs.js >> js/modalSystem.bundle.js
echo "" >> js/modalSystem.bundle.js

# Add styles
echo "// ============================================" >> js/modalSystem.bundle.js
echo "// INJECT STYLES" >> js/modalSystem.bundle.js
echo "// ============================================" >> js/modalSystem.bundle.js
echo "(function() {" >> js/modalSystem.bundle.js
echo "    const link = document.createElement('link');" >> js/modalSystem.bundle.js
echo "    link.rel = 'stylesheet';" >> js/modalSystem.bundle.js
echo "    link.href = '../js/ui/modalStyles.css';" >> js/modalSystem.bundle.js
echo "    document.head.appendChild(link);" >> js/modalSystem.bundle.js
echo "})();" >> js/modalSystem.bundle.js
echo "" >> js/modalSystem.bundle.js

# Add initialization
echo "// ============================================" >> js/modalSystem.bundle.js
echo "// INITIALIZE MODAL SYSTEM" >> js/modalSystem.bundle.js
echo "// ============================================" >> js/modalSystem.bundle.js
echo "window.modalSystem = new ModalSystem();" >> js/modalSystem.bundle.js
echo "" >> js/modalSystem.bundle.js
echo "// Register all modals" >> js/modalSystem.bundle.js
echo "Object.entries(modalConfigs).forEach(([id, config]) => {" >> js/modalSystem.bundle.js
echo "    window.modalSystem.register(id, config);" >> js/modalSystem.bundle.js
echo "});" >> js/modalSystem.bundle.js
echo "" >> js/modalSystem.bundle.js

# Add legacy mappings
cat >> js/modalSystem.bundle.js << 'EOF'
// ============================================
// LEGACY FUNCTION MAPPINGS
// ============================================
window.openNodeEditPopup = function(nodeData) {
    window.modalSystem.open('nodeEdit', nodeData);
};

window.closeNodeEditPopup = function() {
    window.modalSystem.close('nodeEdit');
};

window.openConnectionEditPopup = function(connectionData) {
    window.modalSystem.open('connectionEdit', connectionData);
};

window.closeConnectionEditPopup = function() {
    window.modalSystem.close('connectionEdit');
};

window.openBatchEditPopup = function(items, type) {
    window.modalSystem.open('batchEdit', { items, type });
};

window.closeBatchEditPopup = function() {
    window.modalSystem.close('batchEdit');
};

console.log('Modal System loaded with', window.modalSystem.modals.size, 'modals');
EOF

chmod +x js/modalSystem.bundle.js
echo "Modal bundle rebuilt successfully!"