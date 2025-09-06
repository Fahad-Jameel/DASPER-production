# DASPER - Disaster Assessment & Structural Performance Evaluation

<div align="center">

![DASPER Logo](dasper/assets/icon.png)

**AI-Powered Building Damage Assessment & Cost Estimation Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-blue.svg)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-53-000020.svg)](https://expo.dev/)

</div>

## 🌟 Overview

**DASPER** (Disaster Assessment & Structural Performance Evaluation) is an innovative AI-powered mobile application designed for rapid, accurate building damage assessment and automated cost estimation. Built for disaster response teams, insurance assessors, structural engineers, and emergency management organizations.

### What DASPER Does

- **📱 Mobile Damage Assessment**: Capture building images and get instant AI-powered damage analysis
- **🧠 Advanced AI Analysis**: Custom-trained DamageNet CNN model for precise damage severity estimation
- **💰 Automated Cost Estimation**: Regional cost calculations based on damage severity and building characteristics  
- **📍 Geographic Intelligence**: Location-aware analysis with regional economic factors
- **📊 Comprehensive Reporting**: Professional PDF reports with detailed breakdowns
- **🚨 Real-Time Alerts**: Integration with global disaster monitoring systems
- **☁️ Cloud Synchronization**: Secure data storage and multi-device access

## 🎯 Key Features

### 🔍 **AI-Powered Damage Detection**
- **DamageNet CNN Model**: Custom-trained neural network using EfficientNet-B4 backbone
- **Multi-Modal Analysis**: Combines computer vision with structural engineering principles
- **Severity Scoring**: Continuous damage severity assessment (0.0 - 1.0 scale)
- **Damage Classification**: Identifies specific damage types (structural, fire, flood, earthquake, etc.)

### 📐 **Intelligent Building Analysis** 
- **Automated Area Estimation**: Computer vision-based building area calculation
- **Multi-Method Fusion**: Edge detection, segmentation, and feature analysis
- **Building Type Recognition**: Residential, commercial, and industrial classification
- **Regional Adaptation**: Pakistan-focused cost modeling with global applicability

### 💡 **Cost Estimation Engine**
- **DASPER Framework**: Industry-standard cost estimation methodology
- **Component Breakdown**: Structural, non-structural, and content cost analysis
- **Regional Multipliers**: Local economic factors and market conditions
- **Professional Fees**: Architects, engineers, and regulatory costs included
- **Uncertainty Modeling**: Confidence-based cost ranges

### 🌍 **Disaster Intelligence**
- **Real-Time Alerts**: Integration with USGS, NASA EONET, and weather services
- **Global Coverage**: Earthquake, weather, and natural disaster monitoring
- **Location-Based**: Alerts filtered by user location and preferences
- **Multi-Source Aggregation**: Comprehensive disaster event tracking

### 📱 **Mobile Experience**
- **Cross-Platform**: Single React Native codebase for iOS and Android
- **Offline Capability**: Works without internet connectivity
- **Modern UI/UX**: Intuitive design with smooth animations
- **Camera Integration**: Advanced photo capture with optimization
- **Interactive Maps**: Custom WebView-based mapping solution

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DASPER Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 Frontend (React Native/Expo)                           │
│  ├── Authentication & User Management                       │
│  ├── Camera & Image Processing                             │
│  ├── Interactive Maps & Location Services                  │
│  ├── Real-Time Notifications                               │
│  └── Offline Data Synchronization                          │
│                                                             │
│  🔌 API Layer (Flask REST API)                             │
│  ├── JWT Authentication & Authorization                     │
│  ├── File Upload & Image Processing                        │
│  ├── External API Integration                              │
│  └── PDF Report Generation                                 │
│                                                             │
│  🧠 AI/ML Pipeline                                          │
│  ├── DamageNet CNN (PyTorch)                               │
│  ├── Building Area Estimator (OpenCV)                      │
│  ├── Cost Estimation Engine                                │
│  └── Regional Economic Modeling                            │
│                                                             │
│  💾 Data Layer (MongoDB)                                    │
│  ├── User Profiles & Authentication                        │
│  ├── Assessment History & Analytics                        │
│  ├── Disaster Alerts & Notifications                       │
│  └── Generated Reports & Documents                         │
│                                                             │
│  🌐 External Services                                       │
│  ├── USGS Earthquake API                                   │
│  ├── NASA EONET Disaster API                               │
│  ├── OpenWeatherMap API                                    │
│  └── Firebase Authentication                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **MongoDB 4.4+**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git**

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/DASPER-Production.git
cd DASPER-Production

# Set up Python virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp environment_template.txt .env
# Edit .env with your configuration

# Start MongoDB (ensure MongoDB is running)
# Initialize database
python setup_database.py setup

# Download the AI model (required)
# Place 'damagenet_json_best.pth' in the backend directory

# Start the backend server
python app.py
```

### Frontend Setup

```bash
# Navigate to mobile app directory
cd ../dasper

# Install Node.js dependencies
npm install

# Configure environment
cp config/env.js.example config/env.js
# Edit config/env.js with your backend URL

# Start the Expo development server
expo start

# Or run on specific platform
expo start --ios     # iOS Simulator
expo start --android # Android Emulator
```

### Environment Configuration

#### Backend (.env)
```bash
# Database (MongoDB Atlas Cloud)
MONGODB_URI=

# Security
JWT_SECRET_KEY=your-super-secure-jwt-secret-key

# External APIs (optional)
OPENWEATHER_API_KEY=your-openweather-api-key
FIREBASE_CONFIG={"your": "firebase-config"}

# Server
FLASK_ENV=production
```

#### Frontend (config/env.js)
```javascript
export default {
  API_BASE_URL: 'http://your-backend-url:5000',
  API_TIMEOUT: 60000,
  DEBUG_MODE: __DEV__,
  
  // Map configuration
  GOOGLE_MAPS_API_KEY: 'your-google-maps-key',
  
  // Firebase configuration
  FIREBASE_CONFIG: {
    // Your Firebase config
  }
};
```

## 📖 Usage Guide

### 1. **User Registration & Authentication**
```javascript
// Register new account
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "secure-password",
  "full_name": "John Doe"
}

// Login
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "secure-password"
}
```

### 2. **Damage Assessment Workflow**
```javascript
// Submit assessment
POST /api/assess
Content-Type: multipart/form-data

{
  "image": <file>,
  "building_name": "Sample Building",
  "building_type": "residential",
  "pin_location": "lat,lng",
  "damage_types": "Structural,Fire"
}
```

### 3. **Retrieve Results**
```javascript
// Get assessment results
GET /api/assessments/{assessment_id}

// Generate PDF report
POST /api/reports/generate
{
  "assessment_id": "assessment_id"
}
```

## 🔧 API Reference

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | User registration | ❌ |
| `/api/auth/login` | POST | User login | ❌ |
| `/api/auth/firebase-login` | POST | Firebase social login | ❌ |
| `/api/auth/profile` | GET | Get user profile | ✅ |
| `/api/auth/profile` | PUT | Update user profile | ✅ |

### Assessment Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/assess` | POST | Submit damage assessment | ✅ |
| `/api/assessments` | GET | Get user assessments | ✅ |
| `/api/assessments/public` | GET | Get public assessments | ✅ |
| `/api/assessments/{id}` | GET | Get assessment details | ✅ |

### Disaster Alert Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/disaster-alerts` | GET | Get active alerts | ✅ |
| `/api/alerts/fetch-live` | POST | Trigger alert refresh | ✅ |
| `/api/alerts/status` | GET | Get alerts system status | ✅ |

### Report Generation

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/reports/generate` | POST | Generate PDF report | ✅ |
| `/api/reports/download/{id}` | GET | Download PDF report | ✅ |

## 🧪 Development

### Project Structure

```
DASPER-Production/
├── backend/                 # Flask API server
│   ├── app.py              # Main application entry point
│   ├── model.py            # DamageNet neural network
│   ├── inference.py        # AI inference pipeline
│   ├── building_area_estimator.py
│   ├── enhanced_cost_estimation.py
│   └── requirements.txt    # Python dependencies
├── dasper/                 # React Native mobile app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Screen components
│   │   ├── services/       # API services
│   │   ├── contexts/       # React contexts
│   │   └── theme/          # Styling and themes
│   ├── assets/             # Images, animations, fonts
│   └── package.json        # Node.js dependencies
└── README.md
```

### Running Tests

```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests  
cd dasper
npm test

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Python linting
cd backend
flake8 .
black .

# JavaScript linting
cd dasper
npm run lint
npm run format
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual containers
docker build -t dasper-backend ./backend
docker build -t dasper-frontend ./dasper
```

### Production Checklist

- [ ] Set secure JWT secret keys
- [ ] Configure CORS for specific origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure database connection pooling
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Set up CI/CD pipeline
- [ ] Performance testing
- [ ] Security audit

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork
3. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
4. **Make** your changes
5. **Test** your changes
6. **Commit** your changes (`git commit -m 'Add amazing feature'`)
7. **Push** to the branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request

### Reporting Issues

Please use the [GitHub Issues](https://github.com/your-username/DASPER-Production/issues) page to report bugs or request features.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PyTorch Team** - Deep learning framework
- **Expo Team** - React Native development platform
- **USGS** - Earthquake data API
- **NASA EONET** - Natural disaster event API
- **OpenWeatherMap** - Weather data API
- **EfficientNet Authors** - CNN architecture

## 📞 Support

- **Documentation**: [Project Wiki](https://github.com/your-username/DASPER-Production/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/DASPER-Production/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/DASPER-Production/discussions)
- **Email**: dasper-support@example.com

## 🗺️ Roadmap

### Version 2.0 (Planned)
- [ ] Real-time collaborative assessments
- [ ] Advanced 3D damage visualization
- [ ] Multi-language support
- [ ] Blockchain-based assessment verification
- [ ] Integration with IoT sensors
- [ ] Machine learning model fine-tuning interface

### Version 1.1 (Current)
- [x] Basic damage assessment
- [x] Cost estimation
- [x] PDF report generation
- [x] Disaster alerts integration
- [x] Mobile application
- [x] User authentication

---

<div align="center">

**Built with ❤️ for disaster response and building safety**

[⭐ Star this repository](https://github.com/your-username/DASPER-Production) | [🐛 Report Bug](https://github.com/your-username/DASPER-Production/issues) | [💡 Request Feature](https://github.com/your-username/DASPER-Production/issues)

</div>
