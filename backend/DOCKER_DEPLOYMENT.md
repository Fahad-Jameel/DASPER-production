# DASPER Backend Docker Deployment Guide

## 🐳 Docker Image for Production Deployment

This guide explains how to build and deploy the DASPER backend as a Docker container for use with a static IP address.

## 📋 Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier deployment)
- MongoDB Atlas connection string
- Gemini API key

## 🔨 Building the Docker Image

### Option 1: Using the Build Script (Recommended)

```bash
cd backend
./build_docker.sh
```

### Option 2: Manual Build

```bash
cd backend
docker build -t dasper-backend:latest .
```

## 🚀 Running the Container

### Option 1: Using Docker Run

```bash
docker run -d \
  --name dasper-backend \
  -p 5000:5000 \
  -e MONGODB_URI="your_mongodb_uri" \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  -e JWT_SECRET_KEY="your_jwt_secret" \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/results:/app/results \
  -v $(pwd)/reports:/app/reports \
  --restart unless-stopped \
  dasper-backend:latest
```

### Option 2: Using Docker Compose

1. Create a `.env` file with your environment variables:
```bash
MONGODB_URI=mongodb+srv://dasper_user:dasper%40production%402021@dasper.wt1bmvf.mongodb.net/?retryWrites=true&w=majority&appName=dasper
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET_KEY=your_jwt_secret
```

2. Start the container:
```bash
docker-compose up -d
```

## 📦 Saving and Loading Docker Image

### Save Image to File

```bash
docker save dasper-backend:latest | gzip > dasper-backend.tar.gz
```

### Load Image from File

```bash
docker load < dasper-backend.tar.gz
```

## 🌐 Deploying with Static IP

### For Cloud Providers (AWS, GCP, Azure)

1. **Build the image:**
   ```bash
   ./build_docker.sh
   ```

2. **Push to container registry:**
   ```bash
   # Tag for your registry
   docker tag dasper-backend:latest your-registry/dasper-backend:latest
   
   # Push to registry
   docker push your-registry/dasper-backend:latest
   ```

3. **Deploy on cloud instance:**
   - Create a VM instance with static IP
   - Install Docker on the instance
   - Pull and run the image:
     ```bash
     docker pull your-registry/dasper-backend:latest
     docker run -d -p 5000:5000 --name dasper-backend your-registry/dasper-backend:latest
     ```

### For Self-Hosted Server

1. **Build the image on your server:**
   ```bash
   cd /path/to/backend
   ./build_docker.sh
   ```

2. **Run with static IP binding:**
   ```bash
   docker run -d \
     --name dasper-backend \
     -p YOUR_STATIC_IP:5000:5000 \
     -e MONGODB_URI="your_mongodb_uri" \
     -e GEMINI_API_KEY="your_gemini_api_key" \
     -e JWT_SECRET_KEY="your_jwt_secret" \
     --restart unless-stopped \
     dasper-backend:latest
   ```

## 🔍 Verifying Deployment

### Check Container Status

```bash
docker ps | grep dasper-backend
```

### Check Logs

```bash
docker logs dasper-backend
```

### Test Health Endpoint

```bash
curl http://YOUR_STATIC_IP:5000/api/health
```

## 📝 Environment Variables

Required environment variables:

- `MONGODB_URI`: MongoDB Atlas connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `FLASK_ENV`: Set to `production` for production deployment

## 🛠️ Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs dasper-backend

# Check if port is already in use
lsof -i :5000
```

### Model Not Loading

- Ensure `damagenet_json_best.pth` is in the backend directory
- Check container logs for model loading errors

### MongoDB Connection Issues

- Verify MongoDB URI is correct
- Check network connectivity from container
- Ensure MongoDB Atlas allows connections from your IP

## 📊 Image Size Optimization

The Docker image includes:
- Python 3.9 runtime
- All Python dependencies
- PyTorch and model files
- Application code
- Model file (damagenet_json_best.pth)

Expected image size: ~2-3 GB (due to PyTorch dependencies)

## 🔐 Security Notes

- Never commit `.env` files with real credentials
- Use Docker secrets or environment variables for sensitive data
- Keep JWT_SECRET_KEY secure and unique
- Regularly update dependencies for security patches

## 📞 Support

For deployment issues, check:
1. Docker logs: `docker logs dasper-backend`
2. Container status: `docker ps -a`
3. Network connectivity: `docker exec dasper-backend curl http://localhost:5000/api/health`
