# Development Setup Guide

## Prerequisites

- Node.js 16+ and npm 7+
- Modern web browser (Chrome, Firefox, Safari)
- Git for version control
- Code editor (VS Code recommended)

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd mermaid
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Server
```bash
npm run dev
```
Opens at http://localhost:5173

### 4. Production Build
```bash
npm run build
```
Output in `dist/` directory

## Development Workflow

### File Structure
- **src/** - ES6 source modules (edit these)
- **js/** - Compiled modules (don't edit directly)
- **css/** - Stylesheets (modular structure)
- **Main files**:
  - `mermaid.html` - Full editor
  - `minimal-editor.html` - Lightweight version

### Making Changes

1. **JavaScript Changes**
   - Edit files in `src/`
   - Modules auto-reload with Vite HMR
   - Follow ES6 module patterns

2. **CSS Changes**
   - Edit files in `css/`
   - Use modular CSS approach
   - Theme variables in `css/themes/`

3. **HTML Changes**
   - Edit main HTML files directly
   - Test both full and minimal versions

### Code Style
- ES6+ JavaScript
- Modular architecture
- Event-driven communication
- Mobile-first CSS

## Common Tasks

### Add New Feature
1. Create module in `src/`
2. Import in main file
3. Add event listeners
4. Update documentation

### Create New Theme
1. Copy existing theme in `css/themes/`
2. Modify CSS variables
3. Add theme option to UI

### Debug Issues
1. Check browser console
2. Use browser DevTools
3. Enable source maps in dev mode

## Testing

### Manual Testing
1. Test in multiple browsers
2. Check responsive design
3. Verify all export formats
4. Test with various diagram types

### Performance Testing
- Use Lighthouse for audits
- Check bundle size
- Monitor render performance

## Deployment

### Static Hosting
Simply upload contents of `dist/` after building:
- GitHub Pages
- Netlify
- Vercel
- Any static host

### Server Requirements
- No backend required
- CORS headers for ES modules
- HTTPS recommended

## Troubleshooting

### Common Issues

**Modules not loading**
- Run `npm install`
- Check browser console
- Verify server is running

**Export not working**
- Check browser permissions
- Verify dependencies loaded
- Test in different browser

**Diagram not rendering**
- Check Mermaid syntax
- Verify mermaid.js loaded
- Check console for errors

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## Resources

- [Mermaid.js Documentation](https://mermaid-js.github.io/mermaid/)
- [CodeMirror 6 Guide](https://codemirror.net/6/docs/guide/)
- [Vite Documentation](https://vitejs.dev/)

---

For additional help, check the issue tracker or submit a new issue.