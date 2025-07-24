# 🏛️ Mermaid Editor Architecture

## System Overview

```mermaid
graph TB
    subgraph "Browser"
        HTML[editor-modular.html]
        CSS[CSS Modules]
        BUNDLES[JS Bundles]
    end
    
    subgraph "Source Files"
        CORE[Core Modules]
        COMP[Component Modules]
        CONFIG[Configurations]
    end
    
    subgraph "Build Process"
        BUILD[Build Scripts]
    end
    
    CORE -->|Build| BUILD
    COMP -->|Build| BUILD
    CONFIG -->|Build| BUILD
    BUILD -->|Generate| BUNDLES
    BUNDLES -->|Load| HTML
    CSS -->|Import| HTML
```

## Module Dependencies

```mermaid
graph LR
    subgraph "Core Layer"
        EC[editorCore.js]
        MS[modalSystem.js]
        SM[stateManager.js]
    end
    
    subgraph "Component Layer"
        NM[nodeManager.js]
        CM[connectionManager.js]
    end
    
    subgraph "Config Layer"
        MC[modalConfigs.js]
    end
    
    EC --> SM
    EC --> MS
    EC --> NM
    EC --> CM
    MS --> MC
    NM --> SM
    CM --> SM
```

## Event Flow

```mermaid
sequenceDiagram
    participant User
    participant DOM
    participant EditorCore
    participant NodeManager
    participant StateManager
    participant ModalSystem
    
    User->>DOM: Right-click node
    DOM->>EditorCore: contextmenu event
    EditorCore->>EditorCore: handleNodeContextMenu()
    EditorCore->>ModalSystem: open('nodeContext')
    ModalSystem->>DOM: Display modal
    User->>ModalSystem: Click action
    ModalSystem->>EditorCore: modal:action event
    EditorCore->>NodeManager: updateNode()
    NodeManager->>StateManager: Update state
    StateManager->>DOM: Trigger re-render
```

## Bundle Architecture

```mermaid
graph TD
    subgraph "editorCore.bundle.js"
        SM_B[StateManager]
        NM_B[NodeManager]
        CM_B[ConnectionManager]
        EC_B[EditorCore]
    end
    
    subgraph "modalSystem.bundle.js"
        MS_B[ModalSystem]
        MC_B[Modal Configs]
    end
    
    subgraph "Window Globals"
        WEC[window.editorCore]
        WMS[window.modalSystem]
        WEM[window.editorManagers]
    end
    
    EC_B --> WEC
    MS_B --> WMS
    SM_B --> WEM
    NM_B --> WEM
    CM_B --> WEM
```

## File System Structure

```
mermaid-editor/
│
├── 📄 index.html                    # ES6 module entry (experimental)
├── 📄 EDITING_MANUAL.md            # Comprehensive editing guide
├── 📄 QUICK_REFERENCE.md           # Quick reference card
├── 📄 ARCHITECTURE.md              # This file
│
├── 📄 mermaid_editor.html          ✅ MAIN VERSION (modular architecture)
│
├── 📁 views/                       # HTML versions (archives)
│   ├── 📄 editor-modular.html      📋 Original modular version
│   ├── 📄 editor-interactive.html  ❌ Legacy monolithic (DO NOT EDIT)
│   └── 📄 [other versions]         ⚠️  Various experiments
│
├── 📁 js/                          # JavaScript modules
│   ├── 📁 core/                    # Core systems
│   │   ├── 📄 editorCore.js        # Main coordinator
│   │   ├── 📄 stateManager.js      # State management
│   │   └── 📄 modalSystem.js       # Modal/popup system
│   │
│   ├── 📁 components/              # Feature managers
│   │   ├── 📄 nodeManager.js       # Node operations
│   │   └── 📄 connectionManager.js # Connection operations
│   │
│   ├── 📁 config/                  # Configuration
│   │   └── 📄 modalConfigs.js      # All modal definitions
│   │
│   ├── 📁 build/                   # Build scripts
│   │   └── 📄 buildEditorCore.js   # Bundle builder
│   │
│   └── 📁 bundles/                 # Generated (DO NOT EDIT)
│       └── 📄 editorCore.bundle.js
│
└── 📁 css/                         # Stylesheets
    ├── 📄 main.css                 # Main importer
    ├── 📁 base/                    # Foundation
    ├── 📁 components/              # Component styles
    └── 📁 layout/                  # Layout styles
```

## Key Design Patterns

### 1. Manager Pattern
Each manager handles a specific domain:
- `NodeManager`: All node-related operations
- `ConnectionManager`: All connection-related operations
- `StateManager`: Application state and history

### 2. Event-Driven Architecture
Components communicate through custom events:
```javascript
// Emitting
document.dispatchEvent(new CustomEvent('node:nodeClick', { 
    detail: { node, event } 
}));

// Listening
document.addEventListener('node:nodeClick', handler);
```

### 3. Bundle Strategy
ES6 modules are bundled into IIFE for browser compatibility:
```javascript
// Source (ES6)
export class NodeManager { }

// Bundle (IIFE)
(function(window) {
    class NodeManager { }
    window.NodeManager = NodeManager;
})(window);
```

### 4. Adapter Pattern
Legacy code is adapted to new architecture:
```javascript
// Legacy function mapped to new API
window.createNode = (...args) => window.editorCore.nodeManager.createNode(...args);
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> Empty
    Empty --> HasNodes: Create Node
    HasNodes --> HasConnections: Create Connection
    HasConnections --> Selected: Select Item
    Selected --> Editing: Open Modal
    Editing --> HasConnections: Save Changes
    Selected --> HasConnections: Delete Item
    HasConnections --> HasNodes: Delete All Connections
    HasNodes --> Empty: Delete All Nodes
```

## Modal System Flow

```mermaid
graph TD
    A[User Action] --> B{Modal Type?}
    B -->|Context Menu| C[Position at Cursor]
    B -->|Panel| D[Center on Screen]
    C --> E[Render Modal]
    D --> E
    E --> F[User Interaction]
    F --> G{Action Type?}
    G -->|Save| H[Update State]
    G -->|Cancel| I[Close Modal]
    H --> J[Emit Event]
    J --> K[Update UI]
    K --> I
```

## Build Process Detail

```mermaid
graph LR
    A[Source Files<br/>ES6 Modules] --> B[buildEditorCore.js]
    B --> C{Process}
    C -->|1| D[Read Files]
    C -->|2| E[Remove Imports]
    C -->|3| F[Wrap in IIFE]
    C -->|4| G[Expose Globals]
    G --> H[Bundle File<br/>editorCore.bundle.js]
    H --> I[Browser<br/>Loads Bundle]
```

## Critical Understanding Points

1. **Two-Stage Loading**: Source → Bundle → Browser
2. **Global Exposure**: Bundles expose APIs via `window` object
3. **Event Bus**: Custom events enable loose coupling
4. **Single Source of Truth**: Modal configs, state, etc.
5. **Rebuild Required**: JS changes need bundle rebuild

## Common Workflows

### Adding a Feature
1. Identify appropriate manager/module
2. Add feature to source file
3. Rebuild bundle
4. Test in browser

### Fixing a Bug
1. Debug in browser console
2. Trace to source file
3. Fix in source
4. Rebuild and test

### Styling Changes
1. Edit CSS file directly
2. No rebuild needed
3. Refresh browser

---

This architecture enables:
- ✅ Maintainable codebase
- ✅ Clear separation of concerns
- ✅ Easy debugging
- ✅ Extensibility
- ✅ Browser compatibility