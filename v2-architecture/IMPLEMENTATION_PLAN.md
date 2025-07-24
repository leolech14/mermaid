# 🏗️ Mermaid Editor V2 - Implementation Plan

## 📋 Overview
This document outlines how to implement the new features and architecture for Mermaid Editor V2, incorporating nested canvases, X-ray vision, and the modern dark theme.

## 🎯 Core Architecture

### 1. State Management Structure
```javascript
// Enhanced state structure for nested canvases
{
  diagram: {
    nodes: Map<id, {
      id: string,
      type: string,
      label: string,
      position: { x, y },
      size: { width, height },
      style: {},
      level: number,
      canvas: CanvasReference,
      innerCanvas?: NestedCanvas, // NEW
      data: {}
    }>,
    connections: Map<id, {
      id: string,
      from: nodeId,
      to: nodeId,
      type: string,
      label: string,
      path: SVGPath,
      canvas: CanvasReference
    }>,
    canvases: Map<id, NestedCanvas> // NEW
  },
  ui: {
    currentTool: 'select',
    xrayActive: false,
    selectedCanvas: CanvasId,
    visibleLevels: number
  }
}
```

### 2. Module Integration

```javascript
// Main Editor class integrating all features
class MermaidEditor {
  constructor(container, options) {
    // Core modules
    this.state = new StateManager();
    this.eventBus = new EventBus();
    this.history = new HistoryManager(this.state);
    
    // Canvas management
    this.mainCanvas = new Canvas(container, this);
    this.canvasManager = new CanvasManager(this);
    
    // Feature modules
    this.nestedCanvas = new NestedCanvas(this);
    this.xrayVision = new XRayVision(this);
    this.connectionFlow = new ConnectionFlow(this);
    
    // UI components
    this.toolbar = new Toolbar(this);
    this.contextMenu = new ContextMenuSystem(this);
    this.propertyPanel = new PropertyPanel(this);
    
    this.init();
  }
}
```

## 🔧 Feature Implementation Details

### 1. Nested Canvas Implementation

#### Drag-Into Detection
```javascript
// In NodeManager
handleNodeDrop(draggedNodes, targetNode) {
  // Check if target node can accept inner canvas
  if (this.canAcceptCanvas(targetNode)) {
    // Create or get inner canvas
    if (!targetNode.innerCanvas) {
      targetNode.innerCanvas = new NestedCanvas(targetNode, this.editor);
    }
    
    // Transfer nodes
    targetNode.innerCanvas.handleDragInto(draggedNodes);
  }
}

canAcceptCanvas(node) {
  // Business logic for which nodes can have inner canvases
  return node.type !== 'connection-point' && 
         node.size.width > 100 && 
         node.size.height > 100;
}
```

#### Recursive Rendering
```javascript
// In Canvas renderer
renderNode(node, parentOpacity = 1.0) {
  // Render the node itself
  const nodeOpacity = this.calculateNodeOpacity(node, parentOpacity);
  node.render(nodeOpacity);
  
  // Render inner canvas if exists and visible
  if (node.innerCanvas && this.shouldRenderInnerCanvas(node)) {
    node.innerCanvas.render(nodeOpacity);
  }
}
```

### 2. X-Ray Vision Implementation

#### Level-based Opacity
```javascript
// Opacity calculation for X-ray mode
calculateXRayOpacity(level, maxLevel) {
  const baseLevelOpacities = [1.0, 0.3, 0.15, 0.05];
  
  if (level < baseLevelOpacities.length) {
    return baseLevelOpacities[level];
  }
  
  // For deeper levels, use exponential decay
  return Math.max(0.02, Math.pow(0.5, level));
}
```

#### Animation Sequencing
```javascript
// Staggered reveal animation
revealLevels() {
  const levels = this.groupNodesByLevel();
  
  levels.forEach((nodes, level) => {
    setTimeout(() => {
      this.animateLevel(nodes, level);
      this.showLevelIndicator(level);
    }, level * 100); // 100ms stagger
  });
}
```

### 3. Connection Flow Implementation

#### State Machine for Connection Creation
```javascript
// Connection creation states
const ConnectionStates = {
  IDLE: 'idle',
  SOURCE_SELECTED: 'source_selected',
  CREATING: 'creating',
  VALIDATING: 'validating',
  COMPLETED: 'completed'
};

// State transitions
handleNodeClick(node, event) {
  switch(this.connectionState) {
    case ConnectionStates.IDLE:
      if (event.button === 0) { // Left click
        this.selectSource(node);
      }
      break;
      
    case ConnectionStates.SOURCE_SELECTED:
      if (event.button === 2) { // Right click
        this.createConnection(this.sourceNode, node);
      } else if (event.button === 0) {
        this.selectSource(node); // New source
      }
      break;
  }
}
```

## 🎨 UI/UX Implementation

### 1. Glass Morphism Effects

```javascript
// Dynamic glass panel creation
createGlassPanel(content, options = {}) {
  const panel = document.createElement('div');
  panel.className = 'glass-panel';
  
  // Apply dynamic blur based on background
  const backgroundLuminance = this.getBackgroundLuminance();
  panel.style.backdropFilter = `blur(${10 + backgroundLuminance * 5}px) saturate(180%)`;
  
  // Add inner glow for depth
  panel.innerHTML = `
    <div class="glass-inner-glow"></div>
    <div class="glass-content">${content}</div>
  `;
  
  return panel;
}
```

### 2. Responsive Animations

```javascript
// Performance-aware animations
class AnimationManager {
  constructor() {
    this.frameRate = 60;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  animate(element, properties, duration) {
    if (this.reducedMotion) {
      // Instant transitions for accessibility
      Object.assign(element.style, properties);
      return Promise.resolve();
    }
    
    // Use Web Animations API for better performance
    return element.animate(properties, {
      duration: duration,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    }).finished;
  }
}
```

### 3. Dark Theme Contrast Management

```javascript
// Automatic contrast adjustment
class ContrastManager {
  getAccessibleColor(background, targetRatio = 4.5) {
    const bgLuminance = this.getLuminance(background);
    
    // Calculate whether to use light or dark text
    const lightContrast = this.getContrastRatio(bgLuminance, 0.95); // Nearly white
    const darkContrast = this.getContrastRatio(bgLuminance, 0.05);  // Nearly black
    
    if (lightContrast >= targetRatio) {
      return '#F7FAFC'; // Light text
    } else if (darkContrast >= targetRatio) {
      return '#1A202C'; // Dark text
    }
    
    // If neither works, adjust the background
    return this.adjustForContrast(background, targetRatio);
  }
}
```

## 🚀 Build Configuration

### Webpack Configuration
```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'mermaid-editor.js',
    library: 'MermaidEditor',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true,
    usedExports: true
  }
};
```

### PostCSS Configuration
```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano')({
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
      }]
    })
  ]
};
```

## 📁 File Organization

```
mermaid-editor-v2/
├── src/
│   ├── index.js              # Entry point
│   ├── MermaidEditor.js      # Main class
│   ├── core/
│   │   ├── State.js
│   │   ├── EventBus.js
│   │   └── History.js
│   ├── canvas/
│   │   ├── Canvas.js
│   │   ├── NestedCanvas.js
│   │   └── CanvasManager.js
│   ├── features/
│   │   ├── XRayVision.js
│   │   ├── ConnectionFlow.js
│   │   └── DragDrop.js
│   ├── ui/
│   │   ├── Toolbar.js
│   │   ├── ContextMenu.js
│   │   └── PropertyPanel.js
│   └── utils/
│       ├── geometry.js
│       ├── colors.js
│       └── performance.js
├── styles/
│   ├── dark-theme.css
│   ├── components/
│   └── animations.css
├── assets/
│   ├── icons/
│   └── textures/
└── dist/
    ├── mermaid-editor.js
    └── mermaid-editor.css
```

## 🧪 Testing Strategy

### Unit Tests
```javascript
// Example test for NestedCanvas
describe('NestedCanvas', () => {
  it('should transfer nodes between canvases', () => {
    const parentNode = createMockNode();
    const nestedCanvas = new NestedCanvas(parentNode, editor);
    const nodesToTransfer = [createMockNode(), createMockNode()];
    
    nestedCanvas.handleDragInto(nodesToTransfer);
    
    expect(nestedCanvas.nodes.size).toBe(2);
    expect(nodesToTransfer[0].canvas).toBe(nestedCanvas);
  });
});
```

### Integration Tests
```javascript
// X-ray vision integration
describe('XRayVision Integration', () => {
  it('should reveal all nested canvases on activation', async () => {
    const editor = new MermaidEditor(container);
    await editor.loadDiagram(complexNestedDiagram);
    
    editor.xrayVision.activate();
    
    const visibleCanvases = document.querySelectorAll('.xray-canvas-container');
    expect(visibleCanvases.length).toBe(3); // Based on test diagram
  });
});
```

## 🎯 Migration Steps

1. **Backup Current Version**
   ```bash
   cp -r mermaid-editor mermaid-editor-v1-backup
   ```

2. **Create New Structure**
   ```bash
   mkdir -p mermaid-editor-v2/src/{core,canvas,features,ui,utils}
   mkdir -p mermaid-editor-v2/styles/components
   ```

3. **Copy Reusable Components**
   - Modal system patterns
   - State management concepts
   - Useful utility functions

4. **Build Fresh Implementation**
   - Start with core modules
   - Add features incrementally
   - Test each module in isolation

5. **Create Single HTML Entry**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Mermaid Editor V2</title>
     <link rel="stylesheet" href="dist/mermaid-editor.css">
   </head>
   <body>
     <div id="editor"></div>
     <script src="dist/mermaid-editor.js"></script>
     <script>
       const editor = new MermaidEditor('editor', {
         theme: 'dark',
         features: {
           nestedCanvas: true,
           xrayVision: true
         }
       });
     </script>
   </body>
   </html>
   ```

## ✅ Success Criteria

1. **Clean Architecture** - No mixed paradigms or legacy code
2. **Performance** - 60fps interactions, < 200KB bundle
3. **Reliability** - All features work without conflicts
4. **Maintainability** - Clear module boundaries
5. **User Experience** - Intuitive and responsive

---

This implementation plan provides a clear path forward for building Mermaid Editor V2 with all the innovative features while maintaining a clean, maintainable architecture.