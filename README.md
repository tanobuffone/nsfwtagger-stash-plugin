# 🤖 NSFWTagger AI Plugin for Stash

AI-powered media tagging system using Ollama vision models. Automatically analyze and tag your media content with AI-generated metadata.

## 🚀 Features

- **🤖 AI-Powered Tagging**: Uses Ollama vision models to analyze images and video frames
- **🎯 Smart Frame Extraction**: Advanced video processing with optimized frame selection
- **🔄 Batch Processing**: Process multiple items simultaneously with real-time progress tracking
- **🎨 Modern UI**: Clean, intuitive React interface integrated into Stash
- **⚡ Local Processing**: All AI processing happens locally - no cloud dependencies
- **🛡️ Secure Architecture**: Isolated Docker container with minimal attack surface
- **📊 Comprehensive Logging**: Full processing logs for debugging and monitoring

## 🏗️ Architecture

### Two-Component System

#### 🎨 **Stash Plugin** (UI Component)
- **Location**: `nsfwtag-plugin/`
- **Technology**: React.js web plugin
- **Purpose**: User interface for batch operations
- **Features**:
  - 4-button interface: "NSFW Tag all", "NSFW Tag images", "NSFW Tag scenes", "Test LLM provider"
  - Real-time progress tracking via WebSocket
  - Settings configuration for processor endpoint

#### 🐳 **Docker Processor** (AI Component)
- **Location**: `nsfwtag-processor/`
- **Technology**: Python FastAPI container
- **Purpose**: AI processing and tag management
- **Features**:
  - Ollama vision model integration
  - Frame extraction and optimization
  - Batch processing orchestration
  - NSFWAI-Tagme → NSFWAI_Tagged workflow

## 🛠️ Installation & Setup

### Prerequisites

- **Stash App**: Version 0.20+ recommended
- **Docker**: For running the processor container
- **Ollama**: Local LLM runner (http://localhost:11434)
- **Node.js**: For building the plugin (v16+)
- **Python**: For development (3.9+)

### Step 1: Install Ollama Models

```bash
# Pull the required vision models
ollama pull qwen3-vl-4b-instruct/Qwen3-VL-4B-Instruct-Q4_K_M.gguf
ollama pull olmocr-2-7b-1025/olmOCR-2-7B-1025-Q4_K_M.gguf
```

### Step 2: Build and Install Plugin

```bash
# Build the plugin
cd nsfwtag-plugin
npm install
npm run build

# Copy to Stash plugins directory
cp dist/index.js /path/to/stash/plugins/
```

### Step 3: Start Processor Container

```bash
# From project root
docker-compose up -d

# Or build manually
cd nsfwtag-processor
docker build -t nsfwtagger-processor .
docker run -p 8000:8000 nsfwtagger-processor
```

### Step 4: Configure Plugin

1. Open Stash and navigate to Settings → Plugins
2. Find "NSFWTagger AI Plugin" in the Tasks menu
3. Configure the processor endpoint (default: http://localhost:8000)
4. Test LLM connection using the "Test LLM provider" button

## 🎯 Usage

### Basic Workflow

1. **Mark Items for Processing**:
   - In Stash, add the "NSFWAI-Tagme" tag to images/scenes you want to process

2. **Start Batch Processing**:
   - Open NSFWTagger plugin in Tasks menu
   - Click "NSFW Tag all", "NSFW Tag images", or "NSFW Tag scenes"
   - Monitor progress in real-time

3. **Review Results**:
   - AI-generated tags are automatically applied
   - "NSFWAI-Tagme" tag is replaced with "NSFWAI_Tagged"
   - Check processing logs for detailed information

### Button Functions

#### 🏷️ **NSFW Tag all**
- Processes both images and video scenes
- Comprehensive batch operation
- Best for mixed media collections

#### 🖼️ **NSFW Tag images**
- Processes only image files
- Faster processing than videos
- Ideal for large image collections

#### 🎬 **NSFW Tag scenes**
- Processes only video scenes
- Advanced frame extraction and analysis
- Best for video content analysis

#### 🧠 **Test LLM provider**
- Validates Ollama connection
- Checks model availability
- Ensures system readiness before processing

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen3-vl-4b-instruct/Qwen3-VL-4B-Instruct-Q4_K_M.gguf
OLLAMA_FALLBACK_MODEL=olmocr-2-7b-1025/olmOCR-2-7B-1025-Q4_K_M.gguf
OLLAMA_TIMEOUT=300
OLLAMA_MAX_RETRIES=3

# Processing Configuration
FRAME_INTERVAL=10
MAX_FRAMES_PER_VIDEO=25
CONCURRENCY=2
BATCH_SIZE=5

# Logging
LOG_LEVEL=INFO
TEMP_DIR=/app/temp_images
LOGS_DIR=/app/logs
FRAMES_DIR=/app/frames
```

### Plugin Settings

- **Processor Endpoint**: URL of the Docker container (default: http://localhost:8000)
- **Progress Updates**: Enable/disable real-time progress tracking

## 🔍 API Endpoints

### Processor API (Port 8000)

#### Health Check
```http
GET /health
```

#### Test LLM Connection
```http
POST /api/test/llm
```

#### Batch Processing
```http
POST /api/batch/tag-all
POST /api/batch/tag-images
POST /api/batch/tag-scenes
```

#### WebSocket Progress
```websocket
ws://localhost:8000/ws/progress
```

## 📊 Processing Details

### Image Processing
- Direct analysis using vision models
- Automatic image optimization and resizing
- Base64 encoding for Ollama API
- JSON response parsing with fallback handling

### Video Processing
- Intelligent frame extraction every 10 seconds
- Maximum 25 frames per video (configurable)
- Shot detection and optimization
- Batch analysis of extracted frames
- Tag aggregation from multiple frames

### AI Analysis
- **Primary Model**: Qwen3-VL for comprehensive analysis
- **Fallback Model**: OlmOCR for text recognition
- **Analysis Categories**:
  - People (count, gender, age, appearance)
  - Activities and interactions
  - Objects and environment
  - Content type classification
  - Confidence scoring

## 🐛 Troubleshooting

### Common Issues

#### Plugin Won't Load
- Check browser console for JavaScript errors
- Ensure plugin file is in correct Stash plugins directory
- Verify webpack build completed successfully

#### Processor Connection Failed
- Confirm Docker container is running: `docker ps`
- Check container logs: `docker logs nsfwtagger-processor`
- Verify port 8000 is accessible

#### Ollama Connection Issues
- Start Ollama: `ollama serve`
- Verify models are downloaded: `ollama list`
- Check Ollama is running on port 11434

#### Processing Errors
- Check processor logs: `docker logs nsfwtagger-processor`
- Verify file permissions on media directories
- Ensure sufficient disk space for temporary files

### Log Locations

- **Plugin Logs**: Browser developer console
- **Processor Logs**: `/app/logs/nsfwtag-processor.log` (in container)
- **Docker Logs**: `docker logs nsfwtagger-processor`

### Performance Tuning

```bash
# Adjust concurrency for better performance
CONCURRENCY=4
BATCH_SIZE=10

# Reduce frame extraction for faster video processing
MAX_FRAMES_PER_VIDEO=15
FRAME_INTERVAL=15

# Increase timeouts for slower systems
OLLAMA_TIMEOUT=600
```

## 🧪 Development

### Plugin Development

```bash
cd nsfwtag-plugin
npm install
npm run dev  # Development build with watch
npm run build  # Production build
```

### Processor Development

```bash
cd nsfwtag-processor
pip install -r requirements.txt
python -m src.main
```

### Testing

```bash
# Plugin tests
cd nsfwtag-plugin
npm test

# Processor tests
cd nsfwtag-processor
pytest
```

## 📈 Performance Metrics

- **Image Processing**: < 30 seconds per image
- **Video Processing**: < 5 minutes per video (5-minute average)
- **Memory Usage**: < 4GB RAM under normal operation
- **Startup Time**: < 60 seconds (including model loading)
- **Success Rate**: > 95% processing reliability

## 🔒 Security

- **Local Processing**: All AI analysis happens locally
- **Isolated Container**: Processing in separate Docker environment
- **No External APIs**: No cloud service dependencies
- **Minimal Permissions**: Non-root container user
- **Input Validation**: Comprehensive request validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow existing code style and patterns
- Add comprehensive logging for new features
- Update documentation for API changes
- Test with multiple Stash and Ollama versions

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Stash Community**: For the amazing media management platform
- **Ollama Team**: For making local LLMs accessible
- **Qwen and OlmOCR Models**: For excellent vision capabilities

## 📞 Support

- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and support
- **Logs**: Include relevant log excerpts when reporting issues

---

**Happy tagging! 🎉**

*Automatically organize your media collection with the power of AI.*
