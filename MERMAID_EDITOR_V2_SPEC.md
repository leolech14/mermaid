# 🎯 Mermaid Editor V2 - Complete Specification

## 🎨 Vision
A modern, modular visual editor for Mermaid diagrams with drag-and-drop capabilities, real-time synchronization between the mermaid code and visual representations, and a clean architecture that makes modifications simple and predictable.

## 🔧 Core Features

### 1. Visual Editing
- **Drag & Drop Nodes** - Create nodes by dragging from palette
- **Direct Manipulation** - Move, resize, and rotate nodes
- **Connection Flows** - Left-click node 1 and right-click node 2
- **Multi-Selection** - Box select multiple elements
- **Batch-editing** - Option on the Context Menu for selected group
- **Context Menus** - Right-click menus for all elements
- **Property Panels** - Edit node/connection properties
- **Undo/Redo** - Full history management

### 2. Code Editing
- **Syntax Highlighting** - Mermaid syntax support
- **Live Preview** - Real-time visual updates
- **Auto-completion** - Mermaid keywords and node IDs
- **Error Detection** - Invalid syntax highlighting
- **Code Formatting** - Auto-format on save

### 3. Synchronization
- **Bidirectional Sync** - Changes in either view update the other
- **Conflict Resolution** - Smart merging of changes
- **Debounced Updates** - Performance optimization
- **Flexible Sync** - Many edits and appearences on the canva are not supported by mermaid code

### 4. Tools & Modes
- **Select Tool** - Default interaction mode
- **Node Tool** - Right-Click the background and use the context menu to create nodes
- **Connection Tool** - left-click-right-click different nodes to connect
- **Pan Tool** - Navigate large diagrams
- **Zoom Controls** - Zoom in/out/fit
- **Templates** - For different node connections architectures and layouts
- **Drag-into** - When you drag a node/nodes into another node, a canva is created inside it
- **X-ray vision** - When Alt+X is being hold the inner canvas of the nodes that have a canva inside is shown as an transition animation makes the level zero nodes become more transparent and an underlying level -1 appears below each node as a canva miniature 

### 5. Import/Export
- **File Formats**: Mermaid (.mmd), SVG, PNG, PDF
- **Clipboard**: Copy/paste diagram code
- **Templates**: Pre-built diagram templates

## 🏗️ Technical Architecture

### Clean Separation of Concerns

```
mermaid-editor-v2/
├── index.html              # Single entry point
├── src/
│   ├── core/              # Core business logic
│   │   ├── Editor.js      # Main editor class
│   │   ├── State.js       # State management
│   │   ├── History.js     # Undo/redo
│   │   └── EventBus.js    # Event system
│   │
│   ├── visual/            # Visual editor components
│   │   ├── Canvas.js      # SVG canvas manager
│   │   ├── Node.js        # Node component
│   │   ├── Connection.js  # Connection component
│   │   ├── Selection.js   # Selection manager
│   │   └── Tools.js       # Tool handlers
│   │
│   ├── code/              # Code editor components
│   │   ├── CodeEditor.js  # Monaco/CodeMirror wrapper
│   │   ├── Parser.js      # Mermaid parser
│   │   └── Formatter.js   # Code formatter
│   │
│   ├── ui/                # UI components
│   │   ├── Toolbar.js     # Top toolbar
│   │   ├── Palette.js     # Node palette
│   │   ├── Properties.js  # Property panels
│   │   ├── ContextMenu.js # Context menus
│   │   └── Modal.js       # Modal system
│   │
│   └── utils/             # Utilities
│       ├── geometry.js    # Geometric calculations
│       ├── export.js      # Export functions
│       └── shortcuts.js   # Keyboard shortcuts
│
├── styles/
│   ├── main.css          # Main styles
│   ├── themes/           # Theme files
│   └── components/       # Component styles
│
├── build/
│   └── webpack.config.js # Build configuration
│
└── dist/                 # Built files
    ├── mermaid-editor.js
    └── mermaid-editor.css
```

### Key Design Principles

1. **Single Source of Truth** - State stored in one place
2. **Event-Driven** - Components communicate via events
3. **Immutable Updates** - State changes are immutable
4. **Plugin Architecture** - Extensible design
5. **TypeScript** - Full type safety (optional)

## 🔌 Component Interactions

### Event Flow
```javascript
// User drags node
Canvas → MouseEvent → Tool → State → EventBus → All Components

// User edits code  
CodeEditor → Change → Parser → State → EventBus → Canvas
```

### State Structure
```javascript
{
  diagram: {
    nodes: Map<id, Node>,
    connections: Map<id, Connection>,
    groups: Map<id, Group>
  },
  selection: {
    nodes: Set<id>,
    connections: Set<id>
  },
  ui: {
    tool: 'select' | 'node' | 'connection' | 'pan',
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    showGrid: true,
    snapToGrid: true
  },
  history: {
    past: State[],
    future: State[]
  }
}
```

## 🎮 User Interactions

### Mouse Actions
- **Left Click** - Select objects
- **Drag canva** - Hold space and drag
- **Right Click** - Context menu
- **Double Click** - Edit properties
- **Drag** - Drag selected node or nodes
- **Scroll** - Zoom in/out
- **Middle Drag** - Pan canvas

### Keyboard Shortcuts
- `Delete` - Delete selected
- `Ctrl+Z/Y` - Undo/Redo
- `Ctrl+C/V` - Copy/Paste
- `Ctrl+A` - Select all
- `Ctrl+D` - Duplicate
- `Escape` - Cancel operation
- `1-4` - Switch tools

## 🛠️ Implementation Plan

### Phase 1: Core Foundation (2 days)
1. Set up project structure
2. Implement State management
3. Create EventBus system
4. Build basic Canvas component
5. Implement History (undo/redo)

### Phase 2: Visual Editor (3 days)
1. Node creation and rendering
2. Node manipulation (drag, resize)
3. Connection creation and routing
4. Selection system
5. Tool system

### Phase 3: UI Components (2 days)
1. Toolbar and tool selection
2. Node palette
3. Context menus
4. Property panels
5. Modal system

### Phase 4: Code Editor (2 days)
1. Integrate code editor
2. Mermaid parser
3. Bidirectional sync
4. Syntax highlighting
5. Error handling

### Phase 5: Polish & Features (2 days)
1. Import/Export
2. Keyboard shortcuts
3. Zoom/Pan controls
4. Grid and snapping
5. Performance optimization

## 📋 File Templates

### Core Editor Class
```javascript
// src/core/Editor.js
export class MermaidEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = { ...defaultOptions, ...options };
    
    this.state = new State();
    this.eventBus = new EventBus();
    this.history = new History(this.state);
    
    this.visual = new VisualEditor(this);
    this.code = new CodeEditor(this);
    this.ui = new UIManager(this);
    
    this.init();
  }
  
  init() {
    this.setupDOM();
    this.bindEvents();
    this.loadDiagram(this.options.initialDiagram);
  }
  
  // ... methods
}
```

### Component Template
```javascript
// src/visual/Node.js
export class Node {
  constructor(id, data) {
    this.id = id;
    this.data = { ...defaultNodeData, ...data };
    this.element = null;
    this.render();
  }
  
  render() {
    // Create SVG element
  }
  
  update(data) {
    // Update node data and re-render
  }
  
  destroy() {
    // Clean up
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
- State management
- Parser functionality
- Geometry calculations
- Event system

### Integration Tests
- Visual-Code sync
- Tool interactions
- Import/Export
- History management

### E2E Tests
- Complete workflows
- Multi-step operations
- Error scenarios

## 🚀 Build & Deploy

### Development
```bash
npm run dev        # Start dev server
npm run test       # Run tests
npm run lint       # Lint code
```

### Production
```bash
npm run build      # Build for production
npm run preview    # Preview production build
```

### Bundle Output
- Single JS file with all dependencies
- Single CSS file with all styles
- No external dependencies required
- Works offline

## 📊 Success Metrics

1. **Performance** - 60fps interactions
2. **Size** - < 200KB gzipped
3. **Load Time** - < 1s initial load
4. **Compatibility** - All modern browsers
5. **Accessibility** - WCAG 2.1 AA compliant

## 🔒 Non-Functional Requirements

1. **Security** - No eval(), safe SVG rendering
2. **Privacy** - No external requests
3. **Offline** - Fully functional offline
4. **Responsive** - Mobile-friendly
5. **Extensible** - Plugin system ready

---

This specification provides a complete blueprint for building Mermaid Editor V2 with a clean, maintainable architecture that enables precise edits and predictable behavior.
