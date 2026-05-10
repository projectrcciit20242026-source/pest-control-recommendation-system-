import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, ShieldCheck, Zap, AlertTriangle, Check } from 'lucide-react';
import axios from 'axios';

const API_URL = "http://10.183.62.45:8000";

export default function Result() {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const pendingImage = localStorage.getItem('pendingImage');
    if (!pendingImage) {
      navigate('/main');
      return;
    }
    setImageUri(pendingImage);
    analyzeImage(pendingImage);
  }, [navigate]);

  const analyzeImage = async (base64Image) => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Convert base64 to File object
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], "upload.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/predict?language=${user.language || 'english'}&email=${user.email || ''}`, 
        formData, 
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server. Running in Demo Mode.");
      // Demo fallback
      setResult({
        success: true,
        pest: "Aphids (Demo)",
        confidence_percentage: 98,
        description: "Small sap-sucking insects that can cause significant damage to crops. They are often found in large colonies on the undersides of leaves.",
        prevention_method: "Use neem oil spray, introduce natural predators like ladybugs, or use specialized pesticides as listed below.",
        pesticides: ["Neem Oil", "Imidacloprid", "Malathion"]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-700">Analyzing Pest...</h2>
        <p className="text-gray-400 mt-2 text-lg">Consulting AI Agricultural Expert</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
      {/* Top Bar */}
      <div className="flex items-center mb-8 gap-4">
        <button 
          onClick={() => navigate('/main')}
          className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-600 hover:text-primary transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Detection Result</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column - Image */}
        <div className="relative group">
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white aspect-square relative">
            <img src={imageUri} alt="Scanned crop" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
            
            {result && (
              <div className="absolute bottom-10 left-10 right-10">
                <h2 className="text-white text-5xl font-bold mb-3">{result.pest}</h2>
                <div className="inline-flex items-center gap-2 bg-primary/90 text-white px-5 py-2 rounded-full font-bold text-lg backdrop-blur-sm">
                  <Check size={20} />
                  {result.confidence_percentage}% Match
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-8">
          {error && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-center gap-4 text-amber-800">
              <AlertTriangle size={32} className="shrink-0" />
              <div>
                <p className="font-bold">Offline Mode</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          )}

          {/* Description Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50">
            <div className="flex items-center gap-3 mb-4 text-primary font-bold text-xl uppercase tracking-wider">
              <Info size={24} />
              <span>Description</span>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">{result.description}</p>
          </div>

          {/* Prevention Card */}
          <div className="bg-green-50 p-8 rounded-[2rem] border border-green-100">
            <div className="flex items-center gap-3 mb-4 text-primary font-bold text-xl uppercase tracking-wider">
              <ShieldCheck size={24} />
              <span>Prevention Method</span>
            </div>
            <p className="text-primary/80 text-lg leading-relaxed">{result.prevention_method}</p>
          </div>

          {/* Pesticide Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50">
            <div className="flex items-center gap-3 mb-6 text-amber-500 font-bold text-xl uppercase tracking-wider">
              <Zap size={24} />
              <span>Recommended Pesticides</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.pesticides.map((pest, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 group hover:border-primary transition-all">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  </div>
                  <span className="text-gray-700 font-medium">{pest}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => navigate('/main')}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary-dark transition-all shadow-xl shadow-green-100"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
