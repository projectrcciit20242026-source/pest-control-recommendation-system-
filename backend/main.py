from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
import pandas as pd
import io
import os
from typing import Optional
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
from groq import Groq
import json
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# CONFIGURATION
# ==========================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "pest_model.h5")
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "Pesticides.csv")

# Initialize Firebase
firebase_initialized = False
try:
    cred = credentials.Certificate("firebase-credentials.json")
    firebase_admin.initialize_app(cred)
    firebase_initialized = True
    db = firestore.client()
    print("Firebase initialized successfully!")
except Exception as e:
    print(f"Firebase initialization error: {e}")
    db = None

# Initialize Groq Client
groq_client = None
try:
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("Groq client initialized successfully!")
except Exception as e:
    print(f"Groq client initialization error: {e}")

# ==========================================
# FASTAPI APP
# ==========================================
app = FastAPI(title="PestoPiya API")

# Enable CORS for web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# LOAD MODEL & DATA
# ==========================================
print("Loading model...")
try:
    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing import image
    model = load_model(MODEL_PATH)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Load pesticide data
try:
    pesticide_df = pd.read_csv(CSV_PATH)
    pesticide_df["Pest Name"] = pesticide_df["Pest Name"].str.lower().str.strip()
    pesticide_dict = dict(zip(pesticide_df["Pest Name"], pesticide_df["Most Commonly Used Pesticides"]))
    print("Pesticide data loaded successfully!")
except Exception as e:
    print(f"Error loading pesticide data: {e}")
    pesticide_dict = {}

# Class labels
class_labels = [
    'Cicadellidae', 'Lycorma delicatula', 'Miridae', 'aphids',
    'beet army worm', 'blister beetle', 'corn borer',
    'legume blister beetle', 'mole cricket', 'whitefly'
]

# ==========================================
# PYDANTIC MODELS
# ==========================================
class UserSignup(BaseModel):
    name: str
    language: str  # 'english' or 'bangla'
    email: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str

class UpdateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

# ==========================================
# MULTI-LANGUAGE SUPPORT
# ==========================================
TRANSLATIONS = {
    "english": {
        "welcome": "Welcome to PestoPiya",
        "login_success": "Login successful",
        "signup_success": "Signup successful",
        "no_match": "No pest detected. Please take a clearer image or upload a different one.",
        "pest_detected": "Pest detected",
        "confidence": "Confidence",
        "recommended_pesticides": "Recommended Pesticides",
        "prevention_method": "Prevention Method",
        "no_previous_reports": "No previous reports found",
        "profile_updated": "Profile updated successfully"
    },
    "bangla": {
        "welcome": "পেস্টোপিয়াতে স্বাগতম",
        "login_success": "লগইন সফল হয়েছে",
        "signup_success": "সাইনআপ সফল হয়েছে",
        "no_match": "কোনো পোকা সনাক্ত করা যায়নি। অনুগ্রহ করে একটি পরিষ্কার ছবি তুলুন বা অন্য একটি আপলোড করুন।",
        "pest_detected": "পোকা সনাক্ত করা হয়েছে",
        "confidence": "আস্থা",
        "recommended_pesticides": "প্রস্তাবিত কীটনাশক",
        "prevention_method": "প্রতিরোধ পদ্ধতি",
        "no_previous_reports": "কোনো পূর্ববর্তী রিপোর্ট পাওয়া যায়নি",
        "profile_updated": "প্রোফাইল সফলভাবে আপডেট হয়েছে"
    }
}

def get_text(key: str, language: str) -> str:
    return TRANSLATIONS.get(language, {}).get(key, TRANSLATIONS["english"].get(key, key))

# ==========================================
# ROUTES
# ==========================================

@app.get("/")
async def root():
    return {"message": "PestoPiya API is running", "app_name": "PestoPiya"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "firebase_connected": firebase_initialized
    }

# ==========================================
# USER AUTHENTICATION
# ==========================================

@app.post("/auth/signup")
async def signup(user: UserSignup):
    """
    Register a new user
    """
    try:
        user_id = user.email or user.phone
        if not user_id:
            raise HTTPException(status_code=400, detail="Email or Phone is required")

        user_data = {
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "language": user.language,
            "reports": []
        }
        
        # Store in Firebase
        if db:
            db.collection('users').document(user_id).set(user_data)
        
        return {
            "success": True,
            "message": get_text("signup_success", user.language),
            "user": user_data
        }
    except Exception as e:
        print(f"Signup Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login(user: UserLogin):
    """
    Login user
    """
    try:
        # Fetch from Firebase
        if db:
            doc = db.collection('users').document(user.email).get()
            if doc.exists:
                return {
                    "success": True,
                    "message": get_text("login_success", doc.to_dict().get("language", "english")),
                    "user": doc.to_dict()
                }
        
        # If user not found or Firebase not connected
        return {
            "success": False,
            "message": "User not found"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/auth/profile")
async def update_profile(user: UpdateProfile, email: str):
    """
    Update user profile
    """
    try:
        # Update in Firebase
        if db:
            doc_ref = db.collection('users').document(email)
            doc = doc_ref.get()
            if doc.exists:
                update_data = {}
                if user.name:
                    update_data["name"] = user.name
                if user.email:
                    update_data["email"] = user.email
                if update_data:
                    doc_ref.update(update_data)
        
        return {
            "success": True,
            "message": get_text("profile_updated", "english")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/profile/{email}")
async def get_profile(email: str):
    """
    Get user profile and reports
    """
    try:
        # Fetch from Firebase
        if db:
            doc = db.collection('users').document(email).get()
            if doc.exists:
                return {"success": True, "user": doc.to_dict()}
        
        return {
            "success": False,
            "message": "User not found"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# PREDICTION ENDPOINT
# ==========================================

@app.post("/predict")
async def predict_pest(file: UploadFile = File(...), language: str = "english", email: str = None):
    """
    Upload an image and get pest prediction with LLM-generated description
    """
    try:
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        # Read and preprocess image
        contents = await file.read()
        img = image.load_img(io.BytesIO(contents), target_size=(300, 300))
        img_array = image.img_to_array(img) / 255.0
        img_array_expanded = np.expand_dims(img_array, axis=0)
        
        # Make prediction
        pred = model.predict(img_array_expanded, verbose=0)
        pred_index = np.argmax(pred)
        confidence = float(np.max(pred))
        
        # Check confidence threshold
        if confidence < 0.3:
            return {
                "success": False,
                "message": get_text("no_match", language),
                "confidence": round(confidence * 100, 2)
            }
        
        # Get pest name
        pest_name = class_labels[pred_index]
        pest_name_clean = pest_name.lower().strip()
        
        # Get pesticide recommendations
        pesticides = pesticide_dict.get(pest_name_clean, "No pesticide found")
        
        # Generate LLM description
        llm_description = await generate_pest_description(pest_name, language)
        
        # Prepare response data (ensure no Firestore objects are present)
        timestamp_str = datetime.now().isoformat()
        
        result = {
            "success": True,
            "pest": pest_name,
            "confidence": confidence,
            "confidence_percentage": round(confidence * 100, 2),
            "pesticides": pesticides.split(", ") if isinstance(pesticides, str) else [pesticides],
            "description": llm_description["description"],
            "prevention_method": llm_description["prevention"],
            "timestamp": timestamp_str
        }
        
        # Store in Firebase user reports
        if db and email:
            try:
                db.collection('users').document(email).update({
                    'reports': firestore.ArrayUnion([result])
                })
            except Exception as fb_err:
                print(f"Firebase Update Error: {fb_err}")
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_pest_description(pest_name: str, language: str):
    """
    Generate pest description and prevention method using Groq LLM
    """
    try:
        if language == "bangla":
            prompt = f"""সংক্ষেপে {pest_name} পোকা সম্পর্কে বলুন এবং ভারতে ব্যবহারের জন্য সবচেয়ে কম ক্ষতিকর পদ্ধতি (কীটনাশক বা ঘরোয়া উপায়) প্রস্তাব করুন। সীমিত শব্দে উত্তর দিন।"""
        else:
            prompt = f"""Briefly describe the pest {pest_name} and suggest the least harmful method (pesticide or home remedy) for prevention in India. Keep the response concise."""
        
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an agricultural pest expert. Provide concise, practical advice."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatilecd",
            max_tokens=200
        )
        
        description = response.choices[0].message.content
        
        # Split into description and prevention if possible
        # For simplicity, we'll return the whole response as description
        # and try to extract prevention method
        return {
            "description": description,
            "prevention": description  # LLM provides combined response
        }
    except Exception as e:
        print(f"LLM Error: {e}")
        return {
            "description": f"{pest_name} is a common agricultural pest. Use recommended pesticides for control.",
            "prevention": "Use recommended pesticides or consult local agricultural expert."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
