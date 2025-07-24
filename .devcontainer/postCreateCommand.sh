#!/bin/bash

# Post-create script for Codespaces setup

echo "🚀 Setting up Mermaid Editor development environment..."

# Install dependencies
npm install

# Install global tools for AI integration
npm install -g @githubnext/github-copilot-cli

# Install Python dependencies for AI tools (if needed)
if command -v python3 &> /dev/null; then
    pip install --user openai anthropic langchain
fi

# Create .env template if not exists
if [ ! -f .env ]; then
    cat > .env.template << 'EOF'
# AI Service API Keys (Add your keys here)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GITHUB_TOKEN=your-github-token

# Development Settings
VITE_PORT=5173
NODE_ENV=development
EOF
    echo "📝 Created .env.template - add your API keys!"
fi

# Setup git aliases for AI-enhanced commits
git config --global alias.ai-commit '!f() { git add -A && git commit -m "$(gh copilot suggest "Write a commit message for these changes" --shellout)"; }; f'

# Create AI tools directory
mkdir -p .ai-tools

# Create AI assessment script
cat > .ai-tools/assess.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log(`
🤖 AI Assessment Tool for Mermaid Editor

Available commands:
- npm run ai:assess-quality     - Full code quality assessment
- npm run ai:assess-security    - Security vulnerability scan
- npm run ai:assess-performance - Performance optimization scan
- npm run ai:suggest-features   - Feature suggestions based on codebase

For custom assessments, see ai-assessment-guide.md
`);
EOF

chmod +x .ai-tools/assess.js

echo "✅ Codespaces setup complete!"
echo "📚 Check ai-assessment-guide.md for AI integration instructions"