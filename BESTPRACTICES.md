# Best Practices Guide for Mermaid Editor Development

This guide ensures consistent, maintainable, and error-free development when editing features and UI components. **All agents and developers MUST follow these practices.**

## 🔴 Critical Rules (MUST FOLLOW)

### 1. **NEVER Rewrite Entire Files**
```bash
# ❌ WRONG - Never do this for minor changes
Write entire 3000+ line HTML file for adding one button

# ✅ CORRECT - Use precise edits
Edit specific lines or sections only
```

### 2. **Always Use Edit Tool for Existing Files**
- Read file first with `Read` tool
- Use `Edit` or `MultiEdit` for changes
- Preserve exact formatting and indentation
- Never use `Write` tool on existing files unless replacing entire content

### 3. **Maintain Edit and Todo Logs**
Every change requires updating:
- `edit_log.md` - Document what changed and why
- `todo_list.md` - Track pending tasks

## 📋 Project Organization

### Component Identification System

#### Purpose Tags (Required)
Every component must have matching purpose tags:

```html
<!-- Frontend: HTML -->
<div data-purpose="diagram-toolbar" id="toolbar">
  <button data-purpose="export-png-btn">Export PNG</button>
</div>

<!-- Backend: JavaScript -->
// @purpose: diagram-toolbar
class DiagramToolbar {
  constructor() {
    // @purpose: export-png-btn handler
    this.exportPngBtn = document.querySelector('[data-purpose="export-png-btn"]');
  }
}
```

#### CSS Classes Follow Purpose
```css
/* @purpose: diagram-toolbar styles */
.diagram-toolbar {
  /* styles */
}

/* @purpose: export-png-btn styles */
.export-png-btn {
  /* styles */
}
```

### File Naming Conventions
```
feature-name.js          # JavaScript module
feature-name.css         # Corresponding styles
feature-name.test.js     # Tests (if applicable)
```

## 🛠️ Development Workflow

### Before Making Changes

1. **Understand Current State**
   ```bash
   # Read relevant files
   Read main HTML file
   Read related JS/CSS files
   Check edit_log.md for recent changes
   ```

2. **Plan Changes**
   ```bash
   # Update todo_list.md FIRST
   - [ ] Add export PDF button to toolbar
   - [ ] Implement PDF export logic
   - [ ] Add CSS styling for button
   - [ ] Test PDF export functionality
   ```

3. **Identify Impact**
   - What files need editing?
   - What components are affected?
   - Any dependencies to consider?

### Making Changes

#### Adding New Features

1. **Create Purpose-Tagged Structure**
   ```html
   <!-- In HTML -->
   <div data-purpose="new-feature-container">
     <button data-purpose="new-feature-action">Action</button>
   </div>
   ```

2. **Add Corresponding JavaScript**
   ```javascript
   // @purpose: new-feature-container
   class NewFeature {
     constructor() {
       this.container = document.querySelector('[data-purpose="new-feature-container"]');
       this.actionBtn = document.querySelector('[data-purpose="new-feature-action"]');
     }
   }
   ```

3. **Style with Matching Classes**
   ```css
   /* @purpose: new-feature-container styles */
   .new-feature-container { }
   .new-feature-action { }
   ```

#### Modifying Existing Features

1. **Locate by Purpose Tag**
   ```bash
   # Search for purpose tag
   Grep "data-purpose=\"feature-name\""
   Grep "@purpose: feature-name"
   ```

2. **Edit Precisely**
   ```javascript
   // Use Edit tool with exact strings
   Edit file.js
   old_string: "this.timeout = 1000;"
   new_string: "this.timeout = 2000;"
   ```

3. **Update Related Components**
   - If changing HTML structure, update JS selectors
   - If changing JS behavior, verify HTML still works
   - If changing CSS, test visual appearance

### After Making Changes

1. **Update edit_log.md**
   ```markdown
   ## 2024-01-24 - Added PDF Export
   - **Files Modified**: 
     - mermaid.html (lines 250-260): Added PDF export button
     - js/exportManager.js (lines 45-80): Added PDF logic
     - css/toolbar.css (lines 120-130): Styled PDF button
   - **Purpose**: Enable PDF export functionality
   - **Tags Added**: data-purpose="export-pdf-btn"
   ```

2. **Update todo_list.md**
   ```markdown
   - [x] Add export PDF button to toolbar
   - [x] Implement PDF export logic
   - [x] Add CSS styling for button
   - [ ] Test PDF export functionality
   ```

3. **Clean Up Orphan Files**
   ```bash
   # Check for unused files after refactoring
   - Remove old implementations
   - Delete temporary files
   - Update imports/includes
   ```

## 🎯 Component Best Practices

### HTML Structure

1. **Semantic Elements**
   ```html
   <!-- ✅ GOOD -->
   <nav data-purpose="main-navigation">
   <main data-purpose="editor-container">
   <aside data-purpose="preview-panel">
   
   <!-- ❌ BAD -->
   <div id="nav">
   <div class="main">
   ```

2. **Accessible Markup**
   ```html
   <button data-purpose="save-btn" 
           aria-label="Save diagram"
           title="Save diagram (Ctrl+S)">
     Save
   </button>
   ```

### JavaScript Patterns

1. **Module Structure**
   ```javascript
   // @purpose: feature-name module
   export class FeatureName {
     constructor(options = {}) {
       this.options = options;
       this.init();
     }
     
     init() {
       this.cacheElements();
       this.bindEvents();
     }
     
     cacheElements() {
       // @purpose: cache DOM references
       this.elements = {
         container: document.querySelector('[data-purpose="feature-container"]'),
         button: document.querySelector('[data-purpose="feature-button"]')
       };
     }
     
     bindEvents() {
       // @purpose: bind event handlers
       this.elements.button?.addEventListener('click', this.handleClick.bind(this));
     }
   }
   ```

2. **Error Handling**
   ```javascript
   try {
     // Feature logic
   } catch (error) {
     console.error(`[FeatureName] Error: ${error.message}`);
     // Graceful fallback
   }
   ```

### CSS Organization

1. **Component Scoping**
   ```css
   /* @purpose: feature-name component styles */
   .feature-name {
     /* Base styles */
   }
   
   .feature-name__element {
     /* Element styles (BEM) */
   }
   
   .feature-name--modifier {
     /* Modifier styles */
   }
   ```

2. **Responsive Design**
   ```css
   /* Mobile-first approach */
   .feature { }
   
   @media (min-width: 768px) {
     .feature { }
   }
   ```

## 🔍 Debugging & Testing

### Before Committing

1. **Verify No Broken References**
   ```bash
   # Check all purpose tags are matched
   # Ensure no orphaned event listeners
   # Validate all imports/includes work
   ```

2. **Test Cross-Browser**
   - Chrome/Edge
   - Firefox
   - Safari
   - Mobile browsers

3. **Check Console**
   - No errors
   - No warnings
   - No missing resources

### Common Pitfalls to Avoid

1. **❌ Don't hardcode IDs everywhere**
   ```javascript
   // Bad
   document.getElementById('btn-1');
   document.getElementById('btn-2');
   
   // Good
   document.querySelectorAll('[data-purpose^="action-btn"]');
   ```

2. **❌ Don't mix concerns**
   ```javascript
   // Bad - Styling in JS
   element.style.backgroundColor = 'red';
   
   // Good - Use CSS classes
   element.classList.add('error-state');
   ```

3. **❌ Don't forget cleanup**
   ```javascript
   // Always remove listeners when destroying
   destroy() {
     this.elements.button?.removeEventListener('click', this.handleClick);
   }
   ```

## 📝 Documentation Requirements

### Inline Documentation

```javascript
/**
 * @purpose: Export diagram as PDF
 * @param {Object} options - Export options
 * @param {string} options.filename - Output filename
 * @param {string} options.format - Paper format (A4, Letter)
 * @returns {Promise<Blob>} PDF blob
 */
async function exportPDF(options = {}) {
  // Implementation
}
```

### Update Feature Documentation

When adding/modifying features, update:
1. `FEATURES.md` - Add to feature list
2. `edit_log.md` - Document changes
3. `todo_list.md` - Update task status
4. Inline comments - Explain complex logic

## 🚀 Performance Guidelines

1. **Debounce Expensive Operations**
   ```javascript
   // @purpose: debounced diagram update
   const updateDiagram = debounce(() => {
     renderDiagram();
   }, 300);
   ```

2. **Lazy Load When Possible**
   ```javascript
   // @purpose: lazy load heavy dependencies
   async function loadPDFLibrary() {
     const { jsPDF } = await import('./jspdf.min.js');
     return jsPDF;
   }
   ```

3. **Cache DOM Queries**
   ```javascript
   // Cache at initialization, not in loops
   this.elements = {
     toolbar: document.querySelector('[data-purpose="toolbar"]'),
     buttons: document.querySelectorAll('[data-purpose^="btn-"]')
   };
   ```

## ⚠️ Project-Specific Rules

### For Mermaid Editor

1. **Mermaid.js Integration**
   - Always use mermaid.initialize() for config
   - Handle mermaid.parse() errors gracefully
   - Clear previous diagrams before rendering

2. **CodeMirror Integration**
   - Use CodeMirror transactions for updates
   - Preserve cursor position on external updates
   - Sync with diagram updates properly

3. **Theme Handling**
   - Themes affect both editor and diagram
   - Store theme preference in localStorage
   - Apply theme before render to avoid flash

### File-Specific Guidelines

#### mermaid.html
- Main entry point - be extra careful
- All features should be modular
- Keep inline scripts minimal

#### minimal-editor.html
- Lightweight version - no heavy dependencies
- Core functionality only
- Should work offline

## 🔄 Version Control

### Commit Messages
```bash
# Format: type(scope): description

feat(export): add PDF export functionality
fix(toolbar): correct button alignment
docs(features): update PDF export documentation
refactor(modal): extract modal system to module
```

### Branch Strategy
```bash
feature/pdf-export     # New features
fix/toolbar-alignment  # Bug fixes
refactor/modal-system  # Code improvements
```

---

## Summary Checklist

Before submitting changes:
- [ ] Used Edit tool for file modifications
- [ ] Added purpose tags to new components
- [ ] Updated edit_log.md with changes
- [ ] Updated todo_list.md with progress
- [ ] Removed any orphan files
- [ ] Tested in multiple browsers
- [ ] No console errors or warnings
- [ ] Followed naming conventions
- [ ] Added inline documentation
- [ ] Updated relevant .md files

**Remember: Precision and documentation are key to maintainable code!**