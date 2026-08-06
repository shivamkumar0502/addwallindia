import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, setOnAuthFail } from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App load hone pe saved user restore karo
  useEffect(() => {
    (async () => {
      const [savedUser, token] = await Promise.all([
        AsyncStorage.getItem("adwall_user"),
        AsyncStorage.getItem("accessToken"),
      ]);
      if (savedUser && token) setUser(JSON.parse(savedUser));
      setLoading(false);
    })();

    // agar kabhi bhi 401 aaye to auto logout
    setOnAuthFail(() => setUser(null));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    await AsyncStorage.setItem("accessToken", data.data.accessToken);
    await AsyncStorage.setItem("adwall_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    await AsyncStorage.setItem("accessToken", data.data.accessToken);
    await AsyncStorage.setItem("adwall_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const googleLogin = useCallback(async (idToken, role) => {
    const { data } = await authService.googleLogin({ idToken, role });
    await AsyncStorage.setItem("accessToken", data.data.accessToken);
    await AsyncStorage.setItem("adwall_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    await AsyncStorage.multiRemove(["accessToken", "adwall_user"]);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("adwall_user", JSON.stringify(updated));
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
