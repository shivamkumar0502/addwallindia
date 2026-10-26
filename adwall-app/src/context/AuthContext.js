import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, setOnAuthFail } from "../api/api";

const AuthContext = createContext(null);

// FIX: pehle sirf accessToken save hota tha. Access token 15 min me expire
// hota hai aur RN me cookie jar nahi hota — matlab refresh kabhi chal hi
// nahi sakta tha aur user har 15 min me logout ho jaata tha.
// Ab refreshToken bhi AsyncStorage me jaata hai; api.js usko body me
// bhej ke naya access token le leta hai.
const saveSession = async (data) => {
  const pairs = [
    ["accessToken", data.accessToken],
    ["adwall_user", JSON.stringify(data.user)],
  ];
  if (data.refreshToken) pairs.push(["refreshToken", data.refreshToken]);
  await AsyncStorage.multiSet(pairs);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingIntent, setBookingIntent] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [savedUser, token] = await Promise.all([
          AsyncStorage.getItem("adwall_user"),
          AsyncStorage.getItem("accessToken"),
        ]);
        if (savedUser && token) setUser(JSON.parse(savedUser));
      } catch {
        // Invalid or unavailable stored sessions must not trap startup on a spinner.
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    setOnAuthFail(() => setUser(null));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({
      email: String(email).trim().toLowerCase(),
      password,
    });
    await saveSession(data.data);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  // formData me ab `verifyToken` bhi hona chahiye — backend OTP verification
  // ke bina register accept nahi karta.
  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    await saveSession(data.data);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  // FIX: backend `{ token }` expect karta hai, pehle `{ idToken, role }`
  // bheja jaa raha tha — isliye Google login hamesha fail hota tha.
  const googleLogin = useCallback(async (idToken) => {
    const { data } = await authService.googleLogin(idToken);
    if (!data.data.isNewUser) {
      await saveSession(data.data);
      setUser(data.data.user);
    }
    return data.data; // { isNewUser, googleData } ya { user, tokens }
  }, []);

  // Google se naya user — role aur mobile bharne ke baad
  const googleComplete = useCallback(async (payload) => {
    const { data } = await authService.googleComplete(payload);
    await saveSession(data.data);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "adwall_user"]);
    setUser(null);
    setBookingIntent(null);
  }, []);

  const updateUser = useCallback(async (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("adwall_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        bookingIntent,
        setBookingIntent,
        login,
        register,
        googleLogin,
        googleComplete,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};