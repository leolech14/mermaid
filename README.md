# Mermaid Editor

A powerful, interactive web-based editor for creating and editing Mermaid diagrams with real-time preview, syntax highlighting, and extensive customization options.

## Overview

This repository contains a modular Mermaid diagram editor with multiple implementations optimized for different use cases:

- **Full-featured editor** with all capabilities
- **Minimal editor** for lightweight embedding
- **Modular architecture** for easy customization

## Quick Start

1. **Main Editor**: Open `mermaid.html` in a web browser
2. **Minimal Version**: Use `minimal-editor.html` for a lightweight experience
3. **Development**: See `SETUP.md` for development environment setup

## Key Features

- Real-time diagram preview
- Syntax highlighting with CodeMirror
- Multiple theme support (Dark/Light)
- Export to PNG/SVG
- Auto-save functionality
- Responsive design
- Modular architecture

## Documentation

- [`FEATURES.md`](FEATURES.md) - Complete feature documentation and roadmap
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - Technical architecture and design decisions
- [`SETUP.md`](SETUP.md) - Development setup and build instructions
- [`BESTPRACTICES.md`](BESTPRACTICES.md) - **MUST READ** - Development standards and guidelines
- [`edit_log.md`](edit_log.md) - Track all code changes
- [`todo_list.md`](todo_list.md) - Current and planned tasks
- [`ai-assessment-guide.md`](ai-assessment-guide.md) - Guide for AI-powered code assessment

## Project Structure

```
mermaid/
├── index.html              # Landing page
├── mermaid.html           # Main full-featured editor
├── minimal-editor.html    # Lightweight editor version
├── src/                   # ES6 source modules
├── js/                    # JavaScript modules and bundles
├── css/                   # Modular CSS files
├── views/                 # Alternative editor implementations
└── versions/              # Historical versions archive
```

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Requires JavaScript enabled

## License

MIT License - See LICENSE file for details