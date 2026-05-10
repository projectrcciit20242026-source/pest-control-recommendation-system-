# PestoPiya - Smart Pest Detection App

A mobile application for detecting agricultural pests and recommending pesticides using AI.

## GitHub Setup Instructions

### Connect to repository

- Open project repo -> go to settings -> Collaborators -> Add people -> Your personal github username that is connected to your terminal / VS Code -> Accept invitation from mail.

- Then run on terminal inside project folder - 
`
git remote add origin https://github.com/projectrcciit20242026-source/pest-control-recommendation-system-.git
`

### Pull Request
```bash
git pull origin <branch-name>
```

### Git Push
```bash
# Add changes
git add .

# Commit changes
git commit -m "your-message"

# Switch to branch you want to push
git branch -M <branch-name>

# Push
git push
```

## Project Structure

```
├── backend/                 # FastAPI Backend
│   ├── main.py             # Main API server
│   ├── api/                # API routes
│   ├── models/             # ML models
│   └── utils/              # Utility functions
├── mobile_app/             # Kivy Mobile App
│   ├── main.py             # Main app file
│   ├── screens/            # Screen classes
│   ├── utils/              # Utility functions
│   └── assets/             # Images, fonts
├── pest_model.h5          # Trained TensorFlow model
├── Pesticides.csv         # Pesticide database
├── requirements.txt       # Backend dependencies
└── mobile_requirements.txt # Mobile app dependencies
```

## Features

- **Multi-language Support**: English and Bangla
- **User Authentication**: Signup/Login with Firebase
- **Image Detection**: Upload or capture images for pest detection
- **AI-Powered Analysis**: TensorFlow model + Groq LLM for detailed descriptions
- **Pesticide Recommendations**: India-specific less harmful solutions
- **History Tracking**: View previous detection reports
- **Offline-Ready**: Model runs locally on device

## Setup Instructions

### 1. Backend Setup

```bash
# Install backend dependencies
pip install -r requirements.txt

# Add Firebase credentials
# Download firebase-credentials.json from Firebase Console
# Place it in the backend folder

# Start the backend server
cd backend
python main.py
```

The backend will run on `http://localhost:8000`

### 2. Mobile App Setup

```bash
# Install mobile app dependencies
pip install -r mobile_requirements.txt

# Run the app
cd mobile_app
python main.py
```

### 3. Firebase Setup (Optional but Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Go to Project Settings > Service Accounts
5. Generate a new private key
6. Save as `firebase-credentials.json` in the backend folder
7. Update `backend/main.py` to uncomment Firebase initialization

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile/{email}` - Get user profile
- `PUT /auth/profile` - Update user profile

### Prediction
- `POST /predict` - Upload image for pest detection
  - Parameters: `file` (image), `language` (english/bangla)
  - Returns: Pest name, confidence, description, prevention method

### Health
- `GET /` - API status
- `GET /health` - Health check

## UI Flow

1. **Splash Screen**: PestoPiya logo animation
2. **Login Screen**: Name, email, language selection (English/Bangla)
3. **Main Screen**: Camera icon with upload/profile menu
4. **Upload Screen**: GPay-style options (Click Image / Upload Image)
5. **Result Screen**: Image, pest description, prevention method
6. **Profile Screen**: User info and previous reports

## Technologies Used

- **Backend**: FastAPI, TensorFlow, Firebase Admin SDK
- **Mobile**: Kivy, KivyMD, Plyer
- **AI**: TensorFlow (EfficientNetB3), Groq LLM
- **Database**: Firebase Firestore

## Notes

- This is a college project, not production-ready
- User should add edge cases as needed
- Firebase integration is optional (mock data used if not configured)
- Groq API key is included in `.env` file
- Model path needs to be correct in `backend/main.py`

## Future Enhancements

- Add more pest classes
- Improve model accuracy
- Add push notifications
- Implement offline-first architecture
- Add social sharing features

## License

College Project - Educational Use Only
