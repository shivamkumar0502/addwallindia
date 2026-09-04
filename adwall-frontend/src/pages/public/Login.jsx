import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/api";
import GoogleButton from "@/components/common/GoogleButton";
import { Mail, Lock, Eye, EyeOff, Building2, Home, Users } from "lucide-react";

const dashboardFor = (role) =>
  role === "admin" ? "/admin/dashboard" : role === "owner" ? "/owner/dashboard" : "/client/dashboard";

/* Left panel ki billboard photo:
   adwall-frontend/public/auth-billboard.jpg
   Landscape photo rakho (kam se kam 1200x1600).
   File na ho to gradient background apne aap dikh jaayega. */
const HERO_IMAGE = "/auth-billboard.jpg";

const FEATURES = [
  { Icon: Building2, title: "For Advertisers", desc: "Find the best spaces to promote your brand", bg: "bg-indigo-500" },
  { Icon: Home, title: "For Property Owners", desc: "List your property and earn extra income", bg: "bg-green-600" },
  { Icon: Users, title: "For Agencies", desc: "Manage campaigns and clients easily", bg: "bg-orange-500" },
];

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [heroOk, setHeroOk] = useState(true);

  const { login, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (user && !redirected.current) {
      redirected.current = true;
      navigate(dashboardFor(user.role), { replace: true });
    }
  }, [user, navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(form.email.trim().toLowerCase(), form.password);
      navigate(dashboardFor(u.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login fail ho gaya. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setError("");
    setLoading(true);
    try {
      const { data } = await authService.googleLogin(credential);

      if (data.data.isNewUser) {
        sessionStorage.setItem("googleSignup", JSON.stringify(data.data.googleData));
        navigate("/register?google=1", { replace: true });
        return;
      }

      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      updateUser(data.data.user);
      navigate(dashboardFor(data.data.user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Google login fail ho gaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 py-10 px-4">
      <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[1fr_460px] lg:gap-0 lg:items-center">
        {/* ── Left: billboard visual ── */}
        <div className="relative hidden lg:block rounded-2xl overflow-hidden h-[620px] shadow-xl">
          {heroOk ? (
            <img
              src={HERO_IMAGE}
              alt=""
              onError={() => setHeroOk(false)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            /* Photo na ho to CSS se banaya hua billboard —
               plain blue box se behtar dikhta hai */
            <div className="absolute inset-0 bg-gradient-to-b from-sky-800 via-slate-800 to-slate-900">
              {/* Billboard frame */}
              <div className="absolute top-8 left-4 right-6">
                <div className="rounded-md bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 h-56 shadow-2xl flex items-center justify-center px-4">
                  <p className="text-white font-black text-3xl leading-tight tracking-tight -rotate-2 drop-shadow-lg">
                    YOUR
                    <br />
                    BRAND
                    <br />
                    HERE
                  </p>
                </div>
                {/* Support poles */}
                <div className="flex justify-around px-8">
                  <div className="w-2 h-24 bg-slate-700" />
                  <div className="w-2 h-24 bg-slate-700" />
                </div>
              </div>

              {/* City skyline silhouette */}
              <div className="absolute bottom-0 inset-x-0 flex items-end gap-1 px-2 opacity-60">
                {[38, 62, 30, 78, 46, 88, 34, 56, 70, 42].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}px` }}
                    className="flex-1 bg-slate-950 rounded-t-sm"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

          <div className="absolute bottom-0 inset-x-0 p-7 text-white">
            <h2 className="text-2xl font-black leading-tight drop-shadow">
              India ka #1 Outdoor
              <br />
              Advertising Marketplace
            </h2>
            <p className="mt-2 text-white/85 text-xs drop-shadow">
              Hoardings, billboards aur ad spaces — sab ek jagah.
            </p>
          </div>
        </div>

        {/* ── Right: form card (image ke upar overlap karta hua) ── */}
        <div className="lg:-ml-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 lg:p-9">
            {/* Logo — homepage jaisa hi format */}
            <Link to="/" className="flex items-center justify-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-sm">AW</span>
              </div>
              <span className="text-2xl font-black text-gray-900">
                AdWall <span className="text-brand-500">India</span>
              </span>
            </Link>
            <p className="text-[11px] text-gray-400 text-center mb-7">
              Every Wall. Every Brand. Everywhere.
            </p>

            <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
            <p className="text-sm text-gray-500 mt-1">Login to continue to your account</p>

            {error && (
              <div className="mt-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>

              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="w-full h-12 pl-11 pr-11 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Login"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <GoogleButton text="continue_with" onCredential={handleGoogle} onError={setError} />

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-brand-500 font-semibold hover:underline">
                Register Now
              </Link>
            </p>
          </div>

          {/* Feature strip — card ke neeche */}
          <div className="mt-6 space-y-3.5 px-2">
            {FEATURES.map(({ Icon, title, desc, bg }) => (
              <div key={title} className="flex gap-3.5 items-start">
                <div className={`h-11 w-11 shrink-0 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={19} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;