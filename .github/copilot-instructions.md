# GitHub Copilot Instructions for Mermaid Editor

## Project Context
This is a Mermaid diagram editor with real-time preview, syntax highlighting, and export capabilities. The project uses vanilla JavaScript with a modular architecture.

## Code Style Guidelines
- Use ES6+ features
- Follow modular architecture patterns
- Add data-purpose attributes to all interactive elements
- Use event delegation where possible
- Implement proper error handling

## Key Principles
1. **Never rewrite entire files** - make targeted edits only
2. **Always update edit_log.md** when making changes
3. **Follow purpose-tag convention** for component identification
4. **Maintain backwards compatibility** with existing features
5. **Test in multiple browsers** before finalizing

## Common Tasks

### Adding New Features
1. Check FEATURES.md for requirements
2. Add purpose tags to new elements
3. Follow existing module patterns
4. Update documentation

### Bug Fixes
1. Reproduce the issue first
2. Make minimal necessary changes
3. Test the fix thoroughly
4. Document in edit_log.md

### Performance Improvements
1. Profile before optimizing
2. Use debouncing for expensive operations
3. Lazy load when possible
4. Cache DOM queries

## File-Specific Notes

### mermaid.html
- Main entry point, be careful with changes
- All features should be modular
- Keep inline scripts minimal

### minimal-editor.html  
- Lightweight version, no heavy dependencies
- Core functionality only
- Should work offline

## Testing Checklist
- [ ] Works in Chrome, Firefox, Safari
- [ ] No console errors
- [ ] Responsive design intact
- [ ] All exports working
- [ ] Theme switching works
- [ ] Auto-save functional

## Helpful Context
- Mermaid.js v10.x for diagrams
- CodeMirror v6.x for editing
- Vite for build tooling
- No framework dependencies