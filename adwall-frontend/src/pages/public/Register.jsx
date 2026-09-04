import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService, otpService } from "@/services/api";
import GoogleButton from "@/components/common/GoogleButton";
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  UserCircle2, Building2, CheckCircle2, ShieldCheck,
} from "lucide-react";

/* Login page wali hi photo — adwall-frontend/public/auth-billboard.jpg */
const HERO_IMAGE = "/auth-billboard.jpg";

const dashboardFor = (role) =>
  role === "admin" ? "/admin/dashboard" : role === "owner" ? "/owner/dashboard" : "/client/dashboard";

const STEPS = [
  { n: 1, label: "Account Info", Icon: UserCircle2 },
  { n: 2, label: "Verify OTP", Icon: ShieldCheck },
  { n: 3, label: "Done", Icon: CheckCircle2 },
];

const Stepper = ({ step }) => (
  <div className="flex items-center justify-center gap-1 my-6">
    {STEPS.map(({ n, label, Icon }, i) => (
      <div key={n} className="flex items-center">
        <div className="flex flex-col items-center gap-1.5 w-[80px]">
          <div
            className={`h-11 w-11 rounded-full flex items-center justify-center transition ${
              step >= n ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400"
            }`}
          >
            <Icon size={20} />
          </div>
          <span className={`text-[11px] font-semibold text-center ${step >= n ? "text-orange-500" : "text-gray-400"}`}>
            {label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`w-8 border-t-2 border-dashed mb-5 ${step > n ? "border-orange-400" : "border-gray-300"}`} />
        )}
      </div>
    ))}
  </div>
);

const inputCls =
  "w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition";

const Register = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { register, updateUser } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    role: "",
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [channel, setChannel] = useState("email"); // "email" ya "mobile"
  const [otpValue, setOtpValue] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [googleData, setGoogleData] = useState(null);

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [heroOk, setHeroOk] = useState(true);

  const timerRef = useRef(null);

  // Role query param (?role=owner) support
  useEffect(() => {
    const r = params.get("role");
    if (r === "client" || r === "owner") setForm((f) => ({ ...f, role: r }));
  }, [params]);

  // Login page se Google signup redirect
  useEffect(() => {
    if (params.get("google") !== "1") return;
    const raw = sessionStorage.getItem("googleSignup");
    if (!raw) return;
    try {
      const g = JSON.parse(raw);
      setGoogleData(g);
      setForm((f) => ({ ...f, name: g.name || "", email: g.email || "" }));
    } catch {
      sessionStorage.removeItem("googleSignup");
    }
  }, [params]);

  // Resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  // Server ka asli message dikhao. Pehle sab kuch "OTP bhejne me problem
  // aayi" ban jaata tha, isliye 409 (account already exists) jaisi saaf
  // baat bhi user tak nahi pahunchti thi.
  const apiError = (err, fallback) => {
    if (!err.response)
      return "Server se connect nahi ho paya. Internet check karo ya thodi der baad try karo.";
    const msg = err.response.data?.message;
    if (err.response.status === 409)
      return msg || "Is email ya mobile se account pehle se hai. Login karo.";
    if (err.response.status === 429)
      return msg || "Thodi der ruko, phir try karo.";
    return msg || `${fallback} (error ${err.response.status})`;
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Step 1 → OTP bhejo ──
  const submitStep1 = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.role) return setError("Pehle account type select karo");
    if (!/^[6-9]\d{9}$/.test(form.mobile))
      return setError("Valid 10-digit mobile number daalo");
    if (!googleData) {
      if (form.password.length < 6) return setError("Password kam se kam 6 characters ka ho");
      if (form.password !== form.confirmPassword) return setError("Dono passwords match nahi kar rahe");
    }
    if (!form.agree) return setError("Terms & Conditions accept karna zaroori hai");

    setLoading(true);
    try {
      const { data } = await otpService.sendRegisterOtp({
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        channel,
      });

      setStep(2);
      setCooldown(60);
      setOtpValue("");
      setInfo(
        data.data?.otp
          ? `Dev mode — OTP: ${data.data.otp}`
          : data.message
      );
    } catch (err) {
      setError(apiError(err, "OTP bhejne me problem aayi"));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → OTP verify + account create ──
  const submitStep2 = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: v } = await otpService.verifyRegisterOtp({
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        channel,
        otp: otpValue.trim(),
      });

      const token = v.data.verifyToken;
      setVerifyToken(token);

      let user;
      if (googleData) {
        const { data } = await authService.googleComplete({
          ...googleData,
          role: form.role,
          mobile: form.mobile.trim(),
          verifyToken: token,
        });
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        sessionStorage.removeItem("googleSignup");
        updateUser(data.data.user);
        user = data.data.user;
      } else {
        user = await register({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          mobile: form.mobile.trim(),
          password: form.password,
          role: form.role,
          verifyToken: token,
        });
      }

      setStep(3);
      setTimeout(() => navigate(dashboardFor(user.role), { replace: true }), 1500);
    } catch (err) {
      setError(apiError(err, "Verification fail ho gaya"));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      const { data } = await otpService.sendRegisterOtp({
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        channel,
      });
      setCooldown(60);
      setOtpValue("");
      setInfo(data.data?.otp ? `Dev mode — OTP: ${data.data.otp}` : data.message);
    } catch (err) {
      setError(apiError(err, "Resend fail hua"));
    }
  };

  const handleGoogle = async (credential) => {
    setError("");
    setLoading(true);
    try {
      const { data } = await authService.googleLogin(credential);

      if (data.data.isNewUser) {
        setGoogleData(data.data.googleData);
        setForm((f) => ({
          ...f,
          name: data.data.googleData.name || "",
          email: data.data.googleData.email || "",
        }));
        setInfo("Google verified! Ab account type aur mobile number bharo.");
      } else {
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        updateUser(data.data.user);
        navigate(dashboardFor(data.data.user.role), { replace: true });
      }
    } catch (err) {
      setError(apiError(err, "Google signup fail hua"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 py-10 px-4">
      <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[1fr_500px] lg:gap-0 lg:items-center">

        {/* ── Left: billboard visual (Login page jaisa hi) ── */}
        <div className="relative hidden lg:block rounded-2xl overflow-hidden h-[680px] shadow-xl">
          {heroOk ? (
            <img
              src={HERO_IMAGE}
              alt=""
              onError={() => setHeroOk(false)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-sky-800 via-slate-800 to-slate-900">
              <div className="absolute top-10 left-4 right-6">
                <div className="rounded-md bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 h-56 shadow-2xl flex items-center justify-center px-4">
                  <p className="text-white font-black text-3xl leading-tight -rotate-2 drop-shadow-lg">
                    YOUR<br />BRAND<br />HERE
                  </p>
                </div>
                <div className="flex justify-around px-8">
                  <div className="w-2 h-24 bg-slate-700" />
                  <div className="w-2 h-24 bg-slate-700" />
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 flex items-end gap-1 px-2 opacity-60">
                {[38, 62, 30, 78, 46, 88, 34, 56, 70, 42].map((h, i) => (
                  <div key={i} style={{ height: `${h}px` }} className="flex-1 bg-slate-950 rounded-t-sm" />
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

          <div className="absolute bottom-0 inset-x-0 p-7 text-white">
            <h2 className="text-2xl font-black leading-tight drop-shadow">
              Apna ad space list karo,
              <br />
              ya perfect jagah dhundo
            </h2>
            <p className="mt-2 text-white/85 text-xs drop-shadow">
              Verified owners, transparent pricing, secure payments.
            </p>
          </div>
        </div>

        {/* ── Right: form card ── */}
        <div className="lg:-ml-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 lg:p-9">
          <Link to="/" className="flex items-center justify-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">AW</span>
            </div>
            <span className="text-2xl font-black text-gray-900">
              AdWall <span className="text-brand-500">India</span>
            </span>
          </Link>
          <p className="text-[11px] text-gray-400 text-center mt-1.5">
            Every Wall. Every Brand. Everywhere.
          </p>

          <h1 className="text-2xl font-bold text-gray-900 text-center mt-5">Create Your Account</h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            Join AdWall India and start your journey
          </p>

          <Stepper step={step} />

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}
          {info && !error && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
              {info}
            </div>
          )}

          {/* ─────────── STEP 1 ─────────── */}
          {step === 1 && (
            <form onSubmit={submitStep1} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: "client", label: "Advertiser", sub: "Ad space book karna hai", Icon: UserCircle2 },
                    { v: "owner", label: "Space Owner", sub: "Hoarding list karni hai", Icon: Building2 },
                  ].map(({ v, label, sub, Icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set("role", v)}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        form.role === v
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon size={20} className={form.role === v ? "text-orange-500" : "text-gray-400"} />
                      <p className={`text-sm font-bold mt-2 ${form.role === v ? "text-orange-600" : "text-gray-700"}`}>
                        {label}
                      </p>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  readOnly={!!googleData}
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={`${inputCls} ${googleData ? "bg-gray-50 text-gray-500" : ""}`}
                />
              </div>

              <div className="relative">
                <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Mobile Number"
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
                  className={inputCls}
                />
              </div>

              {!googleData && (
                <>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                  OTP kahan bhejein?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: "email", label: "Email pe", sub: form.email || "your@email.com", Icon: Mail },
                    { v: "mobile", label: "SMS pe", sub: form.mobile ? `+91 ${form.mobile}` : "+91 XXXXXXXXXX", Icon: Phone },
                  ].map(({ v, label, sub, Icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setChannel(v)}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        channel === v ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon size={17} className={channel === v ? "text-orange-500" : "text-gray-400"} />
                      <p className={`text-sm font-bold mt-1.5 ${channel === v ? "text-orange-600" : "text-gray-700"}`}>
                        {label}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => set("agree", e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-orange-500"
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms-and-conditions" className="text-blue-600 hover:underline">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition disabled:opacity-60"
              >
                {loading ? "OTP bhej rahe hain..." : "Register"}
              </button>

              {!googleData && (
                <>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-gray-400">or continue with</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <GoogleButton text="continue_with" onCredential={handleGoogle} onError={setError} />
                </>
              )}
            </form>
          )}

          {/* ─────────── STEP 2 ─────────── */}
          {step === 2 && (
            <form onSubmit={submitStep2} className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                6-digit code bheja hai{" "}
                <strong>{channel === "mobile" ? `+91 ${form.mobile}` : form.email}</strong> pe.
              </p>

              <input
                required
                autoFocus
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                className="w-full h-16 text-center text-3xl font-bold tracking-[0.5em] rounded-xl border border-gray-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition disabled:opacity-60"
              >
                {loading ? "Verify kar rahe hain..." : "Verify & Create Account"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); setInfo(""); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Details badlo
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={cooldown > 0}
                  className="text-orange-500 font-semibold disabled:text-gray-400"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setChannel((c) => (c === "email" ? "mobile" : "email"));
                    setStep(1);
                    setError("");
                    setInfo("");
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {channel === "email" ? "Email nahi aaya? SMS pe mangwao" : "SMS nahi aaya? Email pe mangwao"}
                </button>
              </div>
            </form>
          )}

          {/* ─────────── STEP 3 ─────────── */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-4">Account ban gaya! 🎉</h2>
              <p className="text-sm text-gray-500 mt-1">Dashboard pe le ja rahe hain...</p>
            </div>
          )}

          {step !== 3 && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-brand-500 font-semibold hover:underline">
                Login
              </Link>
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default Register;