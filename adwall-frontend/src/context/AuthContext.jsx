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

    // FIX: localStorage ka user purana ho jaata hai. Admin ne KYC verify
    // kar diya ho ya role badla ho to bhi app ko pata nahi chalta tha —
    // isliye "KYC Verification Pending" banner verified owner ko bhi
    // dikhta rehta tha. Har page load pe server se fresh user le lo.
    if (token) {
      authService
        .getMe()
        .then(({ data }) => {
          const fresh = data.data.user || data.data;
          localStorage.setItem("user", JSON.stringify(fresh));
          setUser(fresh);
        })
        .catch(() => {
          // 401 hone pe api interceptor khud handle kar lega
        });
    }
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