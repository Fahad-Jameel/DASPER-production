#!/bin/bash
# Build Docker Image for DASPER Backend

echo "🐳 Building DASPER Backend Docker Image..."
echo ""

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Set image name and tag
IMAGE_NAME="dasper-backend"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo "📦 Image: ${FULL_IMAGE_NAME}"
echo ""

# Build the Docker image with memory optimization
echo "🔨 Building Docker image (this may take 10-15 minutes)..."
echo "💡 Tip: If build fails due to memory, increase Docker memory limit in settings"
docker build \
    --memory=4g \
    --memory-swap=8g \
    -t ${FULL_IMAGE_NAME} .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker image built successfully!"
    echo ""
    echo "📊 Image Details:"
    docker images ${IMAGE_NAME} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    echo "🚀 To run the container:"
    echo "   docker run -d -p 5000:5000 --name dasper-backend ${FULL_IMAGE_NAME}"
    echo ""
    echo "🌐 Or use docker-compose:"
    echo "   docker-compose up -d"
    echo ""
    echo "📝 To save the image to a file:"
    echo "   docker save ${FULL_IMAGE_NAME} | gzip > dasper-backend.tar.gz"
    echo ""
    echo "📤 To load the image from a file:"
    echo "   docker load < dasper-backend.tar.gz"
else
    echo ""
    echo "❌ Docker build failed!"
    exit 1
fi
