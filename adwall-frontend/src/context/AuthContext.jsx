// import { createContext, useContext, useState, useEffect, useCallback } from "react";
// import { authService } from "@/services/api";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // App load hone pe saved user restore karo
//   useEffect(() => {
//     const savedUser = localStorage.getItem("adwall_user");
//     const token = localStorage.getItem("accessToken");
//     if (savedUser && token) setUser(JSON.parse(savedUser));
//     setLoading(false);
//   }, []);

//   const login = useCallback(async (email, password) => {
//     const { data } = await authService.login({ email, password });
//     localStorage.setItem("accessToken", data.data.accessToken);
//     localStorage.setItem("adwall_user", JSON.stringify(data.data.user));
//     setUser(data.data.user);
//     return data.data.user;
//   }, []);

//   const register = useCallback(async (formData) => {
//     const { data } = await authService.register(formData);
//     localStorage.setItem("accessToken", data.data.accessToken);
//     localStorage.setItem("adwall_user", JSON.stringify(data.data.user));
//     setUser(data.data.user);
//     return data.data.user;
//   }, []);

//   const googleLogin = useCallback(async (idToken, role) => {
//     const { data } = await authService.googleLogin({ idToken, role });
//     localStorage.setItem("accessToken", data.data.accessToken);
//     localStorage.setItem("adwall_user", JSON.stringify(data.data.user));
//     setUser(data.data.user);
//     return data.data;
//   }, []);

//   const logout = useCallback(async () => {
//     try { await authService.logout(); } catch {}
//     localStorage.removeItem("accessToken");
//     localStorage.removeItem("adwall_user");
//     setUser(null);
//   }, []);

//   const updateUser = useCallback((updates) => {
//     setUser((prev) => {
//       const updated = { ...prev, ...updates };
//       localStorage.setItem("adwall_user", JSON.stringify(updated));
//       return updated;
//     });
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, updateUser, isAuthenticated: !!user }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
//   return ctx;
// };

import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App load pe localStorage se user restore karo
  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authService.login({ email, password });
    const { user: userData, accessToken } = data.data;

    // localStorage me save karo (cross-domain ke liye reliable)
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));

    // refreshToken bhi save karo (agar response mein aaya)
    if (data.data.refreshToken) {
      localStorage.setItem("refreshToken", data.data.refreshToken);
    }

    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const { data } = await authService.register(formData);
    const { user: userData, accessToken } = data.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));

    if (data.data.refreshToken) {
      localStorage.setItem("refreshToken", data.data.refreshToken);
    }

    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        // FIX: ye field missing tha. ProtectedRoute / Navbar / HoardingDetail
        // sab `isAuthenticated` use karte hain -> undefined mil raha tha ->
        // logged-in user bhi /login pe redirect hota tha, aur Login page use
        // wapas dashboard bhejta tha = infinite loop
        // ("Maximum update depth exceeded").
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};