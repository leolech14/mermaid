# 🚀 Mermaid Editor - Quick Reference Card

## 🔥 Most Common Tasks

### Fix a Bug in Node Behavior
```bash
1. Edit: js/components/nodeManager.js
2. Run: node js/build/buildEditorCore.js
3. Test: Open mermaid_editor.html + hard refresh
```

### Add/Edit a Modal or Context Menu
```bash
1. Edit: js/config/modalConfigs.js
2. Run: ./rebuild-modal-bundle.sh
3. Test: Open mermaid_editor.html + hard refresh
```

### Change Styles
```bash
1. Edit: css/components/[appropriate].css
2. No rebuild needed!
3. Test: Refresh browser
```

### Fix Event Handling
```bash
1. Edit: js/core/editorCore.js
2. Run: node js/build/buildEditorCore.js
3. Test: Check browser console + test interaction
```

## 🗺️ Where is What?

| Feature | File |
|---------|------|
| Node dragging | `js/core/editorCore.js` → `startNodeDrag()` |
| Context menus | `js/core/editorCore.js` → `handle*ContextMenu()` |
| Node creation | `js/components/nodeManager.js` → `createNode()` |
| Connection paths | `js/components/connectionManager.js` → `updateConnectionPath()` |
| Modal definitions | `js/config/modalConfigs.js` |
| State/undo/redo | `js/core/stateManager.js` |
| Colors/spacing | `css/base/variables.css` |

## 🛠️ Debug Commands

```javascript
// In browser console:

// Check if modules loaded
window.editorCore
window.modalSystem
window.editorManagers

// See all registered modals
Array.from(window.modalSystem.modals.keys())

// Get current state
window.editorManagers.stateManager.state

// Force open a modal
window.modalSystem.open('nodeEdit', {node: {id: 'test'}})
```

## ⚠️ Critical Rules

1. **NEVER** edit `.bundle.js` files
2. **ALWAYS** rebuild bundles after JS changes
3. **ALWAYS** hard refresh browser after bundle rebuild
4. **ONLY** edit `mermaid_editor.html`, not `editor-interactive.html`
5. **CHECK** `window.modalSystem` exists before using modals

## 🏃 Emergency Fixes

### "Nothing works!"
```bash
# Rebuild everything
node js/build/buildEditorCore.js
./rebuild-modal-bundle.sh
# Hard refresh browser (Ctrl+Shift+R)
```

### "Modal won't open"
```javascript
// Check in console:
window.modalSystem
window.modalConfigs
// If undefined, rebuild modal bundle
```

### "Changes not showing"
1. Did you edit the source file (not bundle)?
2. Did you rebuild the bundle?
3. Did you hard refresh?
4. Check browser console for errors

## 📁 File to Bundle Mapping

| Source File | Bundle | Rebuild Command |
|-------------|--------|-----------------|
| `js/core/editorCore.js` | `editorCore.bundle.js` | `node js/build/buildEditorCore.js` |
| `js/core/stateManager.js` | `editorCore.bundle.js` | `node js/build/buildEditorCore.js` |
| `js/components/*.js` | `editorCore.bundle.js` | `node js/build/buildEditorCore.js` |
| `js/core/modalSystem.js` | `modalSystem.bundle.js` | `./rebuild-modal-bundle.sh` |
| `js/config/modalConfigs.js` | `modalSystem.bundle.js` | `./rebuild-modal-bundle.sh` |

---
**Golden Rule**: Edit Source → Build Bundle → Hard Refresh → Test