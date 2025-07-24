# AI Assessment & Improvement Guide

This guide helps you leverage AI tools (GitHub Copilot, ChatGPT, Claude, etc.) to assess and improve the Mermaid Editor codebase.

## Quick Assessment Prompts

### 1. Code Quality Assessment
```
Please analyze the mermaid.html file and provide:
1. Code quality score (1-10)
2. Performance bottlenecks
3. Security vulnerabilities
4. Accessibility issues
5. Suggested improvements with priority levels
```

### 2. Architecture Review
```
Review the project architecture in ARCHITECTURE.md and src/ folder:
1. Is the modular design effective?
2. Are there any circular dependencies?
3. Suggest architectural improvements
4. Identify missing design patterns
```

### 3. Feature Completeness
```
Based on FEATURES.md, analyze:
1. Which planned features are missing?
2. Implementation quality of existing features
3. Priority order for new features
4. Estimated effort for each feature
```

### 4. Performance Audit
```
Analyze performance aspects:
1. Bundle size optimization opportunities
2. Rendering performance for large diagrams
3. Memory leak potential
4. Network request optimization
```

### 5. Security Review
```
Check for security issues:
1. XSS vulnerabilities in diagram rendering
2. Local storage security
3. File upload/download safety
4. Content Security Policy needs
```

## Improvement Request Templates

### Add New Feature
```
Following BESTPRACTICES.md, please add [FEATURE_NAME]:
1. Read existing code first
2. Add with proper data-purpose tags
3. Update edit_log.md and todo_list.md
4. Maintain existing functionality
5. Test across browsers
```

### Fix Bug
```
Bug: [DESCRIPTION]
Steps to reproduce: [STEPS]
Expected: [EXPECTED_BEHAVIOR]
Actual: [ACTUAL_BEHAVIOR]

Please fix following BESTPRACTICES.md guidelines.
```

### Optimize Performance
```
Performance issue: [DESCRIPTION]
Current metrics: [METRICS]
Target improvement: [GOAL]

Suggest optimizations that:
1. Don't break existing features
2. Are measurable
3. Follow project architecture
```

## AI Tool Configuration

### GitHub Copilot
- Instructions file: `.github/copilot-instructions.md`
- VS Code settings: `.vscode/settings.json`
- Enabled for all file types

### ChatGPT/Claude Integration
When sharing code with ChatGPT or Claude:
1. Always include BESTPRACTICES.md
2. Share relevant architecture context
3. Specify you want Edit operations, not full rewrites
4. Request updates to tracking files

### Cursor AI / Continue.dev
For IDE integration:
1. Point to `.github/copilot-instructions.md`
2. Include project context from FEATURES.md
3. Reference ARCHITECTURE.md for patterns

## Assessment Checklist

### Before Requesting Assessment
- [ ] Repository is up to date
- [ ] Documentation is current
- [ ] edit_log.md reflects recent changes
- [ ] todo_list.md is accurate

### Assessment Areas
- [ ] Code quality and consistency
- [ ] Performance optimization
- [ ] Security vulnerabilities
- [ ] Accessibility compliance
- [ ] Browser compatibility
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Test coverage needs

### After Assessment
- [ ] Create issues for findings
- [ ] Update todo_list.md
- [ ] Prioritize improvements
- [ ] Document decisions

## Sample Analysis Workflow

```bash
# 1. Full codebase analysis
"Analyze the entire Mermaid Editor codebase and provide a comprehensive 
assessment covering code quality, architecture, performance, security, 
and maintainability. Format as a scored report with actionable recommendations."

# 2. Specific module analysis  
"Review the export functionality in js/modules/exportModule.js and 
suggest improvements for reliability and performance."

# 3. Feature implementation review
"Check if the auto-save feature follows best practices and suggest 
improvements for edge cases and error handling."

# 4. Cross-browser compatibility
"Analyze potential browser compatibility issues and suggest polyfills 
or alternative implementations where needed."
```

## Continuous Improvement

### Weekly Reviews
1. Run AI assessment on changed files
2. Update improvement backlog
3. Tackle highest priority items

### Monthly Audits
1. Full codebase assessment
2. Architecture review
3. Dependency updates
4. Performance benchmarking

### Metrics to Track
- Code quality scores
- Bundle size trends
- Performance metrics
- Bug discovery rate
- Feature completion rate

---

Remember: AI tools are assistants. Always review suggestions critically and test thoroughly before implementing.