#!/bin/bash

# NSFWTagger Build Script
# Handles building both plugin and processor components

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔨 Building NSFWTagger v1.0.0"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+."
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi

    # Check Python
    if ! command -v python &> /dev/null; then
        print_error "Python is not installed. Please install Python 3.9+."
        exit 1
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker."
        exit 1
    fi

    print_success "All dependencies are available"
}

# Build the Stash plugin
build_plugin() {
    print_status "Building Stash plugin..."

    cd "$PROJECT_ROOT/nsfwtag-plugin"

    # Install dependencies
    npm ci

    # Lint code
    if npm run lint 2>/dev/null; then
        print_success "Plugin linting passed"
    else
        print_warning "Plugin linting failed, but continuing..."
    fi

    # Build production version
    npm run build

    # Verify build output
    if [ -f "dist/index.js" ]; then
        BUILD_SIZE=$(stat -f%z dist/index.js 2>/dev/null || stat -c%s dist/index.js 2>/dev/null || echo "unknown")
        print_success "Plugin built successfully (size: ${BUILD_SIZE} bytes)"
    else
        print_error "Plugin build failed - dist/index.js not found"
        exit 1
    fi
}

# Build the processor Docker image
build_processor() {
    print_status "Building processor Docker image..."

    cd "$PROJECT_ROOT"

    # Build Docker image
    docker build -t nsfwtagger-processor:latest -f nsfwtag-processor/Dockerfile ./nsfwtag-processor

    if [ $? -eq 0 ]; then
        print_success "Processor Docker image built successfully"

        # Test the image
        print_status "Testing Docker image..."
        if docker run --rm nsfwtagger-processor:latest python -c "import sys; print('Python test passed'); sys.exit(0)" 2>/dev/null; then
            print_success "Docker image test passed"
        else
            print_warning "Docker image test failed, but image was built"
        fi
    else
        print_error "Processor Docker build failed"
        exit 1
    fi
}

# Create release package
create_release_package() {
    print_status "Creating release package..."

    cd "$PROJECT_ROOT"

    # Create release directory
    RELEASE_DIR="release-v1.0.0"
    rm -rf "$RELEASE_DIR"
    mkdir -p "$RELEASE_DIR"

    # Copy plugin build
    cp nsfwtag-plugin/dist/index.js "$RELEASE_DIR/nsfwtagger-plugin-v1.0.0.js"

    # Copy documentation
    cp README.md "$RELEASE_DIR/"
    cp CHANGELOG.md "$RELEASE_DIR/"
    cp CONTRIBUTING.md "$RELEASE_DIR/"
    cp SECURITY.md "$RELEASE_DIR/"
    cp LICENSE "$RELEASE_DIR/"

    # Create installation script
    cat > "$RELEASE_DIR/install.sh" << 'EOF'
#!/bin/bash

# NSFWTagger Installation Script
echo "🤖 NSFWTagger AI Plugin Installation"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
else
    echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
    exit 1
fi

echo "Detected OS: $OS"

# Check for required tools
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo -e "${RED}curl is required but not installed. Aborting.${NC}" >&2; exit 1; }

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Install Ollama models
echo ""
echo "📥 Installing Ollama models..."
echo "Note: This requires Ollama to be running. Start it with 'ollama serve' if not already running."

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "Pulling vision models..."
    ollama pull qwen3-vl-4b-instruct/Qwen3-VL-4B-Instruct-Q4_K_M.gguf || echo -e "${YELLOW}⚠️  Failed to pull primary model${NC}"
    ollama pull olmocr-2-7b-1025/olmOCR-2-7B-1025-Q4_K_M.gguf || echo -e "${YELLOW}⚠️  Failed to pull fallback model${NC}"
    echo -e "${GREEN}✅ Models installation completed${NC}"
else
    echo -e "${YELLOW}⚠️  Ollama is not running. Please start it manually with 'ollama serve' and run the model pulls:${NC}"
    echo "   ollama pull qwen3-vl-4b-instruct/Qwen3-VL-4B-Instruct-Q4_K_M.gguf"
    echo "   ollama pull olmocr-2-7b-1025/olmOCR-2-7B-1025-Q4_K_M.gguf"
fi

echo ""
echo "🐳 Starting NSFWTagger processor..."
docker run -d \
  --name nsfwtagger-processor \
  -p 8000:8000 \
  -v "$(pwd)/.env:/app/.env:ro" \
  nsfwtagger-processor:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Processor started successfully${NC}"
    echo "🌐 Processor API available at: http://localhost:8000"
    echo "🏥 Health check: http://localhost:8000/health"
else
    echo -e "${RED}❌ Failed to start processor${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Installation completed!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Copy 'nsfwtagger-plugin-v1.0.0.js' to your Stash plugins directory"
echo "2. Restart Stash"
echo "3. Configure the plugin in Settings → Plugins"
echo "4. Mark some items with 'NSFWAI-Tagme' tag"
echo "5. Use the plugin to start AI processing"
echo ""
echo "📖 See README.md for detailed usage instructions"
EOF

    chmod +x "$RELEASE_DIR/install.sh"

    # Create checksums
    cd "$RELEASE_DIR"
    sha256sum * > checksums.sha256 2>/dev/null || shasum -a 256 * > checksums.sha256

    cd "$PROJECT_ROOT"
    print_success "Release package created in $RELEASE_DIR/"
}

# Main build process
main() {
    print_status "Starting NSFWTagger build process..."

    # Run checks
    check_dependencies

    # Build components
    build_plugin
    build_processor

    # Create release package
    create_release_package

    print_success "Build completed successfully!"
    echo ""
    echo "📦 Release package available in: $PROJECT_ROOT/release-v1.0.0/"
    echo "📋 Installation instructions in: $PROJECT_ROOT/release-v1.0.0/README.md"
    echo "🛠️  Installation script: $PROJECT_ROOT/release-v1.0.0/install.sh"
}

# Run main function
main "$@"
