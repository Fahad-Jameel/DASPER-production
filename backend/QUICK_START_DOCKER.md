# Quick Start: Build Docker Image

## 🚀 Build the Docker Image

```bash
cd backend
./build_docker.sh
```

Or manually:
```bash
docker build -t dasper-backend:latest .
```

## 📦 Save Image for Deployment

```bash
docker save dasper-backend:latest | gzip > dasper-backend.tar.gz
```

## 🔄 Load Image on Server

```bash
docker load < dasper-backend.tar.gz
```

## ▶️ Run Container

```bash
docker run -d \
  --name dasper-backend \
  -p 5000:5000 \
  -e MONGODB_URI="your_mongodb_uri" \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  -e JWT_SECRET_KEY="your_jwt_secret" \
  --restart unless-stopped \
  dasper-backend:latest
```

## ✅ Verify

```bash
curl http://localhost:5000/api/health
```

## 📝 Notes

- Image includes the model file (`damagenet_json_best.pth`)
- All dependencies are pre-installed
- Ready for static IP deployment
- Size: ~2-3 GB (due to PyTorch)
