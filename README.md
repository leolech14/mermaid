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

### Current Implementation
The editor has two parallel implementations:
1. **Monolithic Version** (`views/editor-interactive.html`) - Legacy 3,600+ line file
2. **Modular Version** (`views/editor-modular.html`) - Modern architecture with separated modules

### Module System
- ES6 modules bundled for browser compatibility
- Event-driven communication between components
- Manager pattern for nodes, connections, and state
- Adapter pattern for legacy code compatibility

### 📚 Documentation for Developers
- **[EDITING_MANUAL.md](EDITING_MANUAL.md)** - Comprehensive guide for making changes
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick lookup for common tasks
- **[js/README.md](js/README.md)** - JavaScript architecture details

### Build System
- Source files in ES6 modules
- Build scripts create browser-compatible bundles
- CSS follows modular architecture with component separation

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