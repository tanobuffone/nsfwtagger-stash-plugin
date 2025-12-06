# Security Policy

## Supported Versions

NSFWTagger follows semantic versioning and provides security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in NSFWTagger, please report it responsibly.

### How to Report

**DO NOT create a public GitHub issue for security vulnerabilities.**

Instead, please report security issues by emailing:
- **security@nsfwtagger.dev** (placeholder - replace with actual contact)

### What to Include

When reporting a security vulnerability, please include:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity assessment
- Any suggested fixes or mitigations
- Your contact information for follow-up

### Response Timeline

We will acknowledge receipt of your report within 48 hours and provide a more detailed response within 7 days indicating our next steps.

We will keep you informed about our progress throughout the process of fixing the vulnerability.

## Security Considerations

### Architecture Security

NSFWTagger is designed with security in mind:

#### Isolated Processing
- AI processing occurs in a separate Docker container
- No direct access to Stash database from processor
- Plugin communicates with processor via HTTP/WebSocket only

#### Local AI Processing
- All AI analysis happens locally using Ollama
- No data sent to external cloud services
- Models run on user's hardware

#### Container Security
- Multi-stage Docker build minimizes attack surface
- Non-root user execution
- Minimal runtime dependencies

### Data Handling

#### Input Validation
- All API inputs are validated using Pydantic models
- File paths are sanitized and validated
- Image data is processed in memory without persistent storage

#### Error Handling
- Sensitive information is not logged
- Error messages do not expose internal system details
- Graceful failure handling prevents information disclosure

### Network Security

#### Local Communication
- Plugin and processor communicate over localhost only
- No external network access required
- WebSocket connections are validated

#### API Security
- RESTful API with proper HTTP methods
- Input validation on all endpoints
- Timeout handling prevents resource exhaustion

## Security Best Practices

### For Users

1. **Keep Dependencies Updated**
   ```bash
   # Update plugin dependencies
   cd nsfwtag-plugin && npm update

   # Update processor dependencies
   cd nsfwtag-processor && pip install -r requirements.txt --upgrade
   ```

2. **Regular Ollama Updates**
   ```bash
   # Update Ollama
   ollama pull qwen3-vl-4b-instruct/Qwen3-VL-4B-Instruct-Q4_K_M.gguf
   ollama pull olmocr-2-7b-1025/olmOCR-2-7B-1025-Q4_K_M.gguf
   ```

3. **Secure Configuration**
   - Use strong, unique passwords if required
   - Keep configuration files secure
   - Regularly audit access logs

### For Developers

1. **Code Review Requirements**
   - All changes require review before merge
   - Security-focused code review checklist
   - Automated security scanning in CI/CD

2. **Dependency Management**
   - Regular dependency updates
   - Automated vulnerability scanning
   - Minimal dependency footprint

3. **Testing Security**
   - Input validation testing
   - Authentication/authorization testing
   - Data exposure testing

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked in:

- [CHANGELOG.md](CHANGELOG.md) with security advisory notes
- GitHub Security Advisories
- Release notes with impact assessment

### Update Instructions

For security updates:

```bash
# Update plugin
cd nsfwtag-plugin
git pull
npm install
npm run build
cp dist/index.js /path/to/stash/plugins/

# Update processor
cd nsfwtag-processor
git pull
docker-compose down
docker-compose pull
docker-compose up -d
```

## Known Security Considerations

### Current Limitations

1. **Local Network Exposure**
   - Processor API is accessible on localhost:8000
   - Consider firewall rules if running on shared systems

2. **Model Security**
   - AI models may have biases or unexpected behaviors
   - User discretion advised for sensitive content

3. **Log Data**
   - Processing logs may contain file paths
   - Logs are stored locally and should be monitored

### Future Security Enhancements

- API authentication tokens
- Encrypted WebSocket communication
- Advanced input sanitization
- Regular security audits
- Penetration testing

## Compliance

NSFWTagger is designed to comply with:

- **Local Data Processing**: All processing occurs on user hardware
- **User Privacy**: No data collection or transmission
- **Open Source Security**: Transparent codebase for community review
- **Container Security**: Following Docker security best practices

## Contact

For security-related questions or concerns:

- **General Security Questions**: Create a GitHub Discussion
- **Security Vulnerabilities**: Email security@nsfwtagger.dev
- **General Support**: GitHub Issues

Thank you for helping keep NSFWTagger secure!
