#!/usr/bin/env node

/**
 * Add V2InteractiveFeatures to the bundle
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the interactive features module
const interactiveFeaturesPath = path.join(__dirname, 'src/V2InteractiveFeatures.js');
const interactiveFeaturesCode = fs.readFileSync(interactiveFeaturesPath, 'utf8');

// Read the current bundle
const bundlePath = path.join(__dirname, 'dist/mermaid-editor-v2.bundle.js');
let bundleCode = fs.readFileSync(bundlePath, 'utf8');

// Find where to insert the interactive features
const insertPoint = 'window.MermaidEditorV2 = {';
const insertIndex = bundleCode.indexOf(insertPoint);

if (insertIndex === -1) {
    console.error('Could not find insertion point in bundle');
    process.exit(1);
}

// Find the end of the exports object
const exportsStart = insertIndex + insertPoint.length;
const exportsEnd = bundleCode.indexOf('};', exportsStart) + 1;

// Extract current exports
const currentExports = bundleCode.substring(exportsStart, exportsEnd - 1);

// Add V2InteractiveFeatures to exports if not already there
if (!currentExports.includes('V2InteractiveFeatures')) {
    // Insert the class before the exports
    const classInsertPoint = insertIndex;
    
    // Prepare the interactive features code
    const wrappedFeatures = `
// V2 Interactive Features
${interactiveFeaturesCode}

`;
    
    // Insert the class
    bundleCode = bundleCode.substring(0, classInsertPoint) + 
                 wrappedFeatures + 
                 bundleCode.substring(classInsertPoint);
    
    // Update the exports
    const newExports = currentExports.trimEnd() + ',\n    V2InteractiveFeatures';
    
    // Find the new position after inserting the class
    const newInsertIndex = bundleCode.indexOf(insertPoint);
    const newExportsStart = newInsertIndex + insertPoint.length;
    const newExportsEnd = bundleCode.indexOf('};', newExportsStart);
    
    bundleCode = bundleCode.substring(0, newExportsStart) + 
                 newExports + 
                 bundleCode.substring(newExportsEnd);
    
    // Write the updated bundle
    fs.writeFileSync(bundlePath, bundleCode);
    
    console.log('✅ Added V2InteractiveFeatures to bundle');
} else {
    console.log('ℹ️  V2InteractiveFeatures already in bundle');
}