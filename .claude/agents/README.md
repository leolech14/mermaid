# Mermaid Canvas Editor - Specialized Agents

This directory contains specialized AI agents for Claude Code that ensure high-quality, stable development of the Mermaid Canvas Editor. Each agent has deep expertise in specific areas and will be automatically invoked when working on related tasks.

## Available Agents

### 🎨 canvas-architect
**Expertise**: Canvas rendering, visual editing, drag-and-drop, performance optimization  
**Use When**: Implementing any visual features, node manipulation, or canvas operations  
**Key Focus**: 60fps performance, clean rendering pipeline, efficient algorithms

### 🎭 style-artist
**Expertise**: Visual styling, animations, themes, glass morphism effects  
**Use When**: Working on aesthetics, colors, animations, or visual effects  
**Key Focus**: Beautiful UI, smooth animations, consistent design language

### 🛡️ module-guardian
**Expertise**: Architecture enforcement, module boundaries, error prevention  
**Use When**: Creating new modules, integrating features, or modifying architecture  
**Key Focus**: Preventing cascade failures, maintaining stability, clean interfaces

### 📦 single-file-bundler
**Expertise**: Build configuration, asset optimization, single HTML distribution  
**Use When**: Setting up builds, optimizing bundle size, creating distributions  
**Key Focus**: <500KB file size, offline functionality, efficient bundling

### 🧪 test-guardian
**Expertise**: Testing strategies, TDD, visual regression, quality assurance  
**Use When**: Writing tests, implementing new features, fixing bugs  
**Key Focus**: Comprehensive coverage, regression prevention, test-first development

### 🔄 sync-master
**Expertise**: Code-visual synchronization, state management, real-time updates  
**Use When**: Working on sync features, state updates, or bidirectional editing  
**Key Focus**: Zero drift, instant updates, conflict resolution

## How Agents Work Together

These agents collaborate to ensure every aspect of development maintains the highest standards:

1. **module-guardian** reviews architecture before any implementation
2. **canvas-architect** designs visual features with performance in mind
3. **sync-master** ensures perfect code-visual synchronization
4. **style-artist** adds beautiful aesthetics without compromising function
5. **test-guardian** verifies everything works correctly
6. **single-file-bundler** packages it all into a distributable file

## Best Practices

- Let agents review each other's work for comprehensive coverage
- Always invoke **module-guardian** before major changes
- Use **test-guardian** throughout development, not just at the end
- Consult **canvas-architect** for any performance concerns
- Have **sync-master** validate any state management changes

## Agent Invocation

Agents can be invoked in several ways:

1. **Automatic**: Claude Code will automatically select appropriate agents based on context
2. **Explicit**: Request specific agents with phrases like:
   - "Have the canvas-architect review this rendering code"
   - "Use the style-artist to improve these animations"
   - "Ask the module-guardian about this architecture"

## Emergency Protocols

If you encounter cascade failures or critical bugs:
1. Immediately invoke **module-guardian** for diagnosis
2. Use **test-guardian** to create failing test cases
3. Have **sync-master** verify state consistency
4. Let **canvas-architect** check for rendering issues

Remember: These agents exist to prevent the stability issues that plagued previous versions. Use them proactively, not reactively.