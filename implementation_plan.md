# NSFWTagger AI Plugin - Implementation Plan

## Overview

This implementation plan outlines the complete restructuring and simplification of the NSFWTagger project to create a clean, maintainable AI-powered media tagging system for Stash. The new architecture focuses on simplicity, reliability, and separation of concerns.

### Key Objectives
- **Simplified Architecture**: Two-component system (UI plugin + Docker processor)
- **Ollama Integration**: Direct Ollama API usage with specific models
- **Clean Tag Workflow**: NSFWAI-Tagme → NSFWAI_Tagged replacement system
- **No Stash API Calls**: Plugin provides only UI, processing in isolated container
- **Comprehensive Logging**: Full batch processing logs for debugging
- **Repository Management**: GitHub repository with CI/CD and community support

## Project Structure

```
host-d/nsfwtag/
├── .cursorrules              # Project development rules
├── .env                      # Simplified Ollama configuration
├── docker-compose.yml        # Single service for processor
├── implementation_plan.md    # This detailed plan
├── README.md                 # Updated documentation
├── nsfwtag-plugin/           # Stash UI plugin
│   ├── src/
│   │   ├── components/
│   │   │   ├── BatchProcessor.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ProgressTracker.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   ├── plugin.yaml           # Simplified plugin config
│   └── package.json
└── nsfwtag-processor/        # Docker container
    ├── src/
    │   ├── frame_extractor.py
    │   ├── ollama_client.py
    │   ├── tag_processor.py
    │   ├── stash_client.py   # Simplified, no API calls
    │   └── main.py
    ├── Dockerfile
    ├── requirements.txt
    └── config.py
```

## Workflow Architecture

### Stash Plugin Component
**Purpose**: Provide user interface for batch operations
**Technology**: React.js web plugin for Stash
**Features**:
- 4-button interface: "NSFW Tag all", "NSFW Tag images", "NSFW Tag scenes", "Test LLM provider"
- Progress tracking and status display
- Settings configuration for container endpoint
- No direct Stash API calls

### Docker Processor Component
**Purpose**: Handle AI processing and tag management
**Technology**: Python container with Ollama integration
**Features**:
- Automated model loading (qwen3-vl-4b-instruct primary, olmocr-2-7b fallback)
- Frame extraction and optimization
- Tag generation via Ollama vision models
- NSFWAI-Tagme → NSFWAI_Tagged workflow

## Implementation Phases

### Phase 1: Project Cleanup (Complete)
- ✅ Remove obsolete directories (ai_tagger/, stash_plugin/, nsfwtagger/, etc.)
- ✅ Clean up redundant files and configurations
- ✅ Create .cursorrules for development guidelines

### Phase 2: Stash Plugin Development ✅ COMPLETED
- [x] Create React plugin with 4-button interface
- [x] Implement container communication via HTTP/WebSocket
- [x] Add progress tracking components with real-time updates
- [x] Create simplified plugin.yaml configuration
- [x] Build system with webpack and proper dependencies
- [x] Plugin entry point with Stash PluginApi integration

### Phase 3: Docker Processor Development ✅ COMPLETED
- [x] Build FastAPI server with async architecture
- [x] Implement Ollama client with vision model support
- [x] Create frame extraction system for video processing
- [x] Add comprehensive logging and monitoring
- [x] WebSocket support for real-time progress updates
- [x] Health checks and model management
- [x] Multi-stage Dockerfile with security best practices

### Phase 4: Integration & Testing ✅ SUBSTANTIALLY COMPLETED
- [x] Connect plugin UI to Docker processor via HTTP/WebSocket
- [x] Implement NSFWAI-Tagme discovery using Stash GraphQL API
- [x] Create actual AI analysis workflow (frame extraction → Ollama analysis → tag generation)
- [x] Add comprehensive error handling and progress tracking
- [x] Implement real-time progress updates via WebSocket
- [ ] Complete end-to-end tag application workflow
- [ ] Add performance optimization and benchmarking

### Phase 5: Repository Setup ✅ COMPLETED
- [x] Create GitHub repository structure with .github/workflows
- [x] Set up CI/CD pipelines (ci.yml, release.yml)
- [x] Write comprehensive documentation (README, CONTRIBUTING, SECURITY, CHANGELOG)
- [x] Create release automation with Docker image publishing
- [x] Add MIT license and community guidelines
- [x] Configure automated changelog generation

### Phase 6: Launch & Maintenance ✅ COMPLETED
- [x] Initial release (v1.0.0) - Release package and build scripts ready
- [x] Community engagement framework - Templates, guidelines, and feedback collection
- [x] Regular maintenance framework - CI/CD, security scanning, dependency updates
- [x] Feature development roadmap - Comprehensive roadmap and planning documents

## Technology Stack

### Required Tools
- **Ollama**: Local LLM runner (http://localhost:11434)
- **Docker**: Containerized processing environment
- **Python 3.9+**: Processor logic and utilities
- **React**: Plugin user interface
- **Node.js**: Plugin build system

### Models Configuration
- **Primary Model**: qwen3-vl-4b-instruct/Qwen3-VL-4B-Instruct-Q4_K_M.gguf
- **Fallback Model**: olmocr-2-7b-1025/olmOCR-2-7B-1025-Q4_K_M.gguf
- **Auto-loading**: Models loaded automatically on startup
- **Health Checks**: Connection validation before processing

## Tag Management System

### Workflow Process
1. **Marking Phase** (Plugin): User clicks buttons to mark items with "NSFWAI-Tagme"
2. **Discovery Phase** (Processor): Find all items tagged with "NSFWAI-Tagme"
3. **Processing Phase** (Processor): Extract frames/images and send to Ollama
4. **Tagging Phase** (Processor): Apply AI-generated tags to items
5. **Cleanup Phase** (Processor): Replace "NSFWAI-Tagme" with "NSFWAI_Tagged"

### Tag Categories
- **System Tags**: NSFWAI-Tagme, NSFWAI_Tagged
- **AI-Generated Tags**: Content-based tags from vision analysis
- **Category Tags**: people, activities, objects, scenes, etc.

## Configuration Management

### Environment Variables (.env)
```bash
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen3-vl-4b-instruct/Qwen3-VL-4B-Instruct-Q4_K_M.gguf
OLLAMA_FALLBACK_MODEL=olmocr-2-7b-1025/olmOCR-2-7B-1025-Q4_K_M.gguf

# Processing Configuration
FRAME_INTERVAL=10
MAX_FRAMES_PER_VIDEO=25
CONCURRENCY=2
BATCH_SIZE=5

# Logging
LOG_LEVEL=INFO
```

### Plugin Configuration
- Container endpoint only (http://localhost:8000)
- No complex nested configurations
- Settings stored in Stash plugin storage

## Logging & Monitoring

### Log Levels
- **DEBUG**: Detailed processing information
- **INFO**: General progress and completion
- **WARNING**: Non-critical issues and fallbacks
- **ERROR**: Failures requiring attention

### Log Content
- Processing timestamps and duration
- Frame counts and processing statistics
- Model usage and performance metrics
- Error context and recovery attempts
- Batch progress and completion status

## Error Handling & Recovery

### Processor Resilience
- Automatic fallback to secondary model
- Retry logic for transient failures
- Graceful degradation on errors
- Comprehensive error logging

### Plugin Reliability
- Connection validation before operations
- Progress preservation on interruptions
- User feedback for all error states
- Recovery suggestions in logs

## Repository Management

### GitHub Repository: https://github.com/tanobuffone/nsfwtagger-stash-plugin

#### Repository Structure
```
nsfwtagger-stash-plugin/
├── .github/workflows/
│   ├── ci.yml
│   ├── release.yml
│   └── docker.yml
├── docs/
│   ├── installation.md
│   ├── configuration.md
│   └── troubleshooting.md
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   └── release.sh
├── nsfwtag-plugin/
├── nsfwtag-processor/
├── docker-compose.yml
├── implementation_plan.md
├── README.md
├── CHANGELOG.md
└── LICENSE
```

#### CI/CD Pipeline
- Automated testing on PRs
- Docker image building
- Release automation with semantic versioning
- Security scanning and vulnerability checks

#### Community Management
- Issue templates for bugs and features
- Pull request templates
- Contributing guidelines
- Release notes and changelogs
- Community support channels

## Development Guidelines

### Code Standards
- **Python**: PEP 8 compliance, type hints, comprehensive docstrings
- **JavaScript/React**: ESLint, modern ES6+ features, component composition
- **Docker**: Multi-stage builds, security best practices, minimal images

### Testing Strategy
- **Unit Tests**: Component and function testing
- **Integration Tests**: End-to-end workflow validation
- **Performance Tests**: Processing speed and resource usage
- **Compatibility Tests**: Multiple Stash and Ollama versions

### Documentation Requirements
- **Code Documentation**: Inline comments and docstrings
- **API Documentation**: OpenAPI specifications for endpoints
- **User Documentation**: Installation, configuration, troubleshooting
- **Architecture Documentation**: System design and component interactions

## Success Metrics

### Technical Metrics
- **Processing Speed**: < 5 minutes per video, < 30 seconds per image
- **Reliability**: > 95% successful processing rate
- **Resource Usage**: < 4GB RAM, efficient CPU utilization
- **Model Loading**: < 60 seconds startup time

### User Experience Metrics
- **Plugin Loading**: Instant loading in Stash interface
- **UI Responsiveness**: Real-time progress updates
- **Error Recovery**: Clear error messages and recovery options
- **Documentation Quality**: Self-service resolution rate > 80%

## Risk Mitigation

### Technical Risks
- **Ollama Compatibility**: Regular testing with new versions
- **Model Availability**: Fallback model system
- **Resource Constraints**: Memory and CPU monitoring
- **Network Issues**: Connection retry and timeout handling

### Operational Risks
- **Plugin Conflicts**: Isolated container architecture
- **Data Loss**: Backup and recovery procedures
- **Security Issues**: Regular dependency updates and scans
- **Community Issues**: Clear support channels and documentation

## Future Enhancements

### Phase 2 Features (Post v1.0)
- Advanced shot detection algorithms
- Custom model support
- Batch queue management
- Performance analytics dashboard
- Plugin marketplace integration

### Phase 3 Features (v2.0)
- GPU acceleration support
- Distributed processing
- Advanced AI model fine-tuning
- Multi-language support
- Cloud integration options

---

**Implementation Status**: Phase 1 Complete - Project cleanup finished, beginning Phase 2 development.
**Repository**: https://github.com/tanobuffone/nsfwtagger-stash-plugin
**Version**: Planning for v1.0.0 release
