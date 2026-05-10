import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, History, User, Settings, Shield, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { TRANSLATIONS } from '../translations';
import '../styles/Profile.css';

const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : `http://${window.location.hostname}:8000`;

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!savedUser) {
      navigate('/');
      return;
    }
    setUser(savedUser);
    fetchProfile(savedUser.email);
  }, [navigate]);

  const fetchProfile = async (email) => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile/${email}`);
      if (response.data.success) {
        setUserData(response.data.user);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  const reports = userData?.reports || [];
  const displayName = userData?.name || user.name || 'Farmer';
  const t = TRANSLATIONS[user.selectedLanguage || 'english'];

  return (
    <div className="profile-container">
      <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
        <button onClick={() => navigate('/main')} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
          <ChevronLeft size={28} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{t.profile}</h1>
        <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
          <Settings size={28} className="text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="profile-card">
          <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center text-primary mb-6 border-4 border-white shadow-inner">
            <User size={60} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-1">{displayName}</h2>
          <p className="text-gray-400 text-sm mb-6">{user.email || user.phone || 'No contact'}</p>
          <button className="px-8 py-3 rounded-full border border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all text-sm uppercase tracking-widest">
            {t.editProfile}
          </button>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="stats-container">
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">{reports.length}</p>
              <p className="text-white/60 text-sm font-medium uppercase tracking-widest">{t.detections}</p>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">0</p>
              <p className="text-white/60 text-sm font-medium uppercase tracking-widest">{t.saved}</p>
            </div>
          </div>

          <div className="history-container">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800">{t.recentDetections || t.history}</h3>
              <button className="text-primary font-bold text-sm hover:underline uppercase tracking-wider">{t.viewAll}</button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-4">
                {reports.slice().reverse().map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                      <Shield size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-lg">{item.pest}</h4>
                      <p className="text-gray-400 text-sm">{new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="text-primary font-bold text-xl">{Math.round(item.confidence * 100)}%</p>
                      <ChevronRight size={20} className="text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <History size={80} />
                <p className="mt-4 text-xl font-medium">{t.noHistory}</p>
              </div>
            )}
          </div>

          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full flex items-center justify-center gap-3 py-6 text-red-500 font-bold text-xl hover:bg-red-50 rounded-[2rem] transition-colors">
            <LogOut size={28} />
            {t.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
