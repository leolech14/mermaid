# GitHub Codespaces AI Configuration

## Quick Setup for AI-Powered Development

### 1. Environment Variables (Add in Codespaces settings)
```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GITHUB_TOKEN=your-github-token
```

### 2. Secrets (Add in Codespaces secrets section)
- Same as environment variables above
- These will be securely stored and accessible in your Codespace

### 3. Agent Internet Access
- **Turn ON** to enable AI tools to:
  - Fetch latest documentation
  - Access external APIs
  - Search for solutions
  - Pull current best practices

### 4. Update Setup Script
Add to your `.devcontainer/postCreateCommand.sh` or setup script:
```bash
# Install GitHub Copilot CLI
npm install -g @githubnext/github-copilot-cli

# Install Python AI packages
pip install openai anthropic langchain tiktoken
```

### 5. Preinstalled Packages to Include
In your devcontainer.json or requirements:
```json
"features": {
  "ghcr.io/devcontainers/features/github-cli:1": {},
  "ghcr.io/devcontainers/features/python:1": {}
}
```

## Using AI Features

### With GitHub Copilot CLI
```bash
# Get AI suggestions for code
gh copilot suggest "how to optimize this function"

# Explain code
gh copilot explain "what does this code do"
```

### With Custom Scripts
```bash
# Run AI assessments
npm run ai:assess-quality
npm run ai:assess-security
npm run ai:assess-performance
```

### Direct API Usage
```python
import openai
openai.api_key = os.getenv("OPENAI_API_KEY")

# Use for code analysis
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Analyze this code..."}]
)
```

## Best Practices
1. Store API keys as secrets, never in code
2. Use environment variables for configuration
3. Enable agent internet access for full capabilities
4. Regularly update AI tool versions
5. Monitor API usage to control costs

---
*Remember: API keys should be added through GitHub Codespaces settings UI, not committed to the repository.*