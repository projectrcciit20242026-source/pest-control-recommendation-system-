import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Image as ImageIcon,
  History,
  Info,
  X,
  Aperture,
  Leaf,
  LogOut,
  Thermometer,
  Droplets,
  Bug,
} from "lucide-react";
import { TRANSLATIONS, type Language } from "../translations";
import { Item, ItemContent, ItemMedia, ItemTitle } from "../components/ui/item";
import { Spinner } from "../components/ui/spinner";
import { Button } from "../components/ui/button";
import api from "../axios/apiConfig";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import heroBannerImage from "../assets/heroBannerImage.jpg";

interface UserData {
  id: string;
  name: string;
  phone: string;
  language: Language;
}

interface HistoryItem {
  pest: string;
  confidence?: number;
  timestamp?: string;
  pesticides?: string[];
}

export default function Main() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<string>("--");
  const [humidity, setHumidity] = useState<string>("--");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchUser = async () => {
    try {
      const response = await api.get("/auth/profile");

      if (response.data.success) {
        setUser(response.data.user);
        setLoading(false);
        return;
      }

      setError(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(true);
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m`,
          );

          const data = await response.json();

          setTemperature(`${data.current.temperature_2m}°C`);
          setHumidity(`${data.current.relative_humidity_2m}%`);
        } catch (error) {
          console.error("Failed to fetch weather:", error);
        }
      },
      (error) => {
        console.error("Location error:", error);
      },
    );
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get("/history");

      if (response.data.success) {
        setHistory(response.data.history || []);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setHistoryError(t.historyError);
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchWeather();
    fetchHistory();
  }, []);

  const t = user
    ? TRANSLATIONS[user.language || "english"]
    : TRANSLATIONS.english;

  useEffect(() => {
    if (!t.tipBody.length) return;

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => {
        let next = prev;

        // Ensure a different random tip
        while (next === prev && t.tipBody.length > 1) {
          next = Math.floor(Math.random() * t.tipBody.length);
        }

        return next;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [t.tipBody.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="flex w-full max-w-xs flex-col gap-4">
          <Item variant="muted">
            <ItemMedia>
              <Spinner />
            </ItemMedia>

            <ItemContent>
              <ItemTitle>Loading user data...</ItemTitle>
            </ItemContent>
          </Item>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>

          <AlertDescription>Couldn't load user data.</AlertDescription>
        </Alert>

        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        localStorage.setItem("pendingImage", reader.result);
        navigate("/result");
      }
    };

    reader.readAsDataURL(file);
  };

  const startCamera = async (): Promise<void> => {
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);

      alert("Unable to access camera. Please check browser permissions.");

      setShowCamera(false);
    }
  };

  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setShowCamera(false);
  };

  const capturePhoto = (): void => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL("image/jpeg", 0.9);

    stopCamera();

    localStorage.setItem("pendingImage", base64Image);

    navigate("/result");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const translatePestName = (rawPestName: string) => {
    if (!rawPestName) return "—";

    const name = rawPestName.toLowerCase();

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

    const match = keys.find((key) => name.includes(key));

    return match ? (t as any)[match] : rawPestName;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-green-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <Leaf size={20} className="sm:hidden" />
              <Leaf size={22} className="hidden sm:block" />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">
                {t.brand}
              </h1>
              <p className="text-xs leading-tight hidden sm:block">
                {t.brand_desc}
              </p>
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-3 sm:gap-6 order-2">
            <Tooltip>
              <TooltipTrigger>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate("/profile")}
                >
                  <Avatar>
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="leading-tight hidden sm:block max-w-[140px] md:max-w-none">
                    <p className="text-sm font-semibold truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.phone}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Profile</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 text-red-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-2 w-full order-3 sm:w-auto sm:order-1 sm:ml-4">
            <Button className="bg-green-600 flex-1 sm:flex-none" size="sm">
              {t.dashboard}
            </Button>

            <Button
              variant="ghost"
              className="flex-1 sm:flex-none"
              size="sm"
              onClick={() => navigate("/history")}
            >
              {t.history}
            </Button>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        {/* Sensor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 pt-3">
              <div className="p-3 rounded-xl bg-orange-50 shrink-0">
                <Thermometer color="orange" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t.temperature}</p>

                <p className="text-xl sm:text-2xl font-bold">{temperature}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-3">
              <div className="p-3 rounded-xl bg-blue-50 shrink-0">
                <Droplets color="blue" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t.humidity}</p>

                <p className="text-xl sm:text-2xl font-bold">{humidity}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Hero Banner */}
          <Card className="md:col-span-2 overflow-hidden border-0">
            <CardContent className="relative min-h-[220px] sm:min-h-[280px] md:h-full md:min-h-[300px] p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${heroBannerImage})`,
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/20" />

              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">
                  {t.detectInstantly}
                </h2>

                <CardDescription className="text-white/80 text-base sm:text-lg max-w-sm">
                  {t.heroSubtitle}
                </CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4 sm:space-y-6">
            <label className="block cursor-pointer">
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-5 sm:p-8 flex flex-col items-center text-center">
                  <ImageIcon size={32} className="sm:hidden" />
                  <ImageIcon size={40} className="hidden sm:block" />

                  <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold">
                    {t.uploadImage}
                  </h3>

                  <p className="text-sm text-muted-foreground">{t.fromFiles}</p>
                </CardContent>
              </Card>

              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>

            <div
              onClick={startCamera}
              className="bg-white p-5 sm:p-8 rounded-[2rem] shadow-lg border border-gray-50 flex flex-col items-center text-center group cursor-pointer hover:-translate-y-1 transition-all"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 text-primary rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Camera size={32} className="sm:hidden" />
                <Camera size={40} className="hidden sm:block" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                {t.useCamera}
              </h3>

              <p className="text-gray-500 text-sm">{t.snapPhoto}</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t.recentActivity}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {history.length > 0 ? (
                <ScrollArea className="h-48 pr-3">
                  <div className="space-y-4">
                    {history.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                            <Bug className="h-5 w-5 text-primary" />
                          </div>
                          {index !== history.length - 1 && (
                            <div className="mt-2 h-full w-px bg-border" />
                          )}
                        </div>

                        <div className="flex-1 rounded-lg border p-4 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="font-semibold truncate">
                              {translatePestName(item.pest)}
                            </h4>

                            <Badge>{t.recentActivityDetected}</Badge>
                          </div>

                          <p className="mt-2 text-sm text-muted-foreground">
                            {item.timestamp &&
                              new Date(item.timestamp).toLocaleDateString(
                                user?.language === "bangla" ? "bn-BD" : "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="py-6 text-center italic text-muted-foreground">
                  {t.noActivity}
                </p>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />

            <AlertTitle>{t.expertTip}</AlertTitle>

            <AlertDescription className="relative min-h-12 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTipIndex}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                >
                  {t.tipBody[currentTipIndex]}
                </motion.p>
              </AnimatePresence>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/70 to-transparent">
            <h3 className="text-white font-bold text-lg sm:text-xl">
              {t.useCamera}
            </h3>

            <button
              onClick={stopCamera}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center text-white shrink-0"
            >
              <X size={24} className="sm:hidden" />
              <X size={28} className="hidden sm:block" />
            </button>
          </div>

          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
              <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-white rounded-3xl" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex justify-center items-center bg-gradient-to-t from-black/90 to-transparent pb-10 sm:pb-12">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white/50 flex items-center justify-center"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center">
                <Aperture size={28} className="sm:hidden" />
                <Aperture size={32} className="hidden sm:block" />
              </div>
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}