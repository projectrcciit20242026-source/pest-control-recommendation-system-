import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_URL = "http://10.183.62.45:8000"; // Your existing backend IP

export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('english');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (name && email) {
      try {
        const response = await axios.post(`${API_URL}/auth/signup`, {
          name, email, language
        });
        
        if (response.data.success) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          navigate('/main');
        } else {
          alert(response.data.message || 'Login failed');
        }
      } catch (err) {
        console.error(err);
        // Fallback for offline testing
        localStorage.setItem('user', JSON.stringify({ name, email, language }));
        navigate('/main');
      }
    } else {
      alert('Please fill all fields');
    }
  };

  return (
    <div className="flex flex-col min-h-screen lg:flex-row">
      {/* Left Side - Brand */}
      <div className="flex flex-col justify-center p-12 text-white bg-primary lg:w-1/2 lg:min-h-screen">
        <h2 className="mb-2 text-2xl font-light opacity-80">Welcome to</h2>
        <h1 className="mb-6 font-bold text-7xl lg:text-8xl">PestoPiya</h1>
        <p className="max-w-md text-xl opacity-90">
          Identify crop pests instantly and get expert recommendations for sustainable farming.
        </p>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 bg-white lg:w-1/2">
        <div className="w-full max-w-md p-8 bg-white border border-gray-100 shadow-2xl rounded-3xl">
          <h2 className="mb-8 text-xl font-semibold text-gray-700 text-center">
            Select Language / ভাষা নির্বাচন করুন
          </h2>
          
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setLanguage('english')}
              className={`flex-1 py-3 rounded-xl border transition-all ${language === 'english' ? 'bg-green-50 border-primary text-primary font-bold' : 'border-gray-200 text-gray-500'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLanguage('bangla')}
              className={`flex-1 py-3 rounded-xl border transition-all ${language === 'bangla' ? 'bg-green-50 border-primary text-primary font-bold' : 'border-gray-200 text-gray-500'}`}
            >
              বাংলা
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-600">Full Name / নাম</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full p-4 pl-10 text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:ring-primary focus:border-primary"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-600">Email Address / ইমেইল</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full p-4 pl-10 text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:ring-primary focus:border-primary"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="flex items-center justify-center w-full py-4 text-white transition-all bg-primary rounded-xl hover:bg-primary-dark font-bold text-lg gap-2"
            >
              Get Started
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
