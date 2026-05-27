# Roominder 🏠

A comprehensive room and roommate matching platform that uses AI to connect property seekers with property owners and find compatible roommates.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Requirements](#system-requirements)
- [Installation & Setup](#installation--setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Development Workflow](#development-workflow)

## 🎯 Project Overview

Roominder is a full-stack application designed to solve the problem of finding compatible living spaces and roommates. The platform leverages artificial intelligence to:

- Match property seekers with suitable properties
- Connect roommates based on compatibility scores
- Enable seamless communication between users
- Provide property owner management tools
- Offer real-time notifications and chat functionality

## ✨ Features

### For Seekers
- **Property Discovery**: AI-powered property matching based on preferences and location
- **Roommate Matching**: Algorithm-based roommate compatibility matching
- **Advanced Search**: Filter properties by location, price, amenities, and more
- **Chat & Communication**: Real-time messaging with property owners and potential roommates
- **Favorites**: Save and manage favorite properties
- **Application Management**: Track application status for properties and roommate requests
- **Profile Matching**: Complete profile with preferences and requirements
- **Notifications**: Real-time alerts for new matches and messages
- **Two-Factor Authentication**: Enhanced account security

### For Property Owners
- **Property Management**: List, update, and manage properties
- **Application Management**: Review and approve applications from seekers
- **Notification System**: Get alerts for applications and messages
- **Analytics Dashboard**: View property performance and engagement metrics

### For Admin
- **Dashboard**: Monitor platform activity and user statistics
- **User Management**: Manage users and property owners
- **Content Moderation**: Review and moderate platform content
- **Report Analytics**: View detailed analytics and insights

### General
- **Multi-Language Support**: Internationalization (i18n) for multiple languages
- **Location Services**: Map integration for property discovery
- **Image Management**: Cloudinary integration for image uploads
- **AI Chatbot**: Conversational AI for user assistance
- **Face Detection**: AI-powered face detection for profile verification

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.x
- **Database**: PostgreSQL (with psycopg)
- **ORM**: SQLAlchemy
- **Authentication**: JWT (python-jose) with bcrypt hashing
- **API Documentation**: Built-in Swagger UI
- **Image Storage**: Cloudinary
- **AI/ML**: 
  - Sentence Transformers for embeddings
  - TorchVision for image processing
  - MediaPipe for face detection
  - OpenCV for computer vision
  - Anthropic API for LLM features
- **Additional**: 
  - Pydantic for data validation
  - qrcode for QR code generation
  - pyotp for two-factor authentication

### Frontend (Mobile App)
- **Framework**: Expo with React Native
- **Language**: TypeScript
- **State Management**: Context API / AsyncStorage
- **Navigation**: Expo Router (file-based routing)
- **HTTP Client**: Native Expo APIs
- **UI Components**: React Native, Expo Vector Icons
- **Localization**: i18next with react-i18next
- **Maps**: React Native Maps
- **Notifications**: Expo Notifications
- **Image Handling**: Expo Image Picker

### Admin Dashboard
- **Framework**: Next.js
- **Language**: TypeScript
- **Runtime**: Node.js
- **Styling**: Tailwind CSS (implied)
- **UI**: React components



## 📦 System Requirements

### General Requirements
- **OS**: Windows, macOS, or Linux
- **Git**: Latest version
- **Node.js**: v18.x or higher (for frontend and admin dashboard)
- **npm**: v9.x or higher or yarn v3.x or higher

### Backend Requirements
- **Python**: 3.9 or higher
- **PostgreSQL**: 12 or higher (or compatible database)
- **Virtual Environment**: Python venv or similar
- **Memory**: Minimum 4GB RAM (8GB+ recommended for AI modules)
- **Disk Space**: Minimum 2GB for dependencies and models

### Development Tools (Optional)
- **Docker**: For containerized development (optional)
- **Git**: For version control
- **VS Code** or preferred code editor
- **Postman** or **Thunder Client**: For API testing

## 🚀 Installation & Setup

### Prerequisites
Before starting, ensure you have:
1. Created a `.env` file in the root `backend/` directory with necessary environment variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/roominder
   JWT_SECRET=your_secret_key_here
   CLOUDINARY_URL=cloudinary://your_credentials
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

2. PostgreSQL running and accessible

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd Roominder
```

### Step 2: Create Python Virtual Environment

#### On Windows:
```bash
python -m venv venv
.\venv\Scripts\activate
```

#### On macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

## 🔧 Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```
DATABASE_URL=postgresql://user:password@localhost:5432/roominder
SQLALCHEMY_DATABASE_URL=postgresql://user:password@localhost:5432/roominder
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
NEON_API_KEY=your_neon_api_key_if_using_neon
```

### Step 4: Initialize Database
```bash
# Create tables (app will auto-create on first run)
# Or run the SQL script if needed
psql -U postgres -d roominder -f roominderdb.sql
```

### Step 5: Start Backend Server
```bash
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8001 --reload
```

Backend API will be available at: `http://localhost:8001`
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## 📱 Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Install Node.js Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env.local` file in the `frontend/` directory:
```
EXPO_PUBLIC_API_URL=http://localhost:8001
EXPO_PUBLIC_APP_NAME=Roominder
```

### Step 4: Start Frontend Development Server

#### For Web:
```bash
npm run web
```

#### For Android:
```bash
npm run android
```

#### For iOS:
```bash
npm run ios
```

#### For Offline Development:
```bash
npm start
```

## 👨‍💼 Admin Dashboard Setup

### Step 1: Navigate to Admin Dashboard
```bash
cd admin-dashboard
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_ADMIN_SECRET=your_admin_secret
```

### Step 4: Start Dashboard
```bash
npm run dev
```

Admin Dashboard will be available at: `http://localhost:3000`

## ▶️ Running the Project

### Option 1: Run Everything Separately

#### Terminal 1 - Backend:
```bash
cd backend
.\venv\Scripts\activate  # On Windows
source venv/bin/activate  # On macOS/Linux
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8001 --reload
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

#### Terminal 3 - Admin Dashboard (Optional):
```bash
cd admin-dashboard
npm run dev
```

### Option 2: Using VS Code Tasks
A pre-configured task is available:
```bash
Run backend on 8001
```

This will start the FastAPI server on port 8001.

## 📚 API Documentation

### Backend API
Once the backend is running, access the API documentation at:
- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

### Main API Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/two-factor/setup` - Setup 2FA
- `POST /auth/two-factor/verify` - Verify 2FA

#### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/{user_id}` - Get user details
- `GET /users/search` - Search users

#### Properties
- `GET /properties` - List properties
- `POST /properties` - Create property
- `GET /properties/{property_id}` - Get property details
- `PUT /properties/{property_id}` - Update property
- `DELETE /properties/{property_id}` - Delete property

#### Matching
- `GET /matches` - Get property matches
- `GET /roommates` - Get roommate matches
- `POST /matches/{match_id}/accept` - Accept a match
- `POST /matches/{match_id}/reject` - Reject a match

#### Chat & Messaging
- `GET /messages` - Get messages
- `POST /messages` - Send message
- `WebSocket /ws/{user_id}` - WebSocket connection for real-time chat

#### Notifications
- `GET /notifications` - Get user notifications
- `POST /notifications/{notification_id}/read` - Mark as read

## 🔄 Development Workflow

### Adding New Features

1. **Create a branch**:
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Backend Development**:
   - Create models in `backend/backend_user/models.py` or appropriate module
   - Create schemas in corresponding `schemas.py` file
   - Create routes in appropriate `routes/` directory
   - Use SQLAlchemy ORM for database operations
   - Add tests in a `tests/` directory

3. **Frontend Development**:
   - Create screens in `frontend/app/` directory
   - Create reusable components in `frontend/components/`
   - Use TypeScript for type safety
   - Follow Expo Router file-based routing conventions

4. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: description of feature"
   git push origin feature/feature-name
   ```

### Running Tests
```bash
# Backend tests (when available)
pytest backend/

# Frontend linting
npm run lint
```

## 📋 Python Dependencies Summary

| Package | Purpose |
|---------|---------|
| fastapi | Web framework |
| uvicorn | ASGI server |
| SQLAlchemy | ORM |
| psycopg | PostgreSQL driver |
| python-jose | JWT handling |
| passlib | Password hashing |
| pydantic | Data validation |
| cloudinary | Image storage |
| sentence-transformers | AI embeddings |
| torch | Deep learning |
| mediapipe | Face detection |
| opencv-python | Computer vision |
| anthropic | LLM API |
| pyotp | 2FA authentication |

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error**:
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists and credentials are correct

**Missing Dependencies**:
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

**Port Already in Use**:
```bash
# Change port in the startup command
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8002
```

### Frontend Issues

**Dependencies Not Installing**:
```bash
npm cache clean --force
rm node_modules package-lock.json
npm install
```

**Expo Port Conflict**:
```bash
npx expo start --port 8081
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure code follows project conventions
4. Test thoroughly
5. Create a pull request

## 📄 License

This project is proprietary and confidential.

## 👥 Team

Roominder Development Team

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Last Updated**: May 2026
**Version**: 1.0.0
