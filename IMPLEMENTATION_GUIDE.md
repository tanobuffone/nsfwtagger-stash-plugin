# NSFWTagger Stash Plugin - Implementation Guide

## Complete Plugin Architecture and Implementation Guide

This guide provides comprehensive documentation for implementing the NSFWTagger Stash community plugin.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Plugin Structure](#plugin-structure)
3. [API Integration](#api-integration)
4. [UI Components](#ui-components)
5. [Data Flow](#data-flow)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Stash Plugin Interface                    │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │ BatchProcessor │ Settings │ ProgressTracker  │
├─────────────────────────────────────────────────────────────┤
│                    API Integration Layer                    │
├─────────────────────────────────────────────────────────────┤
│  StashClient  │ NSFWTaggerClient  │ ErrorHandler  │ Utils   │
├─────────────────────────────────────────────────────────────┤
│                    Docker Container                         │
├─────────────────────────────────────────────────────────────┤
│                    LMStudio Server                          │
└─────────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **Plugin Initialization**
   - Load plugin manifest (`plugin.json`)
   - Initialize API clients
   - Check service health

2. **User Interaction**
   - User selects processing mode
   - Plugin fetches items from Stash
   - User selects items to process

3. **Processing Workflow**
   - Plugin sends requests to NSFWTagger container
   - Container processes media with LMStudio
   - Results applied to Stash database

4. **Error Handling**
   - Comprehensive error detection
   - Retry logic with exponential backoff
   - User-friendly error messages

## Plugin Structure

### File Organization

```
stash_plugin/
├── plugin.json                    # Plugin manifest
├── README.md                      # Plugin documentation
├── IMPLEMENTATION_GUIDE.md        # This file
├── api/                           # API integration layer
│   ├── stash_client.js           # Stash GraphQL client
│   ├── nsfwtagger_client.js      # NSFWTagger container client
│   ├── error-handler.js          # Error handling utilities
│   └── utils.js                  # Utility functions
├── ui/                           # React components
│   ├── Dashboard.jsx             # Main dashboard
│   ├── BatchProcessor.jsx        # Batch processing interface
│   ├── Settings.jsx              # Plugin settings
│   └── ProgressTracker.jsx       # Progress tracking
├── utils/                        # Utility functions
│   ├── validators.js             # Input validation
│   ├── formatters.js             # Data formatting
│   └── helpers.js                # Helper functions
└── docs/                         # Additional documentation
    ├── API_REFERENCE.md          # API documentation
    ├── TROUBLESHOOTING.md        # Troubleshooting guide
    └── BEST_PRACTICES.md         # Best practices
```

### Plugin Manifest (`plugin.json`)

The plugin manifest defines:
- Plugin metadata (name, version, author)
- API endpoints and permissions
- UI components and menu items
- Configuration schema
- Dependencies and compatibility
- Security settings

**Key Sections:**
- `stax`: Stash compatibility requirements
- `plugin.api.endpoints`: Available API endpoints
- `plugin.ui.components`: UI component definitions
- `plugin.configuration`: Configuration schema
- `plugin.dependencies`: Required services

## API Integration

### Stash GraphQL Client

**File:** `api/stash_client.js`

**Key Features:**
- GraphQL query execution
- Scene and image operations
- Tag and marker management
- Health checking
- Error handling

**Core Methods:**
```javascript
// Scene operations
getScene(sceneId)
getAllScenes(limit, page)
getUntaggedScenes(limit, page)
getRecentScenes(days, limit, page)

// Image operations
getImage(imageId)
getAllImages(limit, page)
getUntaggedImages(limit, page)
getRecentImages(days, limit, page)

// Tag management
createTagIfNotExists(tagName)
addTagsToScene(sceneId, tagIds)
addTagsToImage(imageId, tagIds)

// Marker operations
createSceneMarker(sceneId, title, seconds, tagNames)
```

### NSFWTagger Container Client

**File:** `api/nsfwtagger_client.js`

**Key Features:**
- HTTP API communication
- Retry logic with exponential backoff
- Progress tracking
- Health monitoring
- Configuration management

**Core Methods:**
```javascript
// Health and status
healthCheck()
testLMStudioConnection()
validateConnection()

// Processing operations
processScene(sceneId, options)
processImage(imageId, options)
processBatch(items, options)

// System management
getSystemInfo()
getMetrics()
getLogs(level, limit)

// Configuration
getConfig()
updateConfig(config)
getSettings()
updateSettings(settings)
```

### Error Handler

**File:** `api/error-handler.js`

**Key Features:**
- Comprehensive error handling
- Retry logic with exponential backoff
- User-friendly error messages
- Error categorization
- Logging and debugging

**Error Types:**
- Network errors (connection, timeout)
- API errors (HTTP status codes)
- Validation errors (input validation)
- Processing errors (AI processing failures)
- Permission errors (access denied)

## UI Components

### Dashboard Component

**File:** `ui/Dashboard.jsx`

**Features:**
- Service health monitoring
- Quick action buttons
- Processing metrics
- Recent activity feed
- Status indicators

**Key States:**
```javascript
{
  status: {
    plugin: 'healthy|error|warning',
    stash: 'healthy|error|warning', 
    container: 'healthy|error|warning',
    lmstudio: 'healthy|error|warning'
  },
  metrics: {
    totalScenes, processedScenes, pendingScenes,
    totalImages, processedImages, pendingImages
  },
  recentActivity: [...]
}
```

### Batch Processor Component

**File:** `ui/BatchProcessor.jsx`

**Features:**
- Item selection and filtering
- Batch processing orchestration
- Progress tracking
- Error reporting
- Results display

**Processing Modes:**
- **Untagged Only**: Process items without AI tags
- **Recent Items**: Process items from last N days
- **All Items**: Process entire library

**Item Types:**
- **Scenes**: Video content processing
- **Images**: Image content processing

## Data Flow

### Processing Workflow

1. **Item Selection**
   ```javascript
   // User selects mode and type
   const items = await this.stashClient.getUntaggedScenes(limit, page);
   
   // User selects specific items
   const selectedItems = this.state.selectedItems;
   ```

2. **Processing Request**
   ```javascript
   // Send to NSFWTagger container
   const result = await this.nsfwClient.processSceneWithRetry(
     itemId, 
     options
   );
   ```

3. **Result Processing**
   ```javascript
   // Create tags in Stash
   for (const tagName of result.tags) {
     const tagId = await this.stashClient.createTagIfNotExists(tagName);
     await this.stashClient.addTagsToScene(itemId, [tagId]);
   }
   
   // Create markers (scenes only)
   for (const marker of result.markers) {
     await this.stashClient.createSceneMarker(
       itemId, marker.title, marker.seconds, marker.tags
     );
   }
   ```

### Data Structures

#### Scene Processing Request
```javascript
{
  scene_id: "scene_123",
  options: {
    frame_interval: 5,      // seconds between frames
    max_frames: 50,         // maximum frames to extract
    shot_detection: true    // enable shot detection
  }
}
```

#### Image Processing Request
```javascript
{
  image_id: "image_123",
  options: {
    quality: "high"         // processing quality
  }
}
```

#### Processing Response
```javascript
{
  success: true,
  tags: ["tag1", "tag2", "tag3"],
  markers: [
    {
      seconds: 120.5,
      title: "Scene marker",
      description: "AI-generated description",
      tags: ["tag1", "tag2"]
    }
  ],
  processing_time: 45.2,
  error: null
}
```

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection refused
   - Timeout
   - Network unreachable
   - Connection reset

2. **API Errors**
   - HTTP 4xx (client errors)
   - HTTP 5xx (server errors)
   - GraphQL errors

3. **Processing Errors**
   - Frame extraction failures
   - AI model errors
   - Tag creation failures

4. **Validation Errors**
   - Invalid input data
   - Missing required fields
   - Type mismatches

### Retry Strategy

**Exponential Backoff with Jitter:**
```javascript
const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
```

**Retry Conditions:**
- Network errors
- Server errors (5xx)
- Timeout errors
- Connection errors

**Non-Retryable Errors:**
- Authentication errors (401)
- Permission errors (403)
- Not found errors (404)
- Validation errors (400)

### Error Response Format

```javascript
{
  success: false,
  error: {
    message: "User-friendly error message",
    code: "ERROR_CODE",
    source: "stash|container|processing|network",
    operation: "operation_name",
    details: {
      // Additional error details
    },
    timestamp: "2024-01-01T00:00:00.000Z"
  }
}
```

## Testing

### Unit Tests

**Test Structure:**
```
tests/
├── api/
│   ├── stash_client.test.js
│   ├── nsfwtagger_client.test.js
│   └── error_handler.test.js
├── ui/
│   ├── dashboard.test.jsx
│   └── batch_processor.test.jsx
└── integration/
    └── end_to_end.test.js
```

**Test Coverage:**
- API client methods
- Error handling scenarios
- UI component rendering
- User interactions
- Data validation

### Integration Tests

**Test Scenarios:**
1. **Full Processing Workflow**
   - Item selection
   - Processing execution
   - Result application
   - Error handling

2. **Service Health Checks**
   - Stash connection
   - Container connection
   - LMStudio connection

3. **Error Recovery**
   - Network failures
   - Service unavailability
   - Invalid responses

### Mocking Strategy

**API Mocking:**
```javascript
// Mock Stash GraphQL responses
jest.mock('./api/stash_client', () => ({
  StashClient: jest.fn().mockImplementation(() => ({
    healthCheck: jest.fn().mockResolvedValue({ connected: true }),
    getUntaggedScenes: jest.fn().mockResolvedValue({ scenes: [], count: 0 })
  }))
}));

// Mock NSFWTagger responses
jest.mock('./api/nsfwtagger_client', () => ({
  NSFWTaggerClient: jest.fn().mockImplementation(() => ({
    healthCheck: jest.fn().mockResolvedValue({ healthy: true }),
    processScene: jest.fn().mockResolvedValue({ success: true, result: {} })
  }))
}));
```

## Deployment

### Prerequisites

1. **Stash Installation**
   - Latest version with plugin support
   - GraphQL API enabled
   - API key configured

2. **Docker Setup**
   - Docker installed and running
   - NSFWTagger container running
   - Port 8000 accessible

3. **LMStudio Setup**
   - LMStudio installed
   - Vision model loaded
   - Local server enabled on port 1234

### Installation Steps

1. **Build Plugin**
   ```bash
   cd nsfwtag/stash_plugin
   npm install
   npm run build
   ```

2. **Install Plugin**
   - Copy plugin files to Stash plugins directory
   - Restart Stash
   - Plugin appears in Stash interface

3. **Configure Plugin**
   - Open plugin settings
   - Configure NSFWTagger connection
   - Configure LMStudio connection
   - Test connections

4. **Start Processing**
   - Navigate to Dashboard
   - Check service health
   - Start batch processing

### Configuration

**Environment Variables:**
```bash
# Stash configuration
STASH_ENDPOINT=http://localhost:9999
STASH_API_KEY=your_api_key

# NSFWTagger configuration
NSFWTAGGER_HOST=localhost
NSFWTAGGER_PORT=8000
NSFWTAGGER_TIMEOUT=300

# LMStudio configuration
LMSTUDIO_HOST=localhost
LMSTUDIO_PORT=1234
```

**Plugin Settings:**
```json
{
  "nsfwtagger": {
    "host": "localhost",
    "port": 8000,
    "timeout": 300
  },
  "lmstudio": {
    "host": "localhost", 
    "port": 1234
  },
  "processing": {
    "mode": "untagged",
    "concurrency": 4,
    "batch_size": 10,
    "frame_interval": 5,
    "max_frames": 50
  }
}
```

## Troubleshooting

### Common Issues

#### Plugin Not Loading
**Symptoms:**
- Plugin doesn't appear in Stash
- Error in Stash logs

**Solutions:**
1. Check plugin.json syntax
2. Verify file permissions
3. Check Stash plugin directory
4. Review Stash logs for errors

#### Container Connection Failed
**Symptoms:**
- Health check fails
- Processing errors
- Timeout messages

**Solutions:**
1. Verify Docker is running
2. Check container status: `docker ps`
3. Verify port configuration
4. Check firewall settings
5. Test connection manually

#### LMStudio Connection Failed
**Symptoms:**
- AI processing fails
- Model loading errors
- Timeout messages

**Solutions:**
1. Verify LMStudio is running
2. Check model is loaded
3. Verify Local Server is enabled
4. Check port 1234 accessibility
5. Test LMStudio API manually

#### Processing Errors
**Symptoms:**
- Frame extraction fails
- AI analysis fails
- Tag creation fails

**Solutions:**
1. Check file permissions
2. Verify disk space
3. Check model availability
4. Review processing logs
5. Try different processing options

### Debug Mode

**Enable Debug Mode:**
```json
{
  "debug": true,
  "log_level": "DEBUG"
}
```

**Debug Information:**
- Detailed API logs
- Processing step logs
- Error stack traces
- Performance metrics

### Log Locations

**Stash Plugin Logs:**
- Stash plugin logs directory
- Browser console (UI issues)

**NSFWTagger Container Logs:**
```bash
docker logs nsfwtagger
```

**LMStudio Logs:**
- LMStudio application logs
- Local server logs

## Best Practices

### Performance Optimization

1. **Batch Processing**
   - Configure optimal batch size
   - Use appropriate concurrency
   - Monitor memory usage

2. **Frame Extraction**
   - Adjust frame interval for quality vs speed
   - Use shot detection for better selection
   - Configure cache settings

3. **AI Processing**
   - Choose appropriate model size
   - Configure timeout settings
   - Monitor GPU/CPU usage

### Security

1. **Data Privacy**
   - All processing happens locally
   - No data leaves your system
   - Secure API communication

2. **Access Control**
   - Use strong API keys
   - Regular security updates
   - Monitor access logs

3. **Configuration Security**
   - Don't expose sensitive information
   - Use environment variables
   - Regular backup of configuration

### Monitoring

1. **Health Monitoring**
   - Regular health checks
   - Service status monitoring
   - Performance metrics tracking

2. **Error Monitoring**
   - Error rate tracking
   - Error pattern analysis
   - User impact assessment

3. **Usage Monitoring**
   - Processing statistics
   - User activity tracking
   - Resource utilization

### Maintenance

1. **Regular Updates**
   - Update plugin dependencies
   - Update Stash version
   - Update LMStudio version

2. **Log Management**
   - Regular log rotation
   - Log analysis
   - Error trend monitoring

3. **Backup and Recovery**
   - Configuration backup
   - Plugin state backup
   - Recovery procedures

## Conclusion

This implementation guide provides comprehensive documentation for the NSFWTagger Stash plugin. The plugin architecture is designed for:

- **Reliability**: Comprehensive error handling and retry logic
- **Performance**: Optimized batch processing and caching
- **User Experience**: Intuitive UI and clear error messages
- **Maintainability**: Well-structured code and comprehensive documentation

For additional support, please refer to:
- [Plugin README](README.md)
- [API Documentation](docs/API_REFERENCE.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [GitHub Issues](https://github.com/your-repo/nsfwtagger-stash-plugin/issues)

---

**Happy Tagging!** 🤖✨
