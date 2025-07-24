# 📘 Mermaid Editor - AI Agent Editing Manual

## 🎯 Purpose
This manual provides essential guidance for AI agents or developers working on the Mermaid Editor codebase. It explains the architecture, workflow, and critical patterns to follow when making changes.

## 🏗️ Architecture Overview

### Two Parallel Versions
1. **Monolithic Version** (`views/editor-interactive.html`)
   - Single 3,600+ line file with all functionality inline
   - ⚠️ DO NOT EDIT - Legacy version kept for reference only

2. **Modular Version** (`mermaid_editor.html`) 
   - Modern architecture with separated concerns
   - ✅ THIS IS THE VERSION TO EDIT
   - Previously located at `views/editor-modular.html`

### Critical Understanding: The Bundle System

```
Source Files (ES6) → Build Script → Bundle (IIFE) → HTML loads Bundle
```

**⚠️ CRITICAL**: Changes to source files DO NOT take effect until bundles are rebuilt!

## 🔧 How to Make Changes

### Step 1: Identify What to Edit

| Feature Type | Edit Location | Bundle to Rebuild |
|-------------|---------------|-------------------|
| Node behavior | `js/components/nodeManager.js` | editorCore.bundle.js |
| Connection behavior | `js/components/connectionManager.js` | editorCore.bundle.js |
| Editor interactions | `js/core/editorCore.js` | editorCore.bundle.js |
| State management | `js/core/stateManager.js` | editorCore.bundle.js |
| Modal/popup UI | `js/config/modalConfigs.js` | modalSystem.bundle.js |
| Modal behavior | `js/core/modalSystem.js` | modalSystem.bundle.js |
| Styles | `css/components/*.css` | No rebuild needed |

### Step 2: Make Your Changes

1. **ALWAYS read the file first** using the Read tool
2. **Edit source files**, never bundles
3. **Follow existing patterns** in the code
4. **Use MultiEdit** for multiple changes to same file

### Step 3: Rebuild the Bundle

After editing JavaScript source files:

```bash
# For editor core changes:
node js/build/buildEditorCore.js

# For modal system changes:
./rebuild-modal-bundle.sh
```

### Step 4: Test Your Changes

1. Open `views/editor-modular.html` in browser
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to clear cache
3. Test the specific functionality you changed

## 📁 File Structure Guide

### JavaScript Architecture

```
js/
├── core/               # Core systems
│   ├── editorCore.js   # Main coordinator, event handling
│   ├── modalSystem.js  # Modal/popup manager
│   └── stateManager.js # State and history management
│
├── components/         # Feature managers
│   ├── nodeManager.js      # Node creation, updates, deletion
│   └── connectionManager.js # Connection handling
│
├── config/            # Configuration
│   └── modalConfigs.js # ALL modal definitions (single source of truth)
│
├── bundles/           # Generated files (DO NOT EDIT)
│   └── editorCore.bundle.js
│
└── modalSystem.bundle.js # Generated file (DO NOT EDIT)
```

### CSS Architecture

```
css/
├── main.css           # Imports all other CSS (entry point)
├── base/              # Foundation
│   ├── reset.css      # Browser reset
│   └── variables.css  # CSS variables (colors, spacing, etc.)
├── components/        # Component styles
│   ├── nodes.css      # Node styling
│   ├── connections.css # Connection styling
│   ├── editor.css     # Editor canvas styling
│   └── buttons.css    # Button styling
└── layout/            # Layout styles
    ├── app-layout.css # Overall layout
    └── toolbar.css    # Toolbar styling
```

## 🚨 Common Pitfalls and Solutions

### 1. "My changes aren't showing!"
**Cause**: Forgot to rebuild bundles
**Solution**: Run the build script for the bundle you edited

### 2. "Context menus not appearing"
**Cause**: Modal system not loaded or event handlers not connected
**Solution**: 
- Check `window.modalSystem` exists
- Ensure modal is registered in `modalConfigs.js`
- Verify event handler calls `window.modalSystem.open()`

### 3. "Drag and drop not working"
**Cause**: Event handlers not properly attached
**Solution**: Check `setupDragDropHandlers()` in `editorCore.js`

### 4. "Can't find where X is defined"
**Solution**: Use this search order:
1. Check the specific manager (node/connection)
2. Check editorCore.js for coordination
3. Check modalConfigs.js for UI definitions
4. Check legacy adapter for mapped functions

## 🎨 Adding New Features

### Adding a New Node Type

1. Edit `js/components/nodeManager.js`:
   ```javascript
   createNode(config) {
     // Add your node type handling here
   }
   ```

2. Edit `js/core/editorCore.js`:
   ```javascript
   getNodeTypeConfig(type) {
     // Add your type configuration
   }
   ```

3. Rebuild: `node js/build/buildEditorCore.js`

### Adding a New Modal/Popup

1. Edit `js/config/modalConfigs.js`:
   ```javascript
   export const modalConfigs = {
     yourNewModal: {
       type: 'panel', // or 'contextMenu'
       title: 'Your Modal',
       // ... configuration
     }
   };
   ```

2. Rebuild: `./rebuild-modal-bundle.sh`

3. Open modal from code:
   ```javascript
   window.modalSystem.open('yourNewModal', { /* data */ });
   ```

### Adding New Styles

1. Edit appropriate CSS file in `css/components/`
2. No rebuild needed - CSS loads directly
3. Use CSS variables from `css/base/variables.css`

## 🔍 Debugging Tips

### Enable Debug Mode

Add to browser console:
```javascript
// Log all modal operations
window.DEBUG_MODAL = true;

// Log all state changes
window.DEBUG_STATE = true;

// Log all events
window.DEBUG_EVENTS = true;
```

### Check Module Loading

```javascript
// Verify managers are loaded
console.log('Editor Core:', window.editorCore);
console.log('Modal System:', window.modalSystem);
console.log('Managers:', window.editorManagers);
```

## 📋 Checklist for Every Edit

- [ ] Identified correct source file to edit
- [ ] Read the file before editing
- [ ] Made changes following existing patterns
- [ ] Rebuilt appropriate bundle if editing JS
- [ ] Tested in browser with hard refresh
- [ ] Checked browser console for errors
- [ ] Verified feature works as expected

## 🏭 Build System Details

### editorCore Bundle Build Process

The `buildEditorCore.js` script:
1. Reads all component source files
2. Removes ES6 import/export statements
3. Wraps in IIFE (Immediately Invoked Function Expression)
4. Exposes globals: `window.editorCore`, `window.editorManagers`
5. Writes to `js/bundles/editorCore.bundle.js`

### Modal System Bundle

Built by `rebuild-modal-bundle.sh`:
1. Combines modalSystem.js and modalConfigs.js
2. Creates non-module version
3. Exposes `window.modalSystem` and `window.modalConfigs`

## 🎯 Best Practices

1. **Never edit bundle files** - They're regenerated
2. **One responsibility per file** - Don't mix concerns
3. **Use event system** - Components communicate via events
4. **Check window objects** - Ensure globals are available
5. **Follow naming patterns** - Consistency is key
6. **Test incrementally** - Verify each change works

## 🚀 Quick Start for New Features

```bash
# 1. Edit source file
[Edit js/core/editorCore.js or appropriate file]

# 2. Rebuild bundle
node js/build/buildEditorCore.js

# 3. Test
[Open mermaid_editor.html in browser]
[Hard refresh with Ctrl+Shift+R]
[Test your feature]
```

## 📞 Getting Help

- Check inline documentation in source files
- Look for similar features already implemented
- Use browser DevTools to debug
- Check console for error messages
- Verify bundles were rebuilt after changes

---

**Remember**: The golden rule is **Edit Source → Build Bundle → Test in Browser**. Following this workflow will save hours of debugging!