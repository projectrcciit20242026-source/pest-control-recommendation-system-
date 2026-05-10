import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, User, History, Settings, Info } from 'lucide-react';

export default function Main() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

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
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12 bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
        <div>
          <h2 className="text-gray-500 text-lg">Hello,</h2>
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
        {/* Hero Section */}
        <div className="md:col-span-2 bg-gradient-to-br from-primary to-primary-light rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl min-h-[300px] flex flex-col justify-center">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold leading-tight mb-4">Detect Pests<br />Instantly</h2>
            <p className="text-white/80 text-lg max-w-sm mb-0">
              Upload a photo of the affected crop to get AI-powered results in seconds.
            </p>
          </div>
          <Camera className="absolute -right-10 -bottom-10 text-white/10" size={240} />
        </div>

        {/* Action Cards */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-50 flex flex-col items-center text-center group cursor-pointer hover:-translate-y-1 transition-all">
            <label className="cursor-pointer w-full flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ImageIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Image</h3>
              <p className="text-gray-500 text-sm">Select from your files</p>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-50 flex flex-col items-center text-center group cursor-pointer hover:-translate-y-1 transition-all">
            <div className="w-20 h-20 bg-green-50 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Camera size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Use Camera</h3>
            <p className="text-gray-500 text-sm">Snap a photo now</p>
          </div>
        </div>
      </div>

      {/* Stats/Info Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-50">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <History size={24} className="text-gray-400" />
            Recent Activity
          </h3>
          <p className="text-gray-400 italic bg-gray-50 p-6 rounded-2xl text-center">
            No recent detections found. Start by scanning a crop!
          </p>
        </div>

        <div className="bg-green-50 p-8 rounded-3xl border border-green-100 flex items-start gap-4">
          <div className="bg-white p-3 rounded-xl text-primary shadow-sm">
            <Info size={24} />
          </div>
          <div>
            <h3 className="font-bold text-primary text-lg mb-1">Expert Tip</h3>
            <p className="text-primary/80 text-sm leading-relaxed">
              Make sure the image is clear and well-lit for better accuracy. Focus on the pest or the damaged area.
            </p>
          </div>
        </div>
      </div>
      
      {/* Bottom Nav - Desktop version can be simpler */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-10 py-4 rounded-full shadow-2xl border border-gray-100 flex gap-12 z-50">
        <button className="text-primary flex flex-col items-center gap-1 group">
          <Camera size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold">Scan</span>
        </button>
        <button onClick={() => navigate('/profile')} className="text-gray-400 flex flex-col items-center gap-1 group hover:text-primary transition-colors">
          <History size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold">History</span>
        </button>
        <button className="text-gray-400 flex flex-col items-center gap-1 group hover:text-primary transition-colors">
          <Settings size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold">Settings</span>
        </button>
      </div>
    </div>
  );
}
