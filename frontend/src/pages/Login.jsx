import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { TRANSLATIONS } from '../translations';
import '../styles/Login.css';

const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : `http://${window.location.hostname}:8000`;

export default function Login() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState('email'); 
  const [language, setLanguage] = useState('english');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const t = TRANSLATIONS[language];

  const validate = () => {
    const newErrors = {};
    if (name.trim().length < 2) newErrors.name = t.errors.invalidName;
    
    if (contactType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact)) newErrors.contact = t.errors.invalidEmail;
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(contact)) newErrors.contact = t.errors.invalidPhone;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const payload = {
          name,
          language,
          [contactType]: contact
        };
        
        const response = await axios.post(`${API_URL}/auth/signup`, payload);
        
        if (response.data.success) {
          localStorage.setItem('user', JSON.stringify({ ...response.data.user, selectedLanguage: language }));
          navigate('/main');
        } else {
          alert(response.data.message || 'Login failed');
        }
      } catch (err) {
        console.error(err);
        localStorage.setItem('user', JSON.stringify({ 
          name, 
          [contactType]: contact, 
          selectedLanguage: language 
        }));
        navigate('/main');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="brand-section">
        <h2 className="mb-2 text-2xl font-light opacity-80">{t.welcome}</h2>
        <h1 className="mb-6 font-bold text-7xl lg:text-8xl">{t.brand}</h1>
        <p className="max-w-md text-xl opacity-90">{t.tagline}</p>
      </div>

      <div className="form-section">
        <div className="form-card">
          <h2 className="mb-8 text-xl font-semibold text-gray-700 text-center">
            {t.selectLang}
          </h2>
          
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setLanguage('english')}
              className={`lang-button ${language === 'english' ? 'lang-button-active' : 'lang-button-inactive'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLanguage('bangla')}
              className={`lang-button ${language === 'bangla' ? 'lang-button-active' : 'lang-button-inactive'}`}
            >
              বাংলা
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-600">{t.fullName}</label>
              <div className="input-wrapper">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if(errors.name) setErrors({...errors, name: null}); }}
                  className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                  placeholder={t.placeholderName}
                  required
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-600">
                {contactType === 'email' ? t.email : t.phone}
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setContactType('email'); setContact(''); setErrors({}); }}
                  className={`text-xs px-3 py-1 rounded-full border ${contactType === 'email' ? 'bg-primary text-white border-primary' : 'text-gray-500 border-gray-200'}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setContactType('phone'); setContact(''); setErrors({}); }}
                  className={`text-xs px-3 py-1 rounded-full border ${contactType === 'phone' ? 'bg-primary text-white border-primary' : 'text-gray-500 border-gray-200'}`}
                >
                  Phone
                </button>
              </div>
              <div className="input-wrapper">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {contactType === 'email' ? <Mail size={20} className="text-gray-400" /> : <Phone size={20} className="text-gray-400" />}
                </div>
                <input 
                  type={contactType === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={(e) => { setContact(e.target.value); if(errors.contact) setErrors({...errors, contact: null}); }}
                  className={`input-field ${errors.contact ? 'border-red-500' : ''}`}
                  placeholder={contactType === 'email' ? t.placeholderEmail : t.placeholderPhone}
                  required
                />
              </div>
              {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
            </div>

            <button type="submit" className="primary-button">
              {t.getStarted}
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
