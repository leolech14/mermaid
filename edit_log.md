# Edit Log

This file tracks all modifications made to the Mermaid Editor codebase. Each entry should include date, files modified, purpose, and specific changes.

## Format

```markdown
## YYYY-MM-DD - Brief Description
- **Author**: [Name/Agent]
- **Files Modified**: 
  - filename (lines X-Y): description
- **Purpose**: Why the change was made
- **Tags Added**: Any new data-purpose tags
- **Notes**: Additional context
```

---

## 2024-07-24 - Initial Repository Cleanup
- **Author**: Assistant
- **Files Modified**: 
  - Deleted: mermaid-latest.html (duplicate of mermaid.html)
  - Deleted: mermaid_editor.html (redundant version)
  - Deleted: editor-stable-clean.html (redundant minimal version)
  - Deleted: editor-v2-integrated.html (incomplete version)
  - Deleted: editor-v2-standalone.html (experimental version)
  - Deleted: views/editor-interactive.html (duplicate functionality)
  - Deleted: build-bundle.cjs, build-v2-bundle.js (legacy build scripts)
  - Deleted: 8 outdated documentation files
  - Created: README.md (new clean documentation)
  - Created: FEATURES.md (feature reference)
  - Created: ARCHITECTURE.md (technical guide)
  - Created: SETUP.md (development guide)
  - Created: BESTPRACTICES.md (development standards)
  - Created: .gitignore (version control)
- **Purpose**: Simplify repository structure for easier maintenance
- **Tags Added**: None (cleanup only)
- **Notes**: Reduced from 6+ editor versions to 2 main versions (full and minimal)

---

<!-- Add new entries below this line -->