# 🧪 Mermaid Editor V2 - Comprehensive Test Plan

## Test Coverage Overview

This test plan covers all features specified in MERMAID_EDITOR_V2_SPEC.md and validates the modular architecture implementation.

## 🎯 Core Features Testing

### 1. Visual Editing Features

#### 1.1 Node Creation & Manipulation
- [ ] **Right-click canvas** → Context menu appears
- [ ] **Select node type** → Node created at click position
- [ ] **Drag node** → Node moves smoothly (60fps)
- [ ] **Resize node** → Handles appear on selection
- [ ] **Double-click node** → Edit label inline
- [ ] **Delete key** → Selected nodes removed

**Expected Results:**
- Nodes snap to grid (20px)
- Visual feedback on hover
- Smooth animations < 300ms

#### 1.2 Connection Creation (Left-click/Right-click)
- [ ] **Select connection tool (C)**
- [ ] **Left-click node 1** → Connection starts
- [ ] **See preview line** → Curved dotted line follows cursor
- [ ] **Right-click node 2** → Connection created
- [ ] **Left-click node 2** → Alternative completion method

**Expected Results:**
- Curved Bezier paths
- Arrow markers at endpoints
- Connection highlights on hover

#### 1.3 Multi-Selection
- [ ] **Ctrl/Cmd+click nodes** → Add to selection
- [ ] **Drag selection box** → Select multiple items
- [ ] **Right-click group** → Batch edit menu
- [ ] **Drag group** → All move together
- [ ] **Delete group** → All removed

**Expected Results:**
- Selection count in status bar
- Visual selection indicators
- Maintains relative positions

### 2. Advanced Features

#### 2.1 Nested Canvas (Drag-into)
- [ ] **Select multiple nodes**
- [ ] **Drag over another node** → Target highlights
- [ ] **Drop into node** → Creates nested canvas
- [ ] **Node shows indicator** → ▼ symbol appears
- [ ] **Check state** → Nodes removed from main canvas

**Expected Results:**
- Visual feedback during drag
- Smooth transition animation
- Parent node style changes

#### 2.2 X-Ray Vision (Alt+X)
- [ ] **Press Alt+X** → X-ray mode activates
- [ ] **Top nodes fade** → Opacity 0.3
- [ ] **Nested canvases appear** → Show miniature view
- [ ] **Can interact** → Click through to nested
- [ ] **Press Alt+X again** → Mode deactivates

**Expected Results:**
- Smooth opacity transitions
- Nested content visible
- Performance remains smooth

#### 2.3 Space+Drag Panning
- [ ] **Hold Space** → Cursor changes to grab
- [ ] **Space+drag** → Canvas pans
- [ ] **Release Space** → Returns to normal
- [ ] **Use pan tool (H)** → Always pan mode

**Expected Results:**
- Smooth panning motion
- No node selection during pan
- Works with zoom levels

### 3. UI/UX Features

#### 3.1 Dark Theme & Glass Morphism
- [ ] **Check colors** → Match specification
- [ ] **Glass panels** → Backdrop blur effect
- [ ] **Hover states** → Smooth transitions
- [ ] **Focus indicators** → Clear visibility

**Expected Results:**
- Background: #0F1419
- Primary: #B794F4
- Glass blur visible

#### 3.2 Keyboard Shortcuts
- [ ] **V** → Select tool
- [ ] **N** → Node tool
- [ ] **C** → Connection tool
- [ ] **H** → Pan tool
- [ ] **1-4** → Quick tool switch
- [ ] **Ctrl+Z/Y** → Undo/Redo
- [ ] **Ctrl+C/V** → Copy/Paste
- [ ] **Ctrl+D** → Duplicate
- [ ] **Delete** → Delete selected
- [ ] **Ctrl+A** → Select all
- [ ] **Escape** → Cancel operation

#### 3.3 Context Menus
- [ ] **Canvas right-click** → Create nodes menu
- [ ] **Node right-click** → Edit/Delete menu
- [ ] **Connection right-click** → Edit menu
- [ ] **Menu positioning** → Always visible
- [ ] **Click outside** → Menu closes

### 4. State Management

#### 4.1 History (Undo/Redo)
- [ ] **Make changes** → Each recorded
- [ ] **Ctrl+Z** → Reverts last action
- [ ] **Ctrl+Y** → Redoes action
- [ ] **Check limit** → Max 50 history items

#### 4.2 Persistence
- [ ] **Make changes** → Auto-save triggers
- [ ] **Reload page** → State restored
- [ ] **Check localStorage** → Data present

### 5. Performance Testing

#### 5.1 Rendering Performance
- [ ] **Create 100 nodes** → Maintain 60fps
- [ ] **Drag all nodes** → Smooth movement
- [ ] **Zoom in/out** → No lag
- [ ] **Many connections** → Still responsive

#### 5.2 Memory Usage
- [ ] **Monitor DevTools** → Check heap size
- [ ] **Long session** → No memory leaks
- [ ] **Many operations** → Garbage collected

### 6. Architecture Validation

#### 6.1 Module Loading
- [ ] **Check console** → All modules loaded
- [ ] **No errors** → Clean initialization
- [ ] **Global reference** → window.mermaidEditorV2

#### 6.2 Event System
- [ ] **Open DevTools** → Monitor events
- [ ] **Perform actions** → Events fire correctly
- [ ] **Check namespacing** → Proper event names

#### 6.3 State Updates
- [ ] **Use DevTools** → Inspect state
- [ ] **Make changes** → Immutable updates
- [ ] **Check subscriptions** → Components update

## 🐛 Edge Cases & Error Handling

### Connection Edge Cases
- [ ] Connect node to itself → Should prevent
- [ ] Connect already connected → Should prevent duplicate
- [ ] Delete node with connections → Connections removed
- [ ] Start connection, press Escape → Cancels properly

### Selection Edge Cases
- [ ] Select all with empty canvas → No errors
- [ ] Copy with nothing selected → No errors
- [ ] Paste without copying → No action
- [ ] Delete during drag → Handled gracefully

### Nested Canvas Edge Cases
- [ ] Drag node into itself → Should prevent
- [ ] Nested canvas in nested canvas → Max depth check
- [ ] Delete parent with nested → All removed
- [ ] X-ray with no nested → No visual change

## 📱 Browser Compatibility

### Desktop Browsers
- [ ] **Chrome 90+** → Full functionality
- [ ] **Firefox 88+** → Full functionality
- [ ] **Safari 14+** → Full functionality
- [ ] **Edge 90+** → Full functionality

### Features to Check
- [ ] SVG rendering
- [ ] CSS custom properties
- [ ] Backdrop filter (glass morphism)
- [ ] Keyboard events
- [ ] Mouse events
- [ ] Local storage

## 🔧 Debugging Checklist

### Console Checks
```javascript
// Check modules loaded
console.log(window.MermaidEditorV2);

// Check state
mermaidEditorV2.state.get('diagram.nodes');

// Monitor events
mermaidEditorV2.eventBus.on('*', console.log);

// Check performance
mermaidEditorV2.performance.getMetrics();
```

### Common Issues
1. **Modules not loading** → Check bundle path
2. **Events not firing** → Check event names
3. **State not updating** → Check immutability
4. **Rendering issues** → Check canvas context
5. **Memory leaks** → Check event listeners

## 📊 Test Results Template

```markdown
## Test Run: [Date]
**Tester:** [Name]
**Browser:** [Browser/Version]
**OS:** [Operating System]

### Summary
- Total Tests: X
- Passed: X
- Failed: X
- Blocked: X

### Failed Tests
1. [Test Name] - [Reason]
2. ...

### Notes
- [Any observations]
```

## 🚀 Automated Testing

### Unit Tests (Jest)
```javascript
describe('StateManager', () => {
    test('immutable updates', () => {
        const state = new StateManager();
        const original = state.get();
        state.update('test.value', 123);
        expect(state.get()).not.toBe(original);
    });
});
```

### E2E Tests (Playwright)
```javascript
test('create connection flow', async ({ page }) => {
    await page.goto('/editor-v2-modular.html');
    await page.click('[data-tool="connection"]');
    await page.click('#node1');
    await page.click('#node2', { button: 'right' });
    await expect(page.locator('.connection')).toHaveCount(1);
});
```

## ✅ Sign-off Criteria

Before marking V2 as complete:
1. All core features pass testing
2. Performance meets targets (60fps, <200KB)
3. No critical bugs
4. Documentation complete
5. Accessibility validated
6. Browser compatibility confirmed

---

This comprehensive test plan ensures all aspects of Mermaid Editor V2 are thoroughly validated before release.