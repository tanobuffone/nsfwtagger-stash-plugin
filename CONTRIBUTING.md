# Contributing to NSFWTagger

Thank you for your interest in contributing to NSFWTagger! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Community](#community)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## Getting Started

### Prerequisites

- **Node.js** 18+ (for plugin development)
- **Python** 3.9+ (for processor development)
- **Docker** (for containerized development)
- **Ollama** (for local AI model testing)
- **Git** (version control)

### Quick Start

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/your-username/nsfwtagger-stash-plugin.git
   cd nsfwtagger-stash-plugin
   ```

2. **Setup Development Environment**:
   ```bash
   # Plugin development
   cd nsfwtag-plugin
   npm install

   # Processor development
   cd ../nsfwtag-processor
   pip install -r requirements.txt

   # Install Ollama models for testing
   ollama pull qwen3-vl-4b-instruct/Qwen3-VL-4B-Instruct-Q4_K_M.gguf
   ollama pull olmocr-2-7b-1025/olmOCR-2-7B-1025-Q4_K_M.gguf
   ```

3. **Run Tests**:
   ```bash
   # Plugin tests
   cd nsfwtag-plugin && npm test

   # Processor tests
   cd nsfwtag-processor && python -m pytest
   ```

## Development Setup

### Plugin Development

The plugin is built with React and uses webpack for bundling:

```bash
cd nsfwtag-plugin

# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Lint code
npm run lint
```

### Processor Development

The processor uses FastAPI and Python async architecture:

```bash
cd nsfwtag-processor

# Install dependencies
pip install -r requirements.txt

# Run development server
python -m src.main

# Run tests
python -m pytest

# Code formatting
black src/
mypy src/
```

### Docker Development

For full-stack development with Docker:

```bash
# Build and run the processor container
docker-compose up --build

# Or build manually
cd nsfwtag-processor
docker build -t nsfwtagger-processor .
docker run -p 8000:8000 nsfwtagger-processor
```

## Development Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `release/*`: Release preparation

### Commit Convention

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

Examples:
```
feat(plugin): add real-time progress tracking
fix(processor): handle Ollama connection timeouts
docs: update installation guide
```

## Coding Standards

### JavaScript/React (Plugin)

- Use modern ES6+ features
- Follow React hooks patterns
- Use styled-components for styling
- Follow ESLint configuration
- Use meaningful component and variable names
- Add PropTypes or TypeScript for type safety
- Write comprehensive comments for complex logic

### Python (Processor)

- Follow PEP 8 style guide
- Use type hints for all function parameters and return values
- Write comprehensive docstrings
- Use async/await for I/O operations
- Handle exceptions appropriately
- Use logging instead of print statements
- Write unit tests for all modules

### General Standards

- Write clear, concise commit messages
- Keep functions small and focused
- Add tests for new features
- Update documentation for changes
- Follow security best practices
- Validate input data
- Use environment variables for configuration

## Testing

### Plugin Testing

```bash
cd nsfwtag-plugin

# Run unit tests
npm test

# Run linting
npm run lint

# Build verification
npm run build
```

### Processor Testing

```bash
cd nsfwtag-processor

# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=src

# Run specific test
python -m pytest tests/test_specific.py

# Code quality
black --check src/
mypy src/
```

### Integration Testing

```bash
# Full system test
docker-compose up -d
npm run build  # in plugin directory
# Manual testing with Stash
```

### Performance Testing

```bash
# Processor performance benchmarks
cd nsfwtag-processor
python -m pytest tests/test_performance.py

# Memory usage analysis
python -c "import src.main; print('Memory test')"
```

## Submitting Changes

### Pull Request Process

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**:
   - Follow coding standards
   - Add tests for new features
   - Update documentation
   - Ensure all tests pass

3. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and Create PR**:
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

5. **PR Requirements**:
   - Clear title and description
   - Reference related issues
   - Include screenshots for UI changes
   - Ensure CI passes
   - Request review from maintainers

### PR Review Process

- Automated checks must pass
- At least one maintainer review required
- Review feedback must be addressed
- Squash commits before merge
- Use rebase for clean history

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Title**: Clear, descriptive title
- **Description**: Detailed explanation of the issue
- **Steps to Reproduce**: Step-by-step instructions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, Node.js/Python versions, Docker version
- **Logs**: Relevant error logs or screenshots
- **Additional Context**: Any other relevant information

### Feature Requests

For feature requests, please include:

- **Title**: Clear feature name
- **Description**: Detailed explanation of the feature
- **Use Case**: Why this feature is needed
- **Implementation Ideas**: How you think it could be implemented
- **Alternatives**: Other solutions you've considered

### Security Issues

For security-related issues:

- **DO NOT** create public issues
- Email maintainers directly
- Include detailed vulnerability information
- Allow time for responsible disclosure

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community support
- **Pull Requests**: Code contributions and reviews

### Getting Help

- Check existing issues and documentation first
- Use clear, descriptive titles for new issues
- Provide sufficient context and examples
- Be patient and respectful when waiting for responses

### Recognition

Contributors are recognized through:

- GitHub contributor statistics
- Changelog entries for significant contributions
- Community shoutouts in releases
- Co-authorship opportunities for major features

## License

By contributing to NSFWTagger, you agree that your contributions will be licensed under the same MIT License that covers the project.

## Acknowledgments

Thank you to all contributors who help make NSFWTagger better! Your time and effort are greatly appreciated by the community.
