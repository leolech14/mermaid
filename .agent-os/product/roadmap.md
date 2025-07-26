# Product Roadmap

> Last Updated: 2025-07-26
> Version: 1.0.0
> Status: Planning

## Phase 0: Already Completed

The following features have been implemented:

- [x] Basic Mermaid editor with CodeMirror integration - Core editor functionality `XS`
- [x] Real-time diagram preview - Live rendering of Mermaid code `S`
- [x] Dark/Light theme support - Theme switching capability `S`
- [x] Export to PNG/SVG - Basic export functionality `M`
- [x] Multiple editor versions - Full, minimal, and modular implementations `L`
- [x] Modal system - Reusable modal components `M`
- [x] State management foundation - Basic state handling `M`
- [x] Event bus system - Component communication `S`
- [x] Modular CSS architecture - Organized stylesheet structure `S`

## Phase 1: Foundation Stabilization (1-2 weeks)

**Goal:** Create a stable, error-free foundation for visual editing features
**Success Criteria:** All builds pass, no console errors, 100% module compatibility

### Must-Have Features

- [ ] Vite build pipeline setup - Modern build system with hot reload `M`
- [ ] Comprehensive error handling - Prevent cascading failures `M`
- [ ] Module boundary enforcement - Clear separation of concerns `L`
- [ ] Test suite implementation - Unit and integration tests `L`
- [ ] Single-file bundler - Create distribution build `M`

### Should-Have Features

- [ ] Performance monitoring - FPS counter and metrics `S`
- [ ] Debug mode - Enhanced logging and diagnostics `S`

### Dependencies

- npm/Node.js environment setup
- Vite configuration
- Jest/Vitest setup

## Phase 2: Visual Canvas System (2-3 weeks)

**Goal:** Implement core visual editing capabilities with drag & drop
**Success Criteria:** Users can visually manipulate nodes while code stays synchronized

### Must-Have Features

- [ ] Canvas rendering layer - SVG-based diagram rendering `XL`
- [ ] Node drag & drop - Visual positioning of elements `L`
- [ ] Real-time code sync - Bidirectional updates `L`
- [ ] Visual selection system - Click and multi-select `M`
- [ ] Zoom and pan controls - Canvas navigation `M`

### Should-Have Features

- [ ] Snap-to-grid - Alignment assistance `S`
- [ ] Ruler and guides - Precision positioning `M`
- [ ] Keyboard shortcuts - Efficiency features `M`

### Dependencies

- Stable foundation from Phase 1
- Canvas rendering architecture
- State synchronization system

## Phase 3: Styling Engine (2-3 weeks)

**Goal:** Enable extensive visual customization of diagram elements
**Success Criteria:** Users can apply colors, shapes, animations to any element

### Must-Have Features

- [ ] Color picker system - Node and edge coloring `M`
- [ ] Shape variations - Different node shapes `M`
- [ ] Size controls - Dynamic sizing UI `S`
- [ ] Animation system - Transition effects `L`
- [ ] Style persistence - Save custom styles `M`

### Should-Have Features

- [ ] Gradient support - Advanced color effects `M`
- [ ] Shadow and glow effects - Visual depth `S`
- [ ] Custom CSS injection - Power user feature `S`

### Dependencies

- Visual canvas system
- Extended Mermaid.js integration
- Style serialization system

## Phase 4: Advanced Canvas Features (3-4 weeks)

**Goal:** Implement nested canvases and X-ray vision for complex diagrams
**Success Criteria:** Multi-level diagrams with smooth navigation between levels

### Must-Have Features

- [ ] Nested canvas system - Nodes containing sub-diagrams `XL`
- [ ] X-ray vision mode - See through diagram layers `L`
- [ ] Level navigation - Zoom in/out of nested content `M`
- [ ] Connection routing - Smart edge paths between levels `L`

### Should-Have Features

- [ ] Minimap navigation - Overview of large diagrams `M`
- [ ] Breadcrumb navigation - Level indicator `S`
- [ ] Focus mode - Isolate diagram sections `M`

### Dependencies

- Stable canvas system
- Performance optimizations
- Advanced state management

## Phase 5: Polish and Distribution (2-3 weeks)

**Goal:** Create polished single-file application with glass morphism UI
**Success Criteria:** Beautiful, performant app in a single HTML file under 500KB

### Must-Have Features

- [ ] Glass morphism UI - Modern visual effects `L`
- [ ] Single HTML bundling - All assets inlined `L`
- [ ] Offline functionality - No external dependencies `M`
- [ ] Import/Export system - Diagram portability `M`
- [ ] Comprehensive shortcuts - Power user features `M`

### Should-Have Features

- [ ] Onboarding tutorial - Interactive guide `M`
- [ ] Template library - Quick start diagrams `L`
- [ ] Performance optimizations - 60fps target `M`
- [ ] Accessibility features - Keyboard navigation `M`

### Dependencies

- All previous phases complete
- Build optimization pipeline
- Asset inlining system