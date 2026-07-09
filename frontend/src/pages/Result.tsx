import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Info,
  ShieldCheck,
  Zap,
  WifiOff,
  ServerCrash,
  RefreshCcw,
} from "lucide-react";
import { TRANSLATIONS } from "../translations";
import type { Language } from "../translations";
import api from "../axios/apiConfig";
import { toast } from "sonner";

interface User {
  id?: string;
  name?: string;
  phone?: string;
  language?: Language;
}

interface ResultData {
  pest: string;
  confidence_percentage: number;
  description: string;
  prevention_method: string;
  pesticides: string[];
}

interface ErrorState {
  type: "offline" | "server" | "network" | "not_pest";
  title: string;
  message: string;
  supportedPests?: string[];
  confidence?: number;
}

export default function Result() {
  const navigate = useNavigate();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Guard flag to prevent double-submitting during React StrictMode mount checks
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const initialize = async () => {
      const pendingImage = localStorage.getItem("pendingImage");

      if (!pendingImage) {
        navigate("/main");
        return;
      }

      setImageUri(pendingImage);

      const response = await api.get("/auth/profile");

      if (response.data.success) {
        const user = response.data.user;
        setUser(user);
        await analyzeImage(pendingImage, user);
      }
    };

    initialize();
  }, [navigate]);

  const analyzeImage = async (
    base64Image: string,
    currentUser: User,
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // 1. Check if device is actually offline before even trying
      if (!navigator.onLine) {
        throw new Error("OFFLINE");
      }

      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], "upload.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);

      const lang = currentUser?.language || "english";

      const response = await api.post("/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Single clean check
      if (response.data && response.data.success) {
        setResult({
          pest: response.data.pest || "Unknown Pest",
          confidence_percentage: response.data.confidence_percentage || 0,
          description: response.data.description || "No description available",
          prevention_method:
            response.data.prevention_method || "No prevention info available",
          pesticides: Array.isArray(response.data.pesticides)
            ? (response.data.pesticides as string[])
            : [],
        });

        toast.success(t.scanSuccess);
      } else {
        // Low confidence / random image — NOT a network error
        setError({
          type: "not_pest",
          title: lang === "bangla" ? "পোকা সনাক্ত হয়নি" : "No Pest Detected",
          message: response.data?.message || "Image not recognized.",
          supportedPests: response.data?.supported_pests || [],
          confidence: response.data?.confidence || 0,
        });

        toast.error(t.imageNotRecognized, {
          description: t.imageNotRecognizedDesc,
        });
      }
    } catch (err: unknown) {
      const errorObj = err as any;
      console.error("Analysis Error:", err);

      // Smart Error Categorization
      if (errorObj.message === "OFFLINE" || !navigator.onLine) {
        setError({
          type: "offline",
          title:
            user?.language === "bangla"
              ? "ইন্টারনেট সংযোগ নেই"
              : "No Internet Connection",
          message:
            user?.language === "bangla"
              ? "অনুগ্রহ করে আপনার ওয়াইফাই বা মোবাইল ডেটা চেক করুন।"
              : "Please check your Wi-Fi or mobile data and try again.",
        });
      } else if (errorObj.response) {
        // Backend threw a 500/400 error (e.g., Model missing, Groq API failed)
        setError({
          type: "server",
          title: "Analysis Failed",
          message:
            errorObj.response.data?.detail ||
            "The AI server encountered an error processing this image.",
        });
      } else {
        // Network Error (CORS, Server is turned off, wrong IP)
        setError({
          type: "network",
          title: "Server Unreachable",
          message: `Could not connect to localhost:8000. Make sure the Python backend is running.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Inside Result.tsx, above return
  const getPestName = () => {
    if (!result?.pest) return "";

    const name = result.pest.toLowerCase();

    // Array of your known keys from Translations.ts
    const keys = [
      "mole",
      "aphids",
      "cica",
      "beet",
      "blister",
      "legume",
      "corn",
      "miridae",
      "whitefly",
      "lycorma",
    ];

    // Find which key is contained in the API result
    const match = keys.find((key) => name.includes(key));

    // If match found, return the translated name from 't'.
    // Otherwise, return the raw name from the API.
    return match ? (t as any)[match] : result.pest;
  };

  const lang: Language = user?.language || user?.language || "english";
  const t = user ? TRANSLATIONS[lang] : TRANSLATIONS["english"];

  // --- 1. LOADING UI ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8 shadow-lg"></div>
        <h2 className="text-2xl font-bold text-gray-800 animate-pulse">
          {t.detectInstantly?.split(" ")[0] || "Analyzing"}...
        </h2>
        {/* <p className="text-gray-500 mt-2">Applying AI models to your crop</p> */}
      </div>
    );
  }

  // --- 2. ERROR UI ---
  if (error) {
    // Special card for random/non-pest images
    if (error.type === "not_pest") {
      const suggestionText =
        lang === "bangla"
          ? "আমরা কোনো পোকা সনাক্ত করতে পারিনি। মূল সমস্যাটি ছবির মানের: ছবিটি হয়তো পরিষ্কার নয় অথবা এটি কোনো পোকার ছবি নয়। অনুগ্রহ করে আক্রান্ত ফসলের বা পোকার একটি পরিষ্কার, আলোকিত এবং কাছাকাছি ছবি তুলুন।"
          : "We could not recognize a pest. The problem is the image quality: either the image is not clear or it does not contain a pest. Please take a clear, well-lit, and close-up photo of the affected crop or pest.";
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-gray-100">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {error.title}
              </h2>
            </div>

            {/* Simplified Suggestion Box */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-center">
              <p className="text-amber-800 text-sm leading-relaxed font-medium">
                {suggestionText}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/main")}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                {lang === "bangla" ? "ফিরে যান" : "Go Back"}
              </button>
              <button
                onClick={() => navigate("/main")}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCcw size={18} />
                {lang === "bangla" ? "আবার চেষ্টা" : "Try Again"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Network / server errors
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-gray-100">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${error.type === "offline" ? "bg-amber-50 text-amber-500" : "bg-red-50 text-red-500"}`}
          >
            {error.type === "offline" ? (
              <WifiOff size={48} />
            ) : (
              <ServerCrash size={48} />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {error.title}
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">{error.message}</p>

          <div className="flex gap-4">
            <button
              onClick={() => navigate("/main")}
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                if (imageUri && user) {
                  analyzeImage(imageUri, user);
                }
              }}
              className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. SUCCESS UI ---
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
      <div className="flex items-center mb-8 gap-4">
        <button
          onClick={() => navigate("/main")}
          className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:text-primary transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {t.detectionResult}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image Section */}
        <div className="relative group">
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white aspect-square relative bg-gray-100">
            <img
              src={imageUri ?? ""}
              alt="Crop"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>

            <div className="absolute bottom-10 left-10 right-10">
              <h2 className="text-white text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {getPestName()}
                {/* {result?.pest} */}
              </h2>
              {/*              
                <div className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full font-bold shadow-lg">
                <Check size={20} />
                {result?.confidence_percentage}% {t.match}
              </div>
              */}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          {/* Description */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 text-primary font-bold text-xl uppercase tracking-wider">
              <Info size={24} />
              <span>{t.description}</span>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              {result?.description}
            </p>
          </div>

          {/* Prevention */}
          <div className="bg-green-50 p-8 rounded-[2rem] border border-green-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 text-primary font-bold text-xl uppercase tracking-wider">
              <ShieldCheck size={24} />
              <span>{t.prevention}</span>
            </div>
            <p className="text-primary/90 text-lg leading-relaxed">
              {result?.prevention_method}
            </p>
          </div>

          {/* Pesticides */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6 text-amber-500 font-bold text-xl uppercase tracking-wider">
              <Zap size={24} />
              <span>{t.pesticides}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result?.pesticides.map((pest: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-primary/30 transition-colors"
                >
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-gray-700 font-medium">{pest}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/main")}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary-dark transition-all shadow-xl shadow-green-100 mt-4"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
}
