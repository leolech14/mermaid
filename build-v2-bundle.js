#!/usr/bin/env node

/**
 * Build script for Mermaid Editor V2 Bundle
 * Creates a single bundled JS and CSS file from all V2 modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const V2_ARCH_DIR = path.join(__dirname, 'v2-architecture');
const DIST_DIR = path.join(__dirname, 'dist');
const JS_OUTPUT = path.join(DIST_DIR, 'mermaid-editor-v2.bundle.js');
const CSS_OUTPUT = path.join(DIST_DIR, 'mermaid-editor-v2.bundle.css');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Module loading order (dependencies first)
const moduleOrder = [
    // Core utilities
    'core/EventBus.js',
    'core/StateManager.js',
    'core/HistoryManager.js',
    'utils/AnimationManager.js',
    'utils/ContrastManager.js',
    'utils/PixelPerfectRenderer.js',
    
    // Canvas system
    'canvas/Canvas.js',
    'canvas/CanvasManager.js',
    
    // UI components
    'ui/Toolbar.js',
    'ui/ContextMenuSystem.js',
    'ui/PropertyPanel.js',
    
    // Advanced features (from v2-architecture)
    'NestedCanvas.js',
    'XRayVision.js',
    'ConnectionFlow.js',
    
    // Interactive features
    'V2InteractiveFeatures.js',
    
    // Main editor (must be last)
    'MermaidEditor.js'
];

// Helper function to read file content
function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.warn(`Warning: Could not read ${filePath}:`, error.message);
        return null;
    }
}

// Extract module name from file path
function getModuleName(filePath) {
    const basename = path.basename(filePath, '.js');
    return basename;
}

// Build JavaScript bundle
function buildJavaScriptBundle() {
    console.log('Building JavaScript bundle...');
    
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

    // Process each module
    moduleOrder.forEach(modulePath => {
        // Try both src and v2-architecture directories
        let fullPath = path.join(SRC_DIR, modulePath);
        let content = readFileContent(fullPath);
        
        if (!content) {
            fullPath = path.join(V2_ARCH_DIR, modulePath);
            content = readFileContent(fullPath);
        }
        
        if (content) {
            const moduleName = getModuleName(modulePath);
            console.log(`  Adding module: ${moduleName}`);
            
            // Wrap module in IIFE and register it
            bundleContent += `
    // ===== ${moduleName} =====
    modules['${moduleName}'] = (function() {
        ${content}
        
        // Export the main class/object
        if (typeof ${moduleName} !== 'undefined') {
            return { ${moduleName} };
        }
        return {};
    })();
    
`;
        }
    });

    // Add exports
    bundleContent += `
    // Export all modules to window.MermaidEditorV2
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
        V2InteractiveFeatures: modules.V2InteractiveFeatures?.V2InteractiveFeatures,
        MermaidEditor: modules.MermaidEditor?.MermaidEditor
    };
    
    console.log('✅ Mermaid Editor V2 modules loaded:', Object.keys(window.MermaidEditorV2));
    
})(window);
`;

    // Write bundle
    fs.writeFileSync(JS_OUTPUT, bundleContent);
    console.log(`✅ JavaScript bundle created: ${JS_OUTPUT}`);
}

// Build CSS bundle
function buildCSSBundle() {
    console.log('Building CSS bundle...');
    
    // CSS files to bundle
    const cssFiles = [
        'dark-theme.css'
    ];
    
    let cssContent = `/**
 * Mermaid Editor V2 - Bundled CSS
 * Generated on ${new Date().toISOString()}
 */

`;

    // Process each CSS file
    cssFiles.forEach(cssFile => {
        const fullPath = path.join(V2_ARCH_DIR, cssFile);
        const content = readFileContent(fullPath);
        
        if (content) {
            console.log(`  Adding CSS: ${cssFile}`);
            cssContent += `/* ===== ${cssFile} ===== */\n${content}\n\n`;
        }
    });
    
    // Add additional V2 styles
    cssContent += `
/* ===== V2 Editor Styles ===== */
.editor-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--color-background, #0F1419);
    color: var(--color-text, #F7FAFC);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.editor-header {
    height: 60px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-main {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.editor-sidebar {
    width: 240px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-canvas-area {
    flex: 1;
    position: relative;
}

.editor-properties {
    width: 300px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.canvas-container {
    width: 100%;
    height: 100%;
    position: relative;
}

/* Glass morphism panels */
.glass-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.18);
}

/* Loading states */
.editor-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 18px;
    color: var(--color-text-secondary);
}
`;

    // Write CSS bundle
    fs.writeFileSync(CSS_OUTPUT, cssContent);
    console.log(`✅ CSS bundle created: ${CSS_OUTPUT}`);
}

// Main build process
console.log('🚀 Starting Mermaid Editor V2 build...\n');

try {
    buildJavaScriptBundle();
    buildCSSBundle();
    
    console.log('\n✅ Build completed successfully!');
    console.log(`\nOutput files:`);
    console.log(`  - ${JS_OUTPUT}`);
    console.log(`  - ${CSS_OUTPUT}`);
    console.log(`\nYou can now use the bundled files in your HTML.`);
} catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
}