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

interface UserData {
  id: string;
  name: string;
  phone: string;
  language: Language;
}

export default function Main() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<string>("--");
  const [humidity, setHumidity] = useState<string>("--");

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

  useEffect(() => {
    fetchUser();
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>

          <AlertDescription>Couldn't load user data.</AlertDescription>
        </Alert>

        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const t = user
    ? TRANSLATIONS[user.language || "english"]
    : TRANSLATIONS.english;

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-1 flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center text-white">
            <Leaf size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold leading-tight">AgriGuard</h1>
            <p className="text-xs leading-tight">
              Pest Detection & Recommendation System
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Button className="bg-green-600">Dashboard</Button>

          <Button variant="ghost" onClick={() => navigate("/history")}>
            {t.history}
          </Button>
        </nav>

        <div className="flex items-center gap-6">
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/profile")}>
                <Avatar>
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="leading-tight">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.phone}</p>
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
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <div className="max-w-4xl mx-auto md:py-6">
        {/* Sensor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 pt-3">
              <div className="p-3 rounded-xl bg-orange-50">
                <Thermometer color="orange" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>

                <p className="text-2xl font-bold">{temperature}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-3">
              <div className="p-3 rounded-xl bg-blue-50">
                <Droplets color="blue" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Humidity</p>

                <p className="text-2xl font-bold">{humidity}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Hero Banner */}
          <Card className="md:col-span-2 border-0 bg-gradient-to-br from-primary to-primary-light text-white overflow-hidden">
            <CardContent className="relative p-10 min-h-[300px] flex flex-col justify-center">
              <h2 className="text-4xl font-bold mb-4 whitespace-pre-line">
                {t.detectInstantly}
              </h2>

              <CardDescription className="text-white/80 text-lg max-w-sm">
                {t.heroSubtitle}
              </CardDescription>

              <Camera
                className="absolute -right-10 -bottom-10 text-white/10"
                size={240}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-6">
            <label className="block cursor-pointer">
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <ImageIcon size={40} />

                  <h3 className="mt-4 text-xl font-bold">{t.uploadImage}</h3>

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
              className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-50 flex flex-col items-center text-center group cursor-pointer hover:-translate-y-1 transition-all"
            >
              <div className="w-20 h-20 bg-green-50 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera size={40} />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {t.useCamera}
              </h3>

              <p className="text-gray-500 text-sm">{t.snapPhoto}</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t.recentActivity}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="italic text-muted-foreground text-center">
                {t.noActivity}
              </p>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />

            <AlertTitle>{t.expertTip}</AlertTitle>

            <AlertDescription>{t.tipBody}</AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/70 to-transparent">
            <h3 className="text-white font-bold text-xl">{t.useCamera}</h3>

            <button
              onClick={stopCamera}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white"
            >
              <X size={28} />
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
              <div className="w-64 h-64 border-2 border-white rounded-3xl" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center bg-gradient-to-t from-black/90 to-transparent pb-12">
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Aperture size={32} />
              </div>
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
