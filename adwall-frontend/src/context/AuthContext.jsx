import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "@/services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App load hone pe saved user restore karo
  useEffect(() => {
    const savedUser = localStorage.getItem("adwall_user");
    const token = localStorage.getItem("accessToken");
    if (savedUser && token) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("adwall_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("adwall_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const googleLogin = useCallback(async (idToken, role) => {
    const { data } = await authService.googleLogin({ idToken, role });
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("adwall_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("adwall_user");
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("adwall_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
