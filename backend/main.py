from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import numpy as np
import pandas as pd
import io
import os
from typing import Optional
from pydantic import BaseModel
from groq import Groq
import json
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import JWTError, jwt
from PIL import Image

# Database imports
from sqlalchemy.orm import Session
from database import get_db, init_db, User, ScanResult

load_dotenv()

# ==========================================
# CONFIGURATION
# ==========================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "pest_model.h5")
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "Pesticides.csv")

try:
    init_db()
except Exception as e:
    print(f"Database initialization error: {e}")

groq_client = None
try:
    import httpx
    groq_client = Groq(api_key=GROQ_API_KEY, http_client=httpx.Client())
    print("Groq client initialized successfully!")
except Exception as e:
    print(f"Groq client initialization error: {e}")

app = FastAPI(title="PestoPiya API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# LOAD MODEL & DATA
# ==========================================
try:
    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing import image as keras_image
    model = load_model(MODEL_PATH)
    print("Model loaded successfully!")
    print(f"Model input shape: {model.input_shape}")
    print(f"Model output shape: {model.output_shape}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

try:
    pesticide_df = pd.read_csv(CSV_PATH)
    pesticide_df["Pest Name"] = pesticide_df["Pest Name"].str.lower().str.strip()
    pesticide_dict = dict(zip(pesticide_df["Pest Name"], pesticide_df["Most Commonly Used Pesticides"]))
    print("Pesticide data loaded successfully!")
except Exception as e:
    pesticide_dict = {}
    print(f"Pesticide CSV load error: {e}")

# FIX 1: Class labels must exactly match the model's training order.
# Verify this against your model's training label_map / class_indices.
class_labels = [
    'Background',
    'Cicadellidae',
    'Lycorma delicatula',
    'Miridae',
    'aphids',
    'beet army worm',
    'blister beetle',
    'corn borer',
    'legume blister beetle',
    'mole cricket',
    'whitefly'
]

# ==========================================
# AUTH & MODELS
# ==========================================
class UserSignup(BaseModel):
    name: str
    language: str
    phone: str
    password: str

class UserLogin(BaseModel):
    name: str
    phone: str
    password: str
    language: str

class UpdateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TRANSLATIONS = {
    "english": {
        "user_already_exists": "User already exists. Try logging in.",
        "user_not_found": "User not found. Please create your account first.",
        "no_match": "No pest detected. Please take a clearer image of the crop.",
        "not_crop": "The image does not appear to contain a plant or agricultural context. Please take a clear photo of the affected crop.",
        "login_success": "Login successful",
        "signup_success": "Signup successful",
        "profile_updated": "Profile updated successfully"
    },
    "bangla": {
        "user_already_exists": "এই ফোন নম্বর দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট রয়েছে।",
        "user_not_found": "এই ফোন নম্বরের কোনো অ্যাকাউন্ট পাওয়া যায়নি।",
        "no_match": "কোনো পোকা সনাক্ত করা যায়নি। অনুগ্রহ করে ফসলের পরিষ্কার ছবি তুলুন।",
        "not_crop": "ছবিটিতে কোনো ফসল বা পাতা সনাক্ত করা যায়নি। অনুগ্রহ করে আক্রান্ত ফসলের একটি পরিষ্কার ছবি পুনরায় গ্রহণ করুন।",
        "login_success": "লগইন সফল হয়েছে",
        "signup_success": "সাইনআপ সফল হয়েছে",
        "profile_updated": "প্রোফাইল সফলভাবে আপডেট হয়েছে"
    }
}

def get_text(key: str, language: str) -> str:
    return TRANSLATIONS.get(language, {}).get(key, TRANSLATIONS["english"].get(key, key))

def create_access_token(user_id: str, phone: str) -> str:
    payload = {
        "sub": str(user_id),
        "phone": phone,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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
# FIX 2: BOTANICAL GUARD (rewritten without HSV)
# PIL does NOT support HSV mode — the original code was silently
# producing wrong pixel values. This version uses only RGB math.
# ==========================================
# def verify_botanical_content(img: Image.Image) -> bool:
#     """
#     RGB-only heuristic guard.
#     Rejects clear non-agricultural images (solid white/black backgrounds,
#     heavily skin-toned photos) while allowing pests on soil, leaves,
#     stems, and grey/white laboratory backgrounds.
#     """
#     img_rgb = img.convert("RGB").resize((100, 100))
#     pixels = list(img_rgb.getdata())

#     total = len(pixels)
#     organic_count = 0
#     skin_count = 0
#     near_white_count = 0
#     near_black_count = 0

#     for r, g, b in pixels:
#         brightness = (r + g + b) / 3

#         # Near-white (studio/document background)
#         if r > 220 and g > 220 and b > 220:
#             near_white_count += 1
#             continue

#         # Near-black
#         if brightness < 20:
#             near_black_count += 1
#             continue

#         # Green: leaves, stems, crops
#         if g > r and g > b and (g - r) > 10 and (g - b) > 5:
#             organic_count += 1

#         # Brown/tan/soil: earthy tones
#         elif r > g > b and (r - b) > 15 and brightness > 30:
#             organic_count += 1

#         # Grey-brown (dried insects, bark, soil)
#         elif abs(r - g) < 25 and abs(g - b) < 25 and 30 < brightness < 200:
#             organic_count += 1

#         # Skin tone detection (warm pinkish-red dominant)
#         if r > 95 and g > 40 and b > 20 and (r - g) > 20 and (r - b) > 20:
#             skin_count += 1

#     o_ratio = (organic_count / total) * 100
#     s_ratio = (skin_count / total) * 100
#     white_ratio = (near_white_count / total) * 100

#     print(f"DEBUG - Organic: {o_ratio:.1f}%, Skin: {s_ratio:.1f}%, White bg: {white_ratio:.1f}%")

#     # Block overwhelming face/skin images
#     if s_ratio > 85.0:
#         print("DEBUG - Rejected: too much skin tone")
#         return False

#     # Allow images with any meaningful organic content
#     # (includes grey-brown soil or bark, common in pest photos)
#     if o_ratio < 0.1:
#         # Exception: white/grey lab background with a small pest is OK
#         # (white background images where 70%+ is white but some organic exists)
#         if white_ratio > 70:
#             print("DEBUG - Allowed: lab background with organic subject")
#             return True
#         print("DEBUG - Rejected: no organic matter detected")
#         return False

#     return True



# def verify_botanical_content(img: Image.Image) -> bool:
    # 1. Convert to Array
    arr = np.array(img.convert("RGB").resize((100, 100)))
    R, G, B = arr[:,:,0], arr[:,:,1], arr[:,:,2]

    # 2. Calculate "Colorfulness" (Dynamic Variance)
    rg = np.absolute(R - G)
    yb = np.absolute(0.5 * (R + G) - B)
    
    # Standard deviation of color differences
    std_root = np.sqrt(np.std(rg)**2 + np.std(yb)**2)
    mean_root = np.sqrt(np.mean(rg)**2 + np.mean(yb)**2)
    colorfulness = std_root + (0.3 * mean_root)

    # 3. Calculate Green-to-Red Ratio (Dynamic Organic Check)
    # Real plants have significantly more Green than Red
    green_bias = np.mean(G) / (np.mean(R) + 1e-5)

    print(f"DEBUG - Dynamic Colorfulness: {colorfulness:.2f}, Green Bias: {green_bias:.2f}")

    # DYNAMIC RULES:
    # Documents/Walls usually have colorfulness < 15
    if colorfulness < 18.0 and green_bias < 1.1:
        print("REJECTED: Image is too chromatically flat (likely paper, wall, or grille)")
        return False
        
    return True


def verify_botanical_content(img: Image.Image) -> bool:
    arr = np.array(img.convert("RGB").resize((100, 100))).astype(np.float32)
    R, G, B = arr[:,:,0], arr[:,:,1], arr[:,:,2]

    # --- Colorfulness (your existing check) ---
    rg = np.absolute(R - G)
    yb = np.absolute(0.5 * (R + G) - B)
    std_root = np.sqrt(np.std(rg)**2 + np.std(yb)**2)
    mean_root = np.sqrt(np.mean(rg)**2 + np.mean(yb)**2)
    colorfulness = std_root + (0.3 * mean_root)

    green_bias = np.mean(G) / (np.mean(R) + 1e-5)

    # --- NEW: actual organic-pixel coverage ---
    # green (leaves/stems) OR brown/tan (soil, bark, insect bodies)
    is_green = (G > R) & (G > B) & ((G - R) > 8)
    is_brown = (R > G) & (G > B) & ((R - B) > 12) & (R < 200)
    organic_ratio = np.mean(is_green | is_brown)

    # --- NEW: flag flat paper/document backgrounds ---
    is_near_white = (R > 200) & (G > 200) & (B > 200)
    white_ratio = np.mean(is_near_white)

    print(f"DEBUG - Colorfulness: {colorfulness:.2f}, GreenBias: {green_bias:.2f}, "
          f"Organic%: {organic_ratio*100:.1f}, White%: {white_ratio*100:.1f}")

    # Reject flat/chromatically dead images (paper, wall, grille)
    if colorfulness < 18.0 and green_bias < 1.1:
        print("REJECTED: too chromatically flat")
        return False

    # NEW: Reject documents — mostly white background, almost no organic matter,
    # regardless of how "colorful" a stamp/signature makes it look
    if white_ratio > 40 and organic_ratio < 0.03:
        print("REJECTED: document/paper detected (white bg, no organic content)")
        return False

    # NEW: Require some minimum organic presence overall
    if organic_ratio < 0.02:
        print("REJECTED: insufficient organic (plant/soil/insect) content")
        return False

    return True

# ==========================================
# FIX 3: PREPROCESSING — match training exactly
# ==========================================
def preprocess_image(pil_img: Image.Image, target_size: tuple = (300, 300)) -> np.ndarray:
    """
    Preprocess image to match model training pipeline:
    - Convert to RGB (handles RGBA, palette images, etc.)
    - Resize using LANCZOS for best quality
    - Normalize to [0, 1]
    - Add batch dimension
    """
    # Ensure RGB (model trained on 3-channel images)
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")

    # Use LANCZOS (high quality downsampling, same as ImageDataGenerator default)
    img_resized = pil_img.resize(target_size, Image.LANCZOS)

    img_array = np.array(img_resized, dtype=np.float32)

    # FIX: ensure shape is (H, W, 3), not (H, W, 4)
    if img_array.shape[-1] == 4:
        img_array = img_array[:, :, :3]

    # Normalize to [0, 1] — matches rescale=1./255 in ImageDataGenerator
    img_array = img_array / 255.0

    # Add batch dimension -> (1, H, W, 3)
    return np.expand_dims(img_array, axis=0)


# ==========================================
# LLM GENERATION
# ==========================================
async def generate_pest_description(pest_name: str, language: str):
    try:
        if language == "bangla":
            prompt = (
                f"আপনি একজন মাঠ-পরীক্ষিত কৃষি বিশেষজ্ঞ। পোকার নাম: {pest_name}\n"
                "ঠিক দুটি লাইনে উত্তর দিন। কোনো ভূমিকা, মার্কডাউন বা তালিকা নয়।\n\n"
                "DESCRIPTION: প্রায় ১০০ শব্দে লিখুন। অবশ্যই নিম্নলিখিত বিষয়গুলো অন্তর্ভুক্ত করতে হবে — "
                "(১) এই পোকা মূলত কোন কোন ফসল বা গাছ আক্রমণ করে, "
                "(২) আক্রমণের পদ্ধতি (যেমন: কাটা, চোষা, মাটির নিচে বাস করা, পাতা খাওয়া ইত্যাদি), "
                "(৩) আক্রমণের ফলে ফসলের কী ক্ষতি হয় (ফলন কমা, গাছ মরা, পাতা ঝরা ইত্যাদি), এবং "
                "(৪) ক্ষেতে কীভাবে এই পোকা বা তার আক্রমণ চেনা/সনাক্ত করা যায় (দৃশ্যমান লক্ষণ, পোকার শারীরিক বৈশিষ্ট্য, ক্ষতিগ্রস্ত অংশের চেহারা)। "
                "তথ্য অবশ্যই সঠিক এবং পোকা-নির্দিষ্ট হতে হবে, সাধারণ বর্ণনা নয়।\n\n"
                "PREVENTION: প্রায় ১০০ শব্দে লিখুন। ভারতীয় কৃষি পরিস্থিতিতে ব্যবহৃত যত বেশি সম্ভব প্রাকৃতিক/জৈবিক প্রতিরোধ পদ্ধতি উল্লেখ করুন — "
                "যেমন প্রাকৃতিক শত্রু/পরজীবী পোকা ব্যবহার, ফাঁদ ফসল, ফসল আবর্তন, নিম তেল বা জৈব নির্যাস স্প্রে, আলোর ফাঁদ, "
                "জমি পরিষ্কার রাখা, মাটি চাষ, প্রতিরোধী জাত ব্যবহার ইত্যাদি — যেগুলো এই নির্দিষ্ট পোকার জন্য কার্যকর এবং ফসলের ক্ষতি বা পরিবেশের ক্ষতি কম করে। "
                "রাসায়নিক কীটনাশকের নাম উল্লেখ করবেন না।"
            )
        else:
            prompt = (
                f"You are a precision agricultural diagnostician. Pest: {pest_name}\n"
                "Respond with EXACTLY two lines. No preamble, no markdown, no bullet points.\n\n"
                "DESCRIPTION: Write approximately 100 words. You MUST cover all of the following — "
                "(1) which crops or plants this pest primarily attacks, "
                "(2) its feeding/attack mechanism (e.g. boring, sucking, soil-dwelling, chewing leaves, etc.), "
                "(3) the specific damage and effects caused (yield loss, wilting, stunted growth, dieback, etc.), and "
                "(4) how to identify this pest or its damage in the field (visible symptoms, physical features of the pest, appearance of affected plant parts). "
                "Information must be accurate and pest-specific, not generic.\n\n"
                "PREVENTION: Write approximately 100 words. List as many practical, natural/organic prevention methods as possible that are actually used in Indian farming conditions — "
                "such as biological control using natural predators/parasitoids, trap crops, crop rotation, neem oil or botanical sprays, light traps, field sanitation, "
                "soil tilling, resistant varieties, pheromone traps, etc. — focusing on methods effective for THIS specific pest with minimal harm to the crop or environment. "
                "Do not mention chemical pesticide names."
            )

        response = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a field-verified agricultural diagnostician. Every answer must be pest-specific, factually correct, and detailed. Strict output: DESCRIPTION line, then PREVENTION line. Nothing else."
                },
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            max_tokens=200 if language == "bangla" else 60,
            temperature=0.1
        )



        content = response.choices[0].message.content.strip()

        print("\n====================")
        print("RAW GROQ RESPONSE:")
        print(content)
        print("====================\n")
        description, prevention = "", ""

        for line in content.splitlines():
            clean = line.replace("**", "").strip()

            lower = clean.lower()

            if (
                lower.startswith("description:")
                or clean.startswith("বিবরণ:")
                ):
                description = clean.split(":", 1)[1].strip()

            elif (
                lower.startswith("prevention:")
                or clean.startswith("প্রতিরোধ:")
                ):
                prevention = clean.split(":", 1)[1].strip()


        # Fallback if parsing fails
        if not description or not prevention:

            print("\n===== FALLBACK ACTIVATED =====")

            parts = [p.strip() for p in content.split("\n") if p.strip()]

            if not description:
                description = (
                parts[0]
                if len(parts) >= 1
                else f"Common pest: {pest_name}"
            )

            if not prevention:
                prevention = (
                    parts[1]
                    if len(parts) >= 2
                    else "Consult a local agricultural expert."
                )


        return {"description": description, "prevention": prevention}

    except Exception as e:
        print(f"LLM generation error: {e}")
        return {
            "description": f"{pest_name} damages crops by feeding on plant tissue.",
            "prevention": "Apply neem oil spray or introduce natural predators."
        }


# ==========================================
# PREDICT ENDPOINT
# ==========================================
@app.post("/predict")
async def predict_pest(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    contents = await file.read()

    try:
        pil_img = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # ---- Botanical Guard ----
    if not verify_botanical_content(pil_img):
        return JSONResponse(content={
            "success": False,
            "message": get_text("not_crop", current_user.language),
            "confidence": 0.0,
            "supported_pests": class_labels
        })

    # ---- FIX 3: Use corrected preprocessor ----
    # Dynamically read target size from model instead of hardcoding
    try:
        _, h, w, _ = model.input_shape
        target_size = (w or 300, h or 300)
    except Exception:
        target_size = (300, 300)

    img_array = preprocess_image(pil_img, target_size=target_size)

    # ---- Prediction ----
    pred = model.predict(img_array, verbose=0)
    pred_index = int(np.argmax(pred[0]))
    confidence = float(np.max(pred[0]))

    # Debug: print full prediction distribution
    print(f"DEBUG - Predictions: { {class_labels[i]: round(float(pred[0][i]), 3) for i in range(len(class_labels))} }")
    print(f"DEBUG - Top prediction: {class_labels[pred_index]} ({confidence:.3f})")

    pest_name = class_labels[pred_index]
    CONFIDENCE_THRESHOLD = 0.35

    if pest_name == "Background" or confidence < CONFIDENCE_THRESHOLD:
        return JSONResponse(content={
            "success": False,
            "message": get_text("no_match", current_user.language),
            "confidence": round(confidence * 100, 2),
            "detected_as": pest_name,
            "supported_pests": [c for c in class_labels if c != "Background"]
        })

    # ---- Fetch data & LLM description ----
    pesticides_raw = pesticide_dict.get(pest_name.lower().strip(), "No specific pesticide found")
    llm_data = await generate_pest_description(pest_name, current_user.language)

    result = {
        "success": True,
        "pest": pest_name,
        "confidence": confidence,
        "confidence_percentage": round(confidence * 100, 2),
        "pesticides": [p.strip() for p in pesticides_raw.split(",") if p.strip()],
        "description": llm_data["description"],
        "prevention_method": llm_data["prevention"],
        "timestamp": datetime.now().isoformat()
    }

    # ---- Save to DB ----
    try:
        db.add(ScanResult(
            user_id=current_user.id,
            pest_name=pest_name,
            confidence_pct=confidence,
            description=llm_data["description"],
            prevention_method=llm_data["prevention"],
            pesticides=result["pesticides"],
            language=current_user.language
        ))
        db.commit()
    except Exception as e:
        print(f"DB save error: {e}")
        db.rollback()

    return JSONResponse(content=result)


# ==========================================
# AUTH ROUTES
# ==========================================
@app.post("/auth/signup")
async def signup(user: UserSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.phone == user.phone).first():
        return {"success": False, "message": get_text("user_already_exists", user.language)}
    new_user = User(
        name=user.name,
        phone=user.phone,
        password=pwd_context.hash(user.password),
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
            "phone": new_user.phone,
            "language": new_user.language
        }
    }

@app.post("/auth/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.phone == user.phone).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        return {"success": False, "message": get_text("user_not_found", user.language)}
    return {
        "success": True,
        "message": get_text("login_success", db_user.language),
        "token": create_access_token(db_user.id, db_user.phone),
        "user": {
            "id": str(db_user.id),
            "name": db_user.name,
            "phone": db_user.phone,
            "language": db_user.language
        }
    }

@app.get("/auth/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
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
async def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ScanResult)
        .filter(ScanResult.user_id == current_user.id)
        .order_by(ScanResult.scanned_at.desc())
        .all()
    )
    return {
        "success": True,
        "history": [
            {
                "pest": r.pest_name,
                "confidence_percentage": round(r.confidence_pct * 100, 2),
                "description": r.description,
                "prevention_method": r.prevention_method,
                "pesticides": r.pesticides,
                "timestamp": r.scanned_at.isoformat()
            }
            for r in records
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)   