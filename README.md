# NSFWTagger Stash Community Plugin

A Stash community plugin that integrates with the NSFWTagger AI system for automatic media tagging using LMStudio vision models.

## Overview

This plugin provides a seamless integration between Stash and the NSFWTagger AI system, allowing users to automatically tag their media collection with AI-generated metadata, tags, and scene markers.

## Architecture

### Plugin Components

1. **Stash Plugin** - The main plugin that integrates with Stash
2. **NSFWTagger Container** - Docker container running the AI processing
3. **LMStudio** - Local AI model runner for vision models

### Data Flow

```
Stash Plugin → NSFWTagger Container → LMStudio → AI Analysis → Tags/Markers → Stash Database
```

## Features

- ✅ UI Integration with Stash plugin interface
- ✅ Batch processing of scenes and images
- ✅ LMStudio connectivity testing
- ✅ Progress tracking and status updates
- ✅ Automatic tag and marker creation
- ✅ Docker container communication
- ✅ Error handling and retry mechanisms

## Installation

### Prerequisites

1. **Stash** - Latest version with plugin support
2. **Docker** - For running NSFWTagger container
3. **LMStudio** - Latest version with vision models

### Setup

1. **Start NSFWTagger Container**
   ```bash
   cd nsfwtag
   docker-compose up -d
   ```

2. **Install Vision Model in LMStudio**
   - Open LMStudio
   - Download Qwen VL or Llama Vision
   - Load the model
   - Enable Local Server on port 1234

3. **Install Stash Plugin**
   - Copy plugin files to Stash plugins directory
   - Restart Stash
   - Plugin will appear in Stash interface

## Usage

### 1. Plugin Interface

The plugin provides a user-friendly interface within Stash:

- **Dashboard**: Overview of processing status
- **Settings**: Configure NSFWTagger connection
- **Batch Processing**: Select and process media items
- **Progress Tracking**: Monitor AI analysis progress
- **Results**: View generated tags and markers

### 2. Processing Modes

- **Selected Items**: Process only selected scenes/images
- **Untagged Only**: Process items without AI tags
- **Recent Items**: Process items from last N days
- **All Items**: Process entire library (use with limit)

### 3. Configuration

Configure the plugin to connect to your NSFWTagger container:

```json
{
  "nsfwtagger_host": "localhost",
  "nsfwtagger_port": 8000,
  "lmstudio_host": "localhost", 
  "lmstudio_port": 1234,
  "processing_mode": "untagged",
  "concurrency": 4,
  "batch_size": 10
}
```

## Technical Details

### Communication Protocol

The plugin communicates with the NSFWTagger container via HTTP API:

- **Health Check**: `GET /health`
- **Process Scene**: `POST /process/scene`
- **Process Image**: `POST /process/image`
- **Get Status**: `GET /status`
- **Cancel Processing**: `POST /cancel`

### Data Structures

#### Scene Processing Request
```json
{
  "scene_id": "scene_123",
  "options": {
    "frame_interval": 5,
    "max_frames": 50,
    "shot_detection": true
  }
}
```

#### Image Processing Request
```json
{
  "image_id": "image_123",
  "options": {
    "quality": "high"
  }
}
```

#### Processing Response
```json
{
  "success": true,
  "tags": ["tag1", "tag2", "tag3"],
  "markers": [
    {
      "seconds": 120.5,
      "title": "Scene marker",
      "description": "AI-generated description"
    }
  ],
  "processing_time": 45.2
}
```

### Error Handling

The plugin includes comprehensive error handling:

- **Container Connection Errors**: Retry with exponential backoff
- **LMStudio Connection Errors**: Fallback to local processing
- **Processing Errors**: Detailed error reporting
- **Timeout Handling**: Graceful timeout management
- **Validation Errors**: Input validation and user feedback

## Development

### Plugin Structure

```
stash_plugin/
├── plugin.json              # Plugin manifest
├── ui/                      # React/Vue components
│   ├── Dashboard.jsx
│   ├── Settings.jsx
│   ├── BatchProcessor.jsx
│   └── ProgressTracker.jsx
├── api/                     # API integration
│   ├── nsfwtagger-client.js
│   ├── stash-client.js
│   └── error-handler.js
├── utils/                   # Utility functions
│   ├── validators.js
│   ├── formatters.js
│   └── helpers.js
└── README.md
```

### Building the Plugin

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build Plugin**
   ```bash
   npm run build
   ```

3. **Test Plugin**
   ```bash
   npm test
   ```

### Testing

The plugin includes comprehensive tests:

- **Unit Tests**: Individual component testing
- **Integration Tests**: API communication testing
- **End-to-End Tests**: Full workflow testing
- **Error Scenario Tests**: Error handling validation

## Troubleshooting

### Common Issues

#### Plugin Not Loading
- Check Stash plugin directory permissions
- Verify plugin.json syntax
- Check Stash logs for errors

#### Container Connection Failed
- Verify NSFWTagger container is running
- Check network connectivity
- Verify port configuration

#### LMStudio Connection Failed
- Verify LMStudio is running
- Check model is loaded
- Verify Local Server is enabled

#### Processing Errors
- Check frame extraction permissions
- Verify disk space
- Check AI model availability

### Debug Mode

Enable debug mode for detailed logging:

```json
{
  "debug": true,
  "log_level": "DEBUG"
}
```

### Logs

Plugin logs are available in:
- Stash plugin logs directory
- Browser console (for UI issues)
- NSFWTagger container logs

## Performance Optimization

### Batch Processing
- Configure optimal batch size based on system resources
- Use concurrency settings for parallel processing
- Monitor memory usage during processing

### Frame Extraction
- Adjust frame interval for quality vs speed
- Use shot detection for better frame selection
- Configure cache settings for performance

### AI Processing
- Choose appropriate model size for your hardware
- Configure timeout settings
- Monitor GPU/CPU usage

## Security

### Data Privacy
- All processing happens locally
- No data leaves your system
- Secure API communication

### Best Practices
- Use strong API keys
- Regular security updates
- Monitor access logs
- Backup configuration regularly

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd nsfwtagger-stash-plugin

# Install dependencies
npm install

# Start development server
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

### Getting Help

1. **📚 Read Documentation**: Start with this README
2. **🔍 Check Logs**: Review plugin and container logs
3. **✅ Run Validation**: Use built-in validation tools
4. **❓ Search Issues**: Check [GitHub Issues](https://github.com/your-repo/nsfwtagger-stash-plugin/issues)
5. **💬 Ask for Help**: Create a new issue with details

### Support Resources

- **[Plugin Documentation](docs/)** - Detailed plugin documentation
- **[API Reference](docs/api.md)** - API integration details
- **[Troubleshooting Guide](docs/troubleshooting.md)** - Common issues and solutions
- **[GitHub Discussions](https://github.com/your-repo/nsfwtagger-stash-plugin/discussions)** - Community support

### When Asking for Help

Please provide:
- ✅ Stash version and plugin version
- ✅ NSFWTagger container version
- ✅ LMStudio version and model
- ✅ Error messages and logs
- ✅ Configuration (remove sensitive info)
- ✅ Steps to reproduce the issue

## Roadmap

### Phase 1: Core Features ✅
- [x] Basic plugin integration
- [x] Container communication
- [x] UI interface
- [x] Batch processing

### Phase 2: Enhanced Features 🚧
- [ ] Advanced UI components
- [ ] Real-time progress updates
- [ ] Custom tag templates
- [ ] Performance monitoring

### Phase 3: Enterprise Features 📋
- [ ] Multi-user support
- [ ] Advanced security features
- [ ] Plugin marketplace integration
- [ ] Professional support

## Acknowledgments

- **[Stash Community](https://discourse.stashapp.cc/)** - For the excellent platform and support
- **[LMStudio](https://lmstudio.ai/)** - For the powerful local AI model runner
- **[NSFWTagger Team](https://github.com/your-repo/nsfwtagger)** - For the AI processing system

---

**Happy Tagging!** 🤖✨

*For the latest updates, documentation, and support, please visit our [GitHub repository](https://github.com/your-repo/nsfwtagger-stash-plugin).*
