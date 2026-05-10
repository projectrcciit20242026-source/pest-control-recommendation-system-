import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, ShieldCheck, Zap, Check } from 'lucide-react';
import axios from 'axios';
import { TRANSLATIONS } from '../translations';
import '../styles/Result.css';

const API_URL =
  window.location.hostname === 'localhost'
    ? "http://localhost:8000"
    : `http://${window.location.hostname}:8000`;

export default function Result() {
  const navigate = useNavigate();

  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Safe default state (NO null issues anymore)
  const [result, setResult] = useState({
    pest: "",
    confidence_percentage: 0,
    description: "",
    prevention_method: "",
    pesticides: []
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(savedUser);

    const pendingImage = localStorage.getItem('pendingImage');

    if (!pendingImage) {
      navigate('/main');
      return;
    }

    setImageUri(pendingImage);
    analyzeImage(pendingImage, savedUser);
  }, [navigate]);

  const analyzeImage = async (base64Image, currentUser) => {
    try {
      setLoading(true);

      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], "upload.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/predict?language=${currentUser?.selectedLanguage || 'english'}&email=${currentUser?.email || ''}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log("API RESPONSE:", response.data); // 🔍 Debug

      if (response.data && response.data.success) {
        // ✅ SAFE MAPPING
        setResult({
          pest: response.data.pest || "Unknown Pest",
          confidence_percentage: response.data.confidence_percentage || 0,
          description: response.data.description || "No description available",
          prevention_method: response.data.prevention_method || "No prevention info available",
          pesticides: Array.isArray(response.data.pesticides)
            ? response.data.pesticides
            : []
        });
      } else {
        setError(response.data?.message || "Something went wrong");
      }

    } catch (err) {
      console.error(err);

      setError("Connection error. Showing demo data.");

      // ✅ Fallback demo (safe)
      setResult({
        pest: "Aphids (Demo)",
        confidence_percentage: 98,
        description: "Small sap-sucking insects that damage crops.",
        prevention_method: "Use neem oil or natural predators like ladybugs.",
        pesticides: ["Neem Oil", "Imidacloprid"]
      });

    } finally {
      setLoading(false);
    }
  };

  const t = user
    ? TRANSLATIONS[user.selectedLanguage || 'english']
    : TRANSLATIONS['english'];

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-700">
          {t.detectInstantly?.split(' ')[0] || "Detecting"}...
        </h2>
      </div>
    );
  }

  // ✅ Error UI (optional but clean)
  if (error) {
    return (
      <div className="loading-screen">
        <h2 className="text-xl text-red-500 mb-4">{error}</h2>
        <button
          onClick={() => navigate('/main')}
          className="px-6 py-3 bg-primary text-white rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="result-container">
      <div className="flex items-center mb-8 gap-4">
        <button
          onClick={() => navigate('/main')}
          className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <ChevronLeft size={28} />
        </button>

        <h1 className="text-2xl font-bold text-gray-800">
          {t.detectionResult}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Image Section */}
        <div className="image-wrapper">
          <img
            src={imageUri}
            alt="Crop"
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-10 left-10 right-10">
            <h2 className="text-white text-5xl font-bold mb-3">
              {result?.pest || "Unknown"}
            </h2>

            <div className="inline-flex items-center gap-2 bg-primary/90 text-white px-5 py-2 rounded-full font-bold">
              <Check size={20} />
              {result?.confidence_percentage || 0}% {t.match}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-8">

          {/* Description */}
          <div className="info-box">
            <div className="flex items-center gap-3 mb-4 text-primary font-bold text-xl uppercase">
              <Info size={24} />
              <span>{t.description}</span>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed">
              {result?.description || "No description available"}
            </p>
          </div>

          {/* Prevention */}
          <div className="prevention-box">
            <div className="flex items-center gap-3 mb-4 text-primary font-bold text-xl uppercase">
              <ShieldCheck size={24} />
              <span>{t.prevention}</span>
            </div>

            <p className="text-primary/80 text-lg leading-relaxed">
              {result?.prevention_method || "No prevention info"}
            </p>
          </div>

          {/* Pesticides */}
          <div className="info-box">
            <div className="flex items-center gap-3 mb-6 text-amber-500 font-bold text-xl uppercase">
              <Zap size={24} />
              <span>{t.pesticides}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(result?.pesticides || []).map((pest, idx) => (
                <div key={idx} className="pesticide-item">
                  <span className="text-gray-700 font-medium">{pest}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/main')}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-xl shadow-xl"
          >
            {t.done}
          </button>

        </div>
      </div>
    </div>
  );
}