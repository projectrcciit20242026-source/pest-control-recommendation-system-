import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  LogOut,
  User,
  History,
  Phone,
  KeyRound,
} from "lucide-react";
import { TRANSLATIONS, type Language } from "../translations";
import api from "../axios/apiConfig";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";
import ChangePasswordModal from "./components/ChangePasswordModal";

interface UserData {
  id?: string;
  name?: string;
  phone?: string;
  language: Language;
}

export default function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] =
    useState(false);

  const lang: Language = userData?.language || "english";

  const t = TRANSLATIONS[lang];

  const fetchProfile = async (): Promise<void> => {
    try {
      const response = await api.get("/auth/profile");

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
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8 pb-24">
      {/* Top Bar */}
      <Card className="mb-8 rounded-3xl shadow-sm border-gray-50">
        <CardContent className="flex items-center gap-4 p-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/main")}
            className="rounded-xl hover:bg-gray-50"
          >
            <ChevronLeft size={28} className="text-gray-600" />
          </Button>

          <h1 className="text-2xl font-bold text-gray-800">
            {t.profile || "Profile"}
          </h1>
        </CardContent>
      </Card>

      {/* Avatar Card */}
      <Card className="rounded-[2.5rem] shadow-lg border-gray-50 mb-6">
        <CardContent className="p-10 flex flex-col items-center text-center">
          <Avatar className="w-28 h-28 mb-5 shadow-inner">
            <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-50 text-primary">
              <User size={52} />
            </AvatarFallback>
          </Avatar>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {displayName}
          </h2>

          <p className="text-gray-400 text-sm flex items-center gap-1">
            <Phone size={13} />
            {userData.phone || "—"}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="rounded-2xl shadow-sm border-gray-100 mb-4 overflow-hidden py-0">
        <CardContent className="p-0">
          <Button
            variant="ghost"
            onClick={() => navigate("/history")}
            className="w-full h-auto justify-start gap-4 p-5 rounded-none hover:bg-green-50/50 cursor-pointer"
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-primary shrink-0">
              <History size={24} />
            </div>

            <div className="text-left flex-1">
              <p className="font-bold text-gray-800">
                {t.historyTitle || "Scan History"}
              </p>
            </div>

            <ChevronLeft size={20} className="text-gray-300 rotate-180" />
          </Button>

          <Separator />

          <Button
            variant="ghost"
            onClick={() => setIsChangePasswordDialogOpen(true)}
            className="w-full h-auto justify-start gap-4 p-5 rounded-none hover:bg-green-50/50 cursor-pointer"
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-primary shrink-0">
              <KeyRound size={24} />
            </div>

            <div className="text-left flex-1">
              <p className="font-bold text-gray-800">
                {t.changePassword || "Change Password"}
              </p>
            </div>

            <ChevronLeft size={20} className="text-gray-300 rotate-180" />
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full h-auto flex items-center justify-center gap-3 py-5 text-red-500 font-bold text-lg hover:bg-red-50 hover:text-red-500 rounded-2xl border-red-100 mt-4"
      >
        <LogOut size={24} />
        {t.logout || "Logout"}
      </Button>

      <ChangePasswordModal
        isOpen={isChangePasswordDialogOpen}
        onOpenChange={setIsChangePasswordDialogOpen}
        lang={userData?.language}
      />
    </div>
  );
}
