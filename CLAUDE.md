# CLAUDE.md - Mermaid Canvas Editor Context

## Agent OS Documentation

### Product Context
- **Mission & Vision:** @.agent-os/product/mission.md
- **Technical Architecture:** @.agent-os/product/tech-stack.md
- **Development Roadmap:** @.agent-os/product/roadmap.md
- **Decision History:** @.agent-os/product/decisions.md

### Development Standards
- **Code Style:** @~/.agent-os/standards/code-style.md
- **Best Practices:** @~/.agent-os/standards/best-practices.md

### Project Management
- **Active Specs:** @.agent-os/specs/
- **Spec Planning:** Use `@~/.agent-os/instructions/create-spec.md`
- **Tasks Execution:** Use `@~/.agent-os/instructions/execute-tasks.md`

## Workflow Instructions

When asked to work on this codebase:

1. **First**, check @.agent-os/product/roadmap.md for current priorities
2. **Then**, follow the appropriate instruction file:
   - For new features: @.agent-os/instructions/create-spec.md
   - For tasks execution: @.agent-os/instructions/execute-tasks.md
3. **Always**, adhere to the standards in the files listed above

## Important Notes

- Product-specific files in `.agent-os/product/` override any global standards
- User's specific instructions override (or amend) instructions found in `.agent-os/specs/...`
- Always adhere to established patterns, code style, and best practices documented above.

## Project-Specific Guidelines

### Critical Development Rules

1. **Module Boundaries Are Sacred**
   - Each module must have a clear, documented interface
   - No direct cross-module dependencies
   - Use the event bus for communication between modules

2. **Error Handling Is Mandatory**
   - Every function that can fail must have error handling
   - Use error boundaries to prevent cascade failures
   - Log errors with context for debugging

3. **Test Before Integration**
   - Never merge code without tests
   - Test edge cases, especially for canvas operations
   - Use visual regression tests for UI changes

4. **Canvas-First Development**
   - Every feature must work visually first
   - Code generation follows visual implementation
   - Maintain real-time synchronization

### Architecture Reminders

- **State Management:** Single source of truth in StateManager
- **Rendering:** Canvas renders from state, never directly from user input
- **Events:** All user interactions go through EventBus
- **History:** Every state change must be undoable

### Performance Targets

- 60fps during all interactions
- <200ms response time for user actions
- <500KB final bundle size
- <100ms diagram render time

### Known Pitfalls to Avoid

1. **Direct DOM manipulation** - Always go through the appropriate manager
2. **Synchronous heavy operations** - Use requestAnimationFrame for canvas updates
3. **Memory leaks** - Clean up event listeners and references
4. **Tight coupling** - Use interfaces and events, not direct imports