// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { ChevronLeft, Shield, History, AlertCircle } from "lucide-react";

// import { TRANSLATIONS, type Language } from "../translations";
// import api from "../axios/apiConfig";

// import { Button } from "../components/ui/button";
// import { Card, CardContent } from "../components/ui/card";
// import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
// import { Badge } from "../components/ui/badge";
// import { Skeleton } from "../components/ui/skeleton";
// import { Progress } from "../components/ui/progress";

// interface User {
//   id?: string;
//   name?: string;
//   phone?: string;
//   language?: Language;
// }

// interface HistoryItem {
//   pest: string;
//   confidence?: number;
//   timestamp?: string;
//   pesticides?: string[];
// }

// export default function HistoryPage() {
//   const navigate = useNavigate();

//   const [user, setUser] = useState<User | null>(null);
//   const [history, setHistory] = useState<HistoryItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const lang: Language = user?.language || "english";
//   const t = TRANSLATIONS[lang];

//   const fetchUser = async () => {
//     try {
//       const response = await api.get("/auth/profile");

//       if (response.data.success) {
//         setUser(response.data.user);
//       }
//     } catch (err) {
//       console.error("Error fetching user:", err);
//     }
//   };

//   const fetchHistory = async () => {
//     try {
//       const response = await api.get("/history");

//       if (response.data.success) {
//         setHistory(response.data.history || []);
//         console.log("Fetched history:", response.data.history);
//       } else {
//         setHistory([]);
//       }
//     } catch (err) {
//       console.error("Error fetching history:", err);
//       setError(t.historyError);
//       setHistory([]);
//     }
//   };

//   useEffect(() => {
//     const init = async () => {
//       setLoading(true);

//       await Promise.all([fetchUser(), fetchHistory()]);

//       setLoading(false);
//     };

//     init();
//   }, []);

//   const formatDate = (timestamp?: string): string => {
//     if (!timestamp) return "—";

//     try {
//       return new Date(timestamp).toLocaleDateString(
//         lang === "bangla" ? "bn-BD" : "en-IN",
//         {
//           day: "numeric",
//           month: "short",
//           year: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//         },
//       );
//     } catch {
//       return "—";
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
//       {/* Header */}
//       <Card className="mb-8">
//         <CardContent className="flex items-center gap-4 p-6">
//           <Button variant="ghost" size="icon" onClick={() => navigate("/main")}>
//             <ChevronLeft className="h-6 w-6" />
//           </Button>

//           <div className="flex items-center gap-3">
//             <History className="h-6 w-6 text-primary" />

//             <h1 className="text-2xl font-bold">{t.historyTitle}</h1>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Loading */}
//       {loading && (
//         <div className="space-y-4">
//           {[1, 2, 3].map((item) => (
//             <Card key={item}>
//               <CardContent className="p-6">
//                 <div className="flex gap-4">
//                   <Skeleton className="h-14 w-14 rounded-xl" />

//                   <div className="flex-1 space-y-2">
//                     <Skeleton className="h-5 w-40" />
//                     <Skeleton className="h-4 w-28" />
//                   </div>

//                   <Skeleton className="h-10 w-16" />
//                 </div>

//                 <Skeleton className="h-2 w-full mt-4" />
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Error */}
//       {!loading && error && (
//         <Alert variant="destructive" className="mb-6">
//           <AlertCircle className="h-4 w-4" />

//           <AlertTitle>
//             {lang === "bangla" ? "সংযোগ সমস্যা" : "Connection Error"}
//           </AlertTitle>

//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       {/* Empty State */}
//       {!loading && !error && history.length === 0 && (
//         <Card>
//           <CardContent className="flex flex-col items-center text-center py-16">
//             <History className="h-14 w-14 text-muted-foreground mb-4" />

//             <h2 className="text-2xl font-semibold">{t.noScanFound}</h2>

//             <p className="text-muted-foreground mt-2 max-w-sm">
//               {t.noScanBody}
//             </p>

//             <Button className="mt-6" onClick={() => navigate("/main")}>
//               {t.startScanning}
//             </Button>
//           </CardContent>
//         </Card>
//       )}

//       {/* History */}
//       {!loading && !error && history.length > 0 && (
//         <div className="space-y-4">
//           {/* Stats */}
//           <Card>
//             <CardContent className="flex items-center justify-between p-6">
//               <div>
//                 <p className="text-sm text-muted-foreground">{t.totalScans}</p>

//                 <p className="text-4xl font-bold">{history.length}</p>

//                 <p className="text-sm text-muted-foreground">
//                   {t.scansCompleted}
//                 </p>
//               </div>

//               <Shield className="h-10 w-10 text-primary" />
//             </CardContent>
//           </Card>

//           {history
//             .slice()
//             .reverse()
//             .map((item, index) => {
//               const confidence = (item.confidence || 0) * 100;

//               return (
//                 <Card key={index} className="transition-all hover:shadow-md">
//                   <CardContent className="p-6">
//                     <div className="flex items-center gap-4">
//                       <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
//                         <Shield className="h-6 w-6 text-primary" />
//                       </div>

//                       <div className="flex-1 min-w-0">
//                         <h3 className="font-semibold truncate">{item.pest}</h3>

//                         <p className="text-sm text-muted-foreground">
//                           {formatDate(item.timestamp)}
//                         </p>
//                       </div>

//                       <div className="text-right">
//                         <p className="text-xl font-bold">{confidence}%</p>

//                         <p className="text-xs text-muted-foreground">
//                           {t.confidence}
//                         </p>
//                       </div>
//                     </div>

//                     <Progress value={confidence} className="mt-4" />

//                     {item.pesticides && item.pesticides.length > 0 && (
//                       <div className="mt-4 flex flex-wrap gap-2">
//                         {item.pesticides.slice(0, 3).map((pesticide, i) => (
//                           <Badge key={i} variant="secondary">
//                             {pesticide}
//                           </Badge>
//                         ))}

//                         {item.pesticides.length > 3 && (
//                           <Badge variant="outline">
//                             +{item.pesticides.length - 3}{" "}
//                             {lang === "bangla" ? "আরো" : "more"}
//                           </Badge>
//                         )}
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               );
//             })}
//         </div>
//       )}
//     </div>
//   );
// }






import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield, History, AlertCircle } from "lucide-react";

import { TRANSLATIONS, type Language } from "../translations";
import api from "../axios/apiConfig";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Progress } from "../components/ui/progress";

interface User {
  id?: string;
  name?: string;
  phone?: string;
  language?: Language;
}

interface HistoryItem {
  pest: string;
  confidence?: number;
  timestamp?: string;
  pesticides?: string[];
}

export default function HistoryPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lang: Language = user?.language || "english";
  const t = TRANSLATIONS[lang];

  const fetchUser = async () => {
    try {
      const response = await api.get("/auth/profile");

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get("/history");

      if (response.data.success) {
        setHistory(response.data.history || []);
        console.log("Fetched history:", response.data.history);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(t.historyError);
      setHistory([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      await Promise.all([fetchUser(), fetchHistory()]);

      setLoading(false);
    };

    init();
  }, []);

  const formatDate = (timestamp?: string): string => {
    if (!timestamp) return "—";

    try {
      return new Date(timestamp).toLocaleDateString(
        lang === "bangla" ? "bn-BD" : "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      );
    } catch {
      return "—";
    }
  };

  // Inside HistoryPage component, above return
const translatePestName = (rawPestName: string) => {
  if (!rawPestName) return "—";

  const name = rawPestName.toLowerCase();
  
  // These keys should match your Translation file property names
  const keys = [
    "mole", "aphids", "cica", "beet", "blister", 
    "legume", "corn", "miridae", "whitefly", "lycorma"
  ];

  const match = keys.find(key => name.includes(key));

  // If a match is found in translations (t), return it. Otherwise, return raw English.
  return match ? (t as any)[match] : rawPestName;
};

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
      {/* Header */}
      <Card className="mb-8">
        <CardContent className="flex items-center gap-4 p-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/main")}>
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-bold">{t.historyTitle}</h1>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-14 w-14 rounded-xl" />

                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>

                  <Skeleton className="h-10 w-16" />
                </div>

                <Skeleton className="h-2 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />

          <AlertTitle>
            {lang === "bangla" ? "সংযোগ সমস্যা" : "Connection Error"}
          </AlertTitle>

          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && history.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center text-center py-16">
            <History className="h-14 w-14 text-muted-foreground mb-4" />

            <h2 className="text-2xl font-semibold">{t.noScanFound}</h2>

            <p className="text-muted-foreground mt-2 max-w-sm">
              {t.noScanBody}
            </p>

            <Button className="mt-6" onClick={() => navigate("/main")}>
              {t.startScanning}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {!loading && !error && history.length > 0 && (
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalScans}</p>

                <p className="text-4xl font-bold">{history.length}</p>

                <p className="text-sm text-muted-foreground">
                  {t.scansCompleted}
                </p>
              </div>

              <Shield className="h-10 w-10 text-primary" />
            </CardContent>
          </Card>

          {history
            .slice()
            .reverse()
            .map((item, index) => {
              const confidence = (item.confidence || 0) * 100;

              return (
                <Card key={index} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{translatePestName(item.pest)}</h3>

                        <p className="text-sm text-muted-foreground">
                          {formatDate(item.timestamp)}
                        </p>
                      </div>
                      {/* 

                      <div className="text-right">
                        <p className="text-xl font-bold">{confidence}%</p>
                        <p className="text-xs text-muted-foreground">
                          {t.confidence}
                        </p>
                      </div>
                      */}
                    </div>

                    <Progress value={confidence} className="mt-4" />

                    {item.pesticides && item.pesticides.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.pesticides.slice(0, 3).map((pesticide, i) => (
                          <Badge key={i} variant="secondary">
                            {pesticide}
                          </Badge>
                        ))}

                        {item.pesticides.length > 3 && (
                          <Badge variant="outline">
                            +{item.pesticides.length - 3}{" "}
                            {lang === "bangla" ? "আরো" : "more"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
