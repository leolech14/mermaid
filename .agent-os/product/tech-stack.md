# Technical Stack

> Last Updated: 2025-07-26
> Version: 1.0.0

## Core Technologies

### Application Framework
- **Framework:** Vanilla JavaScript
- **Version:** ES6+ (ES2020 features)
- **Language:** JavaScript

### Database
- **Primary:** LocalStorage API
- **Version:** Web Storage API
- **ORM:** None (direct API usage)

## Frontend Stack

### JavaScript Framework
- **Framework:** None (Vanilla JS)
- **Version:** ES6 Modules
- **Build Tool:** Vite 5.x (planned)

### Import Strategy
- **Strategy:** ES6 Modules
- **Package Manager:** npm
- **Node Version:** 18.x or higher

### CSS Framework
- **Framework:** Custom Modular CSS
- **Version:** CSS3 with Custom Properties
- **PostCSS:** Yes (with Vite)

### UI Components
- **Library:** Custom Components
- **Version:** Internal
- **Installation:** Built-in

## Libraries & Dependencies

### Core Libraries
- **Mermaid.js:** v10.x or higher
- **CodeMirror:** v6.x
- **Version:** Latest stable releases

### Build Dependencies
- **Vite:** 5.x
- **PostCSS:** 8.x
- **Autoprefixer:** Latest
- **CSSnano:** Latest

## Assets & Media

### Fonts
- **Provider:** System Fonts
- **Loading Strategy:** font-family fallback stack

### Icons
- **Library:** Inline SVG
- **Implementation:** Direct SVG in HTML/JS

## Infrastructure

### Application Hosting
- **Platform:** Static File
- **Service:** Any web server or local file://
- **Region:** N/A (client-side only)

### Database Hosting
- **Provider:** Browser LocalStorage
- **Service:** Client-side storage
- **Backups:** User-managed exports

### Asset Storage
- **Provider:** Inline/Base64
- **CDN:** Not required
- **Access:** Bundled in HTML

## Deployment

### CI/CD Pipeline
- **Platform:** GitHub Actions (planned)
- **Trigger:** Push to main branch
- **Tests:** Jest unit tests

### Build Output
- **Production:** Single HTML file with all assets inlined
- **Development:** Modular files with hot reload
- **Distribution:** index.html (self-contained)

### Environments
- **Production:** Single file distribution
- **Development:** Vite dev server
- **Review Apps:** GitHub Pages previews

## Code Repository
- **URL:** https://github.com/[pending]