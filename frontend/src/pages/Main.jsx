import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, User, History, Settings, Info } from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import '../styles/Main.css';

export default function Main() {
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/');
    } else {
      setUser(parseSafe(savedUser));
    }

    // Detect if device is mobile/tablet
    const checkDevice = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent));
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [navigate]);

  const parseSafe = (data) => {
    try { return JSON.parse(data); } catch { return null; }
  };

  const t = user ? TRANSLATIONS[user.selectedLanguage || 'english'] : TRANSLATIONS['english'];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('pendingImage', reader.result);
        navigate('/result');
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="main-container">
      <div className="header-card">
        <div>
          <h2 className="text-gray-500 text-lg">{t.hello},</h2>
          <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-primary hover:bg-green-100 transition-colors shadow-inner"
        >
          <User size={30} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="hero-card">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold leading-tight mb-4">{t.detectInstantly.split(' ').join('\n')}</h2>
            <p className="text-white/80 text-lg max-w-sm mb-0">
              {t.heroSubtitle}
            </p>
          </div>
          <Camera className="absolute -right-10 -bottom-10 text-white/10" size={240} />
        </div>

        <div className="space-y-6">
          <div className="action-card">
            <label className="cursor-pointer w-full flex flex-col items-center">
              <div className="icon-box bg-blue-50 text-blue-600">
                <ImageIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t.uploadImage}</h3>
              <p className="text-gray-500 text-sm">{t.fromFiles}</p>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>

          {isMobile && (
            <div className="action-card">
              <label className="cursor-pointer w-full flex flex-col items-center">
                <div className="icon-box bg-green-50 text-primary">
                  <Camera size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{t.useCamera}</h3>
                <p className="text-gray-500 text-sm">{t.snapPhoto}</p>
                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-50">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <History size={24} className="text-gray-400" />
            {t.recentActivity}
          </h3>
          <p className="text-gray-400 italic bg-gray-50 p-6 rounded-2xl text-center">
            {t.noActivity}
          </p>
        </div>

        <div className="info-card">
          <div className="bg-white p-3 rounded-xl text-primary shadow-sm">
            <Info size={24} />
          </div>
          <div>
            <h3 className="font-bold text-primary text-lg mb-1">{t.expertTip}</h3>
            <p className="text-primary/80 text-sm leading-relaxed">
              {t.tipBody}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bottom-nav">
        <button className="text-primary flex flex-col items-center gap-1 group">
          <Camera size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold">{t.scan}</span>
        </button>
        <button onClick={() => navigate('/profile')} className="text-gray-400 flex flex-col items-center gap-1 group hover:text-primary transition-colors">
          <History size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold">{t.history}</span>
        </button>
        <button className="text-gray-400 flex flex-col items-center gap-1 group hover:text-primary transition-colors">
          <Settings size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold">{t.settings}</span>
        </button>
      </div>
    </div>
  );
}
