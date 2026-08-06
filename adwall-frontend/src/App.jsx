import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import AppRoutes from "@/routes/AppRoutes";
import Chatbot from "@/components/Chatbot";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      {/* AI Chatbot — har page pe floating button */}
      <Chatbot />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
