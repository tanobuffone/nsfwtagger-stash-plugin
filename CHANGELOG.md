# Changelog

All notable changes to NSFWTagger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-06

### Added
- **Complete AI-powered media tagging system** for Stash
- **Two-component architecture**: React plugin + Docker processor
- **Ollama vision model integration** with automatic fallback
- **Advanced video processing**: Intelligent frame extraction and analysis
- **Real-time progress tracking** via WebSocket
- **Comprehensive logging** and error handling
- **Batch processing** with configurable concurrency
- **Professional UI** with modern React components
- **CI/CD pipeline** with automated testing and releases
- **Multi-stage Docker build** with security best practices
- **Comprehensive documentation** and installation guides

### Features
- **Plugin Interface**: 4-button batch processing interface
  - "NSFW Tag all": Process images and videos
  - "NSFW Tag images": Process images only
  - "NSFW Tag scenes": Process videos only
  - "Test LLM provider": Validate Ollama connection
- **AI Analysis**: Vision models analyze content for:
  - People detection and description
  - Activity recognition
  - Object identification
  - Content type classification
  - Confidence scoring
- **Workflow Management**: NSFWAI-Tagme → NSFWAI_Tagged automation
- **Progress Monitoring**: Real-time updates during processing
- **Error Recovery**: Automatic fallback and retry mechanisms

### Technical Implementation
- **Plugin**: React.js with webpack build system
- **Processor**: FastAPI with async architecture
- **Models**: Qwen3-VL primary, OlmOCR fallback
- **Container**: Multi-stage Docker build with security
- **Communication**: HTTP/WebSocket between components
- **Configuration**: Environment-based settings management

### Documentation
- Complete installation and setup guide
- Usage instructions and troubleshooting
- API documentation
- Performance tuning guidelines
- Security and architecture overview

### Testing
- Automated CI/CD pipeline
- Unit and integration tests
- Docker image building and validation
- Security scanning
- Code quality checks

## [0.1.0] - 2025-12-05

### Added
- Initial project structure and architecture planning
- Basic plugin and processor component skeletons
- Configuration management system
- Documentation framework

### Changed
- Project restructured from monolithic to two-component architecture
- Removed direct Stash API dependencies
- Implemented clean separation between UI and processing logic

### Technical
- Created React plugin foundation
- Set up FastAPI processor base
- Implemented configuration management
- Added logging infrastructure
