# Mermaid Editor Features

This document provides a comprehensive overview of all features available in the Mermaid Editor and serves as the primary reference for functionality implementation.

## Core Features

### 1. Diagram Editing
- **Real-time Preview**: Live rendering of Mermaid diagrams as you type
- **Syntax Highlighting**: CodeMirror-powered editor with Mermaid syntax support
- **Auto-completion**: Smart suggestions for diagram syntax
- **Error Detection**: Real-time syntax validation with error messages

### 2. Diagram Types Supported
- Flowcharts
- Sequence Diagrams
- Gantt Charts
- Class Diagrams
- State Diagrams
- Entity Relationship Diagrams
- User Journey Maps
- Pie Charts
- Requirement Diagrams
- Git Graphs

### 3. Export Options
- **PNG Export**: High-resolution raster images
- **SVG Export**: Scalable vector graphics
- **PDF Export**: Document-ready format
- **Markdown Export**: Copy diagram code with markdown fence
- **HTML Embed**: Generate embeddable HTML snippets

### 4. Theme Support
- **Dark Theme**: Eye-friendly dark mode with pastel accents
- **Light Theme**: Clean, professional light mode
- **Custom Themes**: CSS-based theme customization
- **Syntax Theme**: Independent editor theme selection

### 5. User Interface
- **Split View**: Side-by-side editor and preview
- **Full-Screen Mode**: Distraction-free editing
- **Resizable Panes**: Adjustable editor/preview ratio
- **Toolbar**: Quick access to common actions
- **Status Bar**: Current diagram info and statistics

### 6. Storage & Persistence
- **Local Storage**: Auto-save to browser storage
- **File Operations**: Save/Load diagram files
- **Recent Files**: Quick access to recent diagrams
- **Templates**: Pre-built diagram templates

### 7. Advanced Features
- **Zoom Controls**: Pan and zoom diagram preview
- **Grid/Snap**: Alignment assistance
- **Diagram Navigation**: Minimap for large diagrams
- **Search & Replace**: Find text within diagrams
- **Multiple Tabs**: Work on multiple diagrams

## Implementation Status

### ✅ Completed Features
- Basic diagram rendering
- CodeMirror integration
- Theme switching
- PNG/SVG export
- Local storage auto-save
- Responsive design

### 🚧 In Progress
- PDF export functionality
- Advanced auto-completion
- Template library
- Keyboard shortcuts

### 📋 Planned Features
- Collaborative editing
- Cloud storage integration
- Diagram versioning
- Plugin system
- API for external integrations

## Feature Requests & Customization

To request new features or discuss customization needs, please add them to this document in the appropriate section below.

### Custom Feature Requirements
*[This section is reserved for specific feature requirements and customizations. Please add your requirements here with clear descriptions and use cases.]*

#### Example Format:
```
Feature: [Feature Name]
Description: [What the feature should do]
Use Case: [Why this feature is needed]
Priority: [High/Medium/Low]
Technical Notes: [Any specific implementation requirements]
```

---

## Technical Implementation Notes

### Core Dependencies
- **Mermaid.js**: v10.x for diagram rendering
- **CodeMirror**: v6.x for code editing
- **html2canvas**: For PNG export
- **Vite**: Build tooling

### Architecture Decisions
- Modular ES6 architecture for maintainability
- Event-driven communication between components
- Lazy loading for performance optimization
- Progressive enhancement approach

### Extension Points
1. **Custom Renderers**: Add new diagram types
2. **Export Formats**: Implement additional export options
3. **Storage Backends**: Integrate cloud storage providers
4. **Theme System**: Create custom visual themes
5. **Editor Plugins**: Extend editor functionality

---

*This document serves as the central reference for all features. When implementing new functionality, update this document to maintain accurate documentation.*