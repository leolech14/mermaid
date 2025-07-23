# Mermaid Visual Editor - Hybrid Excellence Approach

A powerful yet intuitive Mermaid diagram editor that combines the best of code and visual editing paradigms. Built with a balanced architecture that scales from simple to complex use cases.

## 🎯 Features

### Core Capabilities
- **Dual-Mode Editing**: Seamless switching between code and visual modes
- **Smart Rendering**: Canvas 2D for performance with SVG fallback
- **Progressive Enhancement**: Works everywhere, scales with capability
- **Real-time Sync**: Live preview as you type or drag
- **Touch Support**: First-class mobile and tablet experience

### Visual Editing
- Drag and drop nodes
- Visual connection drawing
- Auto-layout algorithms
- Grid snapping
- Multi-selection

### Code Editing
- Syntax highlighting
- Auto-completion
- Error detection
- Format on save
- Template library

### Export Options
- SVG (vector)
- PNG (raster)
- PDF (print)
- Markdown (documentation)
- HTML (embed)

## 🚀 Quick Start

### Using as a Module

```javascript
// Import the module
import MermaidEditor from './src/core/editor.js';

// Initialize in your container
const editor = new MermaidEditor('editor-container', {
    theme: 'dark',
    enableVisualEdit: true,
    enableCodeEdit: true
});

// Load a diagram
editor.setCode(`
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
`);
```

### Standalone Usage

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="dist/mermaid-editor.css">
</head>
<body>
    <div id="editor"></div>
    <script src="dist/mermaid-editor.js"></script>
    <script>
        const editor = new MermaidEditor('editor');
    </script>
</body>
</html>
```

## 🏗️ Architecture

### Rendering Strategy
- **Primary**: Canvas 2D for complex diagrams (>100 nodes)
- **Fallback**: SVG for simple diagrams and better accessibility
- **Progressive**: Automatic switching based on complexity

### State Management
- MobX for reactive updates
- Command pattern for undo/redo
- Local storage for persistence
- WebSocket ready for collaboration

### Performance
- Virtual viewport for large diagrams
- Debounced rendering
- Web Workers for heavy computation
- Lazy loading of features

## 📦 Project Structure

```
mermaid-editor/
├── src/
│   ├── core/           # Core editor logic
│   ├── renderer/       # Canvas/SVG rendering
│   ├── ui/            # UI components
│   ├── state/         # State management
│   └── utils/         # Utilities
├── dist/              # Built files
├── examples/          # Usage examples
├── docs/              # Documentation
└── tests/             # Test suite
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📊 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 14+, Android 10+)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Core dual-mode editor
- [x] Basic visual editing
- [x] Export functionality
- [ ] Touch support

### Phase 2
- [ ] Advanced layouts
- [ ] Collaboration features
- [ ] Plugin system
- [ ] AI assistance

### Phase 3
- [ ] Mobile apps
- [ ] Cloud sync
- [ ] Enterprise features
- [ ] Advanced analytics