import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
