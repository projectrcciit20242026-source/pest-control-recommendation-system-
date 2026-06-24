import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, LogOut, User, History, Phone } from "lucide-react";
import { TRANSLATIONS, type Language } from "../translations";
import api from "../axios/apiConfig";

interface UserData {
  id?: string;
  name?: string;
  phone?: string;
  language?: Language;
}

export default function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  const lang: Language = userData?.language || "english";

  const t = TRANSLATIONS[lang];

  const fetchProfile = async (): Promise<void> => {
    try {
      const response = await api.get(
        "/auth/profile",
      );

      if (response.data.success && response.data.user) {
        setUserData(response.data.user);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProfile();
  }, []);
  

  const handleLogout = (): void => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  if (!userData) return null;

  const displayName = userData?.name || "Farmer";

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8 pb-24">
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
        <button
          onClick={() => navigate("/main")}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <ChevronLeft size={28} className="text-gray-600" />
        </button>

        <h1 className="text-2xl font-bold text-gray-800">
          {t.profile || "Profile"}
        </h1>
      </div>

      {/* Avatar Card */}
      <div className="bg-white rounded-[2.5rem] shadow-lg border border-gray-50 p-10 flex flex-col items-center text-center mb-6">
        <div className="w-28 h-28 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center text-primary mb-5 shadow-inner">
          <User size={52} />
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-2">{displayName}</h2>

        <p className="text-gray-400 text-sm flex items-center gap-1">
          <Phone size={13} />
          {userData.phone || "—"}
        </p>
      </div>

      {/* Stats Card */}
      {/* {loading ? (
        <div className="bg-white rounded-3xl p-8 flex justify-center mb-6 border border-gray-50">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-primary rounded-[2rem] p-8 text-white mb-6 shadow-xl shadow-green-100">
          <p className="text-white/70 text-sm uppercase tracking-wider mb-1">
            {t.totalScans || "Total Pest Detections"}
          </p>

          <p className="text-5xl font-bold">{totalScans}</p>

          <p className="text-white/60 text-sm mt-2">
            {t.scansCompleted || "scans completed"}
          </p>
        </div>
      )} */}

      {/* History Button */}
      <button
        onClick={() => navigate("/history")}
        className="w-full bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-green-100 transition-all mb-4"
      >
        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-primary">
          <History size={24} />
        </div>

        <div className="text-left flex-1">
          <p className="font-bold text-gray-800">
            {t.historyTitle || "Scan History"}
          </p>

          {/* <p className="text-gray-400 text-sm">
            {totalScans} detection
            {totalScans !== 1 ? "s" : ""} recorded
          </p> */}
        </div>

        <ChevronLeft size={20} className="text-gray-300 rotate-180" />
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 py-5 text-red-500 font-bold text-lg hover:bg-red-50 rounded-2xl transition-colors mt-4 border border-red-100"
      >
        <LogOut size={24} />
        {t.logout || "Logout"}
      </button>
    </div>
  );
}
