#!/usr/bin/env node

/**
 * Build script to bundle all V2 modules into a single file
 * This creates a version that works without a web server
 */

const fs = require('fs');
const path = require('path');

console.log('🔨 Building Mermaid Editor V2 Bundle...\n');

// Read all source files in order
const sourceFiles = [
    // Core modules first
    'src/core/EventBus.js',
    'src/core/StateManager.js', 
    'src/core/HistoryManager.js',
    
    // Canvas modules
    'src/canvas/Canvas.js',
    'src/canvas/CanvasManager.js',
    
    // UI modules
    'src/ui/Toolbar.js',
    'src/ui/ContextMenuSystem.js',
    'src/ui/PropertyPanel.js',
    
    // Utils
    'src/utils/AnimationManager.js',
    'src/utils/ContrastManager.js',
    'src/utils/PixelPerfectRenderer.js',
    
    // Features
    'v2-architecture/NestedCanvas.js',
    'v2-architecture/XRayVision.js',
    'v2-architecture/ConnectionFlow.js',
    
    // Main editor last
    'src/MermaidEditor.js'
];

let bundleContent = `
/**
 * Mermaid Editor V2 - Bundled Version
 * Generated on ${new Date().toISOString()}
 */

(function(window) {
    'use strict';
    
    // Module registry
    const modules = {};
    
`;

// Process each file
sourceFiles.forEach(filePath => {
    console.log(`  📄 Processing ${filePath}...`);
    
    try {
        let content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
        
        // Extract module name from file path
        const moduleName = path.basename(filePath, '.js');
        
        // Remove import/export statements
        content = content
            // Remove imports
            .replace(/^import\s+.*?from\s+.*?;?\s*$/gm, '')
            // Remove named exports
            .replace(/^export\s+{.*?};?\s*$/gm, '')
            // Convert export class to regular class
            .replace(/export\s+class\s+(\w+)/g, 'class $1')
            // Convert export const/let/var
            .replace(/export\s+(const|let|var)\s+/g, '$1 ')
            // Remove export default
            .replace(/export\s+default\s+/g, '');
        
        // Wrap in module
        bundleContent += `
    // ===== ${moduleName} =====
    modules['${moduleName}'] = (function() {
        ${content}
        
        // Export what's needed
        return {
            ${moduleName}: typeof ${moduleName} !== 'undefined' ? ${moduleName} : null
        };
    })();
    
`;
    } catch (error) {
        console.error(`  ❌ Error processing ${filePath}:`, error.message);
    }
});

// Add module resolution and global exposure
bundleContent += `
    // Expose modules globally
    Object.keys(modules).forEach(name => {
        const module = modules[name];
        if (module && module[name]) {
            window[name] = module[name];
        }
    });
    
    // Create convenience references
    window.MermaidEditorV2 = {
        EventBus: modules.EventBus?.EventBus,
        StateManager: modules.StateManager?.StateManager,
        HistoryManager: modules.HistoryManager?.HistoryManager,
        Canvas: modules.Canvas?.Canvas,
        CanvasManager: modules.CanvasManager?.CanvasManager,
        Toolbar: modules.Toolbar?.Toolbar,
        ContextMenuSystem: modules.ContextMenuSystem?.ContextMenuSystem,
        PropertyPanel: modules.PropertyPanel?.PropertyPanel,
        AnimationManager: modules.AnimationManager?.AnimationManager,
        ContrastManager: modules.ContrastManager?.ContrastManager,
        PixelPerfectRenderer: modules.PixelPerfectRenderer?.PixelPerfectRenderer,
        NestedCanvas: modules.NestedCanvas?.NestedCanvas,
        XRayVision: modules.XRayVision?.XRayVision,
        ConnectionFlow: modules.ConnectionFlow?.ConnectionFlow,
        MermaidEditor: modules.MermaidEditor?.MermaidEditor
    };
    
    console.log('✅ Mermaid Editor V2 modules loaded:', Object.keys(window.MermaidEditorV2));
    
})(window);
`;

// Write bundle file
const outputPath = path.join(__dirname, 'dist', 'mermaid-editor-v2.bundle.js');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, bundleContent);

console.log(`\n✅ Bundle created successfully!`);
console.log(`📦 Output: ${outputPath}`);
console.log(`📏 Size: ${(bundleContent.length / 1024).toFixed(2)} KB`);

// Also create a combined CSS file
console.log('\n🎨 Building CSS bundle...\n');

const cssFiles = [
    'v2-architecture/dark-theme.css',
    'css/main.css'
];

let cssBundle = `/* Mermaid Editor V2 - CSS Bundle */\n\n`;

cssFiles.forEach(filePath => {
    try {
        console.log(`  🎨 Processing ${filePath}...`);
        const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
        cssBundle += `/* ===== ${filePath} ===== */\n${content}\n\n`;
    } catch (error) {
        console.error(`  ❌ Error processing ${filePath}:`, error.message);
    }
});

const cssOutputPath = path.join(__dirname, 'dist', 'mermaid-editor-v2.bundle.css');
fs.writeFileSync(cssOutputPath, cssBundle);

console.log(`\n✅ CSS bundle created!`);
console.log(`🎨 Output: ${cssOutputPath}`);
console.log(`📏 Size: ${(cssBundle.length / 1024).toFixed(2)} KB`);

console.log('\n🎉 Build complete! You can now use the bundled version without a server.');