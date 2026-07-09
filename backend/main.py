from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
import pandas as pd
import io
import os
from typing import Optional
from pydantic import BaseModel
from groq import Groq
import json
from datetime import datetime   
from dotenv import load_dotenv
from passlib.context import CryptContext

from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security

# Database imports
from sqlalchemy.orm import Session
from database import get_db, init_db, User, ScanResult

# Load environment variables
load_dotenv()


# ==========================================
# CONFIGURATION
# ==========================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print(f"DEBUG: GROQ_API_KEY loaded: {GROQ_API_KEY is not None}")
if GROQ_API_KEY:
    print(f"DEBUG: Key starts with: {GROQ_API_KEY[:8]}...")
else:
    print("WARNING: GROQ_API_KEY is missing or empty in .env file!")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "pest_model.h5")
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "Pesticides.csv")

# Initialize PostgreSQL DB
try:
    init_db()
except Exception as e:
    print(f"Database initialization error: {e}")

# Initialize Groq Client
groq_client = None
try:
    import httpx
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable is not defined.")
    
    # Passing an explicit httpx.Client prevents proxy-related parameter errors inside the SDK
    groq_client = Groq(api_key=GROQ_API_KEY, http_client=httpx.Client())
    print("Groq client initialized successfully!")
except Exception as e:
    import traceback
    print(f"Groq client initialization error: {e}")
    traceback.print_exc()


# FASTAPI APP
app = FastAPI(title="PestoPiya API")

# Enable CORS for web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# LOAD MODEL & DATA
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
    # email: Optional[str] = None
    phone: str
    password: str

class UserLogin(BaseModel):
    # email: Optional[str] = None
    name: str
    phone: str
    password: str
    language: str

class UpdateProfile(BaseModel):
    oldPassword: str
    newPassword: str


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# MULTI-LANGUAGE SUPPORT
TRANSLATIONS = {
    "english": {
        "welcome": "Welcome to PestoPiya",
        "login_success": "Login successful",
        "signup_success": "Signup successful",
        "user_already_exists": "Couldn't create account. User already exists. Try logging in.",
        "user_not_found": "User not found. Please create your account first.",
        "no_match": "No pest detected. Please take a clearer image or upload a different one.",
        "pest_detected": "Pest detected",
        "confidence": "Confidence",
        "recommended_pesticides": "Recommended Pesticides",
        "prevention_method": "Prevention Method",
        "no_previous_reports": "No previous reports found",
        "wrong_password": "Your entered password doesn't match your actual password",
        "profile_updated": "Profile updated successfully"
    },
    "bangla": {
        "welcome": "পেস্টোপিয়াতে স্বাগতম",
        "login_success": "লগইন সফল হয়েছে",
        "signup_success": "সাইনআপ সফল হয়েছে",
        "user_already_exists": "অ্যাকাউন্ট তৈরি করা যায়নি। এই ফোন নম্বর দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে লগ ইন করুন।",
        "user_not_found": "এই ফোন নম্বরের কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে প্রথমে একটি অ্যাকাউন্ট তৈরি করুন।",
        "no_match": "কোনো পোকা সনাক্ত করা যায়নি। অনুগ্রহ করে একটি পরিষ্কার ছবি তুলুন বা অন্য একটি আপলোড করুন।",
        "pest_detected": "পোকা সনাক্ত করা হয়েছে",
        "confidence": "আস্থা",
        "recommended_pesticides": "প্রস্তাবিত কীটনাশক",
        "prevention_method": "প্রতিরোধ পদ্ধতি",
        "no_previous_reports": "কোনো পূর্ববর্তী রিপোর্ট পাওয়া যায়নি",
        "wrong_password": "আপনার দেওয়া পাসওয়ার্ডটি আপনার আসল পাসওয়ার্ডের সাথে মিলছে না",
        "profile_updated": "প্রোফাইল সফলভাবে আপডেট হয়েছে"
    }
}

def get_text(key: str, language: str) -> str:
    return TRANSLATIONS.get(language, {}).get(key, TRANSLATIONS["english"].get(key, key))


# ==========================================
# JWT Setup
# ==========================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

def create_access_token(user_id: str, phone: str) -> str:
    payload = {
        "sub": str(user_id),
        "phone": phone,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    payload = verify_token(credentials.credentials)
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


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
    }

# ==========================================
# USER AUTHENTICATION
# ==========================================

@app.post("/auth/signup")
async def signup(user: UserSignup, db: Session = Depends(get_db)):
    try:
        # Use phone as the primary unique identifier
        user_phone = user.phone
        if not user_phone:
            raise HTTPException(status_code=400, detail="Phone number is required")

        existing_user = db.query(User).filter(User.phone == user_phone).first()
        if existing_user:
            return {
                "success": False,
                "message": get_text("user_already_exists", user.language),
                "user": {
                    "id": str(existing_user.id),
                    "name": existing_user.name,
                    # "email": existing_user.email,
                    "phone": existing_user.phone,
                    "language": existing_user.language
                }
            }
        
        print(repr(user.password))
        hashed_password = pwd_context.hash(user.password)

        # If new user, create the record
        new_user = User(
            name=user.name,
            # email=user.email,
            phone=user.phone,
            password=hashed_password,
            language=user.language
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "message": get_text("signup_success", user.language),
            "token": create_access_token(new_user.id, new_user.phone),
            "user": {
                "id": str(new_user.id),
                "name": new_user.name,
                # "email": new_user.email,
                "phone": new_user.phone,
                "language": new_user.language
            }
        }
    except Exception as e:
        print(f"Signup Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Login user
    """
    try:
        password = user.password
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")

        # Fetch from PostgreSQL
        db_user = db.query(User).filter(
            User.name == user.name,
            User.phone == user.phone
        ).first()

        if not db_user:
            return {
                "success": False,
                "message": get_text("user_not_found", user.language)
            }

        if not pwd_context.verify(password, db_user.password):
            return {
                "success": False,
                "message": get_text("user_not_found", user.language)
            }
        
        db_user.language = user.language
        db.commit()
        db.refresh(db_user)
        
        return {
            "success": True,
            "message": get_text("login_success", user.language),
            "token": create_access_token(db_user.id, db_user.phone),
            "user": {
                "id": db_user.id,
                "name": db_user.name,
                "phone": db_user.phone,
                "language": db_user.language
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/auth/profile")
async def update_profile(user: UpdateProfile, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Update user profile
    """
    try:
        # Update in PostgreSQL
        if current_user:
            if not pwd_context.verify(user.oldPassword, current_user.password):
                return {
                    "success": False,
                    "message": get_text("wrong_password", current_user.language)
                }

            if(user.newPassword):
                hashed_password = pwd_context.hash(user.newPassword)
                current_user.password = hashed_password

            db.commit()

            return {
                "success": True,
                "message": get_text("profile_updated", current_user.language)
            }
        return {
            "success": False,
            "message": "User not found"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    Get user profile and reports
    """

    return {
        "success": True, 
        "user": {
            "id": str(current_user.id),
            "name": current_user.name,
            "phone": current_user.phone,
            "language": current_user.language
        }
    }


@app.get("/history")
async def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Return only scan history (reports array) for a user.
    Called by the frontend History page.
    """
    try:
        history_records = db.query(ScanResult).filter(ScanResult.user_id == current_user.id).order_by(ScanResult.scanned_at.desc()).all()
        history = []
        for record in history_records:
            history.append({
                "pest": record.pest_name,
                "confidence": record.confidence_pct,
                "confidence_percentage": record.confidence_pct * 100,
                "description": record.description,
                "prevention_method": record.prevention_method,
                "pesticides": record.pesticides,
                "timestamp": record.scanned_at.isoformat() if record.scanned_at else None
            })
        return {"success": True, "history": history}
    except Exception as e:
        print(f"History Error: {e}")
        return {"success": False, "history": []}

# PREDICTION ENDPOINT
@app.post("/predict")
async def predict_pest(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Upload an image and get pest prediction with LLM-generated description
    """
    try:
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        # Read and preprocess image
        contents = await file.read()
        print(f"DEBUG: Received file of length {len(contents)} bytes")
        print(f"DEBUG: File header: {contents[:50]}")
        try:
            img = image.load_img(io.BytesIO(contents), target_size=(300, 300))
        except Exception as e:
            print(f"Image load error: {e}")
            raise HTTPException(status_code=400, detail="Invalid image file")
            
        img_array = image.img_to_array(img) / 255.0
        img_array_expanded = np.expand_dims(img_array, axis=0)
        
        # Make prediction
        pred = model.predict(img_array_expanded, verbose=0)
        pred_index = np.argmax(pred)
        confidence = float(np.max(pred))
        
        # ── Confidence gate: 65% minimum to avoid random-image false positives ──
        CONFIDENCE_THRESHOLD = 0.65
        if confidence < CONFIDENCE_THRESHOLD:
            supported = ', '.join(class_labels)
            if current_user.language == 'bangla':
                msg = (
                    f"এই ছবিতে কোনো পরিচিত পোকা সনাক্ত করা যায়নি (আস্থা: {round(confidence*100,1)}%)।\n"
                    f"আমাদের মডেল শুধুমাত্র নিচের পোকাগুলো চেনে:\n{supported}।\n"
                    "অনুগ্রহ করে আক্রান্ত ফসলের পরিষ্কার ছবি তুলুন।"
                )
            else:
                msg = (
                    f"No recognizable pest found in this image (confidence: {round(confidence*100,1)}%).\n"
                    f"Our model can only identify these 10 pests: {supported}.\n"
                    "Please upload a clear, close-up photo of the affected crop or pest."
                )
            return {
                "success": False,
                "message": msg,
                "confidence": round(confidence * 100, 2),
                "supported_pests": class_labels
            }
        
        # Get pest name
        pest_name = class_labels[pred_index]
        pest_name_clean = pest_name.lower().strip()
        
        # Get pesticide recommendations
        pesticides = pesticide_dict.get(pest_name_clean, "No pesticide found")
        
        # Generate LLM description
        llm_description = await generate_pest_description(pest_name, current_user.language)
        
        # Prepare response data (ensure no Firestore objects are present)
        timestamp_str = datetime.now().isoformat()
        
        pesticide_list = pesticides.split(", ") if isinstance(pesticides, str) else [pesticides]
        
        result = {
            "success": True,
            "pest": pest_name,
            "confidence": confidence,
            "confidence_percentage": round(confidence * 100, 2),
            "pesticides": pesticide_list,
            "description": llm_description["description"],
            "prevention_method": llm_description["prevention"],
            "timestamp": timestamp_str
        }
        
        # Store in Postgres user reports
        try:
            if current_user:
                scan_result = ScanResult(
                    user_id=current_user.id,
                    pest_name=pest_name,
                    confidence_pct=confidence,
                    description=llm_description["description"],
                    prevention_method=llm_description["prevention"],
                    pesticides=pesticide_list,
                    language=current_user.language
                )
                db.add(scan_result)
                db.commit()
        except Exception as db_err:
            print(f"Database Update Error: {db_err}")
            db.rollback()
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_pest_description(pest_name: str, language: str):
    """
    Generate precise pest description and traditional Indian natural/homemade remedies using Groq LLM
    """
    try:
        if not groq_client:
            raise ValueError("Groq client not initialized")

        if language == "bangla":
            prompt = f"""
আপনি একজন ভারতীয় ঐতিহ্যবাহী ও জৈব কৃষি বিশেষজ্ঞ।

পোকার নাম: {pest_name}

নিচের তথ্যগুলো অত্যন্ত সংক্ষিপ্ত এবং সুনির্দিষ্টভাবে দিন (প্রতিটি অংশ নতুন লাইনে শুরু করুন, কোনো বুলেট বা Markdown ছাড়া):

DESCRIPTION: ২টি সহজ বাক্যে এই পোকার পরিচয় ও ফসলের প্রধান ক্ষতি।
PREVENTION: ভারতের একটি নিরাপদ ঘরোয়া বা প্রাকৃতিক জৈব উপায় (যেমন- নিম-অস্ত্র, রসুন-লঙ্কা স্প্রে, বা কাঠের ছাই) যা সহজে ঘরে তৈরি করে পোকাটি দমন করা যায়। কোনো রাসায়নিক কীটনাশক উল্লেখ করবেন না।
"""
        else:
            prompt = f"""
You are a traditional Indian organic farming and pest management expert.

Pest name: {pest_name}

Provide the following precisely and directly (each on a new line, no markdown, no bullet points):

DESCRIPTION: A direct 1-2 sentence description of the pest and its target crop damage.
PREVENTION: One safe, traditional Indian homemade organic/natural remedy (e.g., Neem Astra, Garlic-Chilli extract, sour buttermilk, or wood ash spray) to control this pest. Do not recommend or list any chemical pesticides.
"""

        response = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional agricultural advisor specializing strictly in "
                        "traditional Indian organic remedies and natural homemade solutions. "
                        "Keep outputs extremely concise, precise, and direct."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            max_tokens=220,
            temperature=0.1
        )

        content = response.choices[0].message.content
        if not content or not content.strip():
            raise ValueError("Groq returned empty response")

        description = ""
        prevention = ""
        for line in content.strip().splitlines():
            line = line.strip()
            # Clean possible bold formatting markers
            clean_line = line.replace("**", "").replace("*", "").strip()
            if clean_line.upper().startswith("DESCRIPTION:"):
                description = clean_line.split(":", 1)[1].strip()
            elif clean_line.upper().startswith("PREVENTION:"):
                prevention = clean_line.split(":", 1)[1].strip()

        # Fallback split parsing
        if not description:
            parts = [l.strip() for l in content.strip().split('\n') if l.strip()]
            description = parts[0] if len(parts) > 0 else f"Control methods for {pest_name}."
            prevention = parts[1] if len(parts) > 1 else description

        return {"description": description, "prevention": prevention}

    except Exception as e:
        print(f"LLM Error: {e}")
        fallback_desc = (
            f"{pest_name} হল একটি সাধারণ কৃষি পোকা।"
            if language == 'bangla'
            else f"{pest_name} is a common agricultural pest."
        )
        fallback_prev = (
            "নিম তেল স্প্রে করুন অথবা ঘরোয়া নিম-রসুন জৈব কীটনাশক ব্যবহার করুন।"
            if language == 'bangla'
            else "Apply neem oil spray or prepare a homemade garlic-chilli extract spray."
        )
        return {"description": fallback_desc, "prevention": fallback_prev}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
