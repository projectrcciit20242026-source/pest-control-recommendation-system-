import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster position="bottom-right" richColors />
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </StrictMode>,
);
