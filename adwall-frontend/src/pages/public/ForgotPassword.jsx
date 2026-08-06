import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, ArrowLeft, KeyRound, Lock, CheckCircle } from "lucide-react";

const STEPS = { EMAIL: "email", OTP: "otp", PASSWORD: "password", SUCCESS: "success" };

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  // Step 1: Email submit karo
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/otp/forgot-password", { email });
      setMaskedEmail(data.data.email);
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.response?.data?.message || "Email send failed");
    } finally { setLoading(false); }
  };

  // Step 2: OTP verify karo
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("6-digit OTP enter karo"); return; }
    setError(""); setLoading(true);
    try {
      // OTP check — bas next step pe le jao (actual verify reset pe hoga)
      setStep(STEPS.PASSWORD);
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally { setLoading(false); }
  };

  // Step 3: New password set karo
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords match nahi kar rahe"); return; }
    if (newPassword.length < 6) { setError("Password min 6 characters hona chahiye"); return; }
    setError(""); setLoading(true);
    try {
      await api.post("/otp/reset-password", { email, otp, newPassword });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. OTP wrong ya expired hai.");
      setStep(STEPS.OTP); // OTP pe wapas bhejo
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <span className="text-white font-black">AW</span>
            </div>
            <span className="text-2xl font-black text-gray-900">AdWall <span className="text-brand-500">India</span></span>
          </Link>
        </div>

        <Card>
          {/* STEP 1: Email */}
          {step === STEPS.EMAIL && (
            <>
              <CardHeader className="text-center">
                <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={24} className="text-brand-500" />
                </div>
                <CardTitle>Password Bhool Gaye?</CardTitle>
                <CardDescription>Email enter karo — OTP bhej denge</CardDescription>
              </CardHeader>
              <CardContent>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input type="email" className="pl-9" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending OTP..." : "OTP Bhejo"}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={14} />Login pe wapas jao
                  </Link>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === STEPS.OTP && (
            <>
              <CardHeader className="text-center">
                <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={24} className="text-blue-500" />
                </div>
                <CardTitle>OTP Enter Karo</CardTitle>
                <CardDescription>6-digit OTP bheja hai <strong>{maskedEmail}</strong> pe</CardDescription>
              </CardHeader>
              <CardContent>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
                <form onSubmit={handleOTPSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">6-Digit OTP</label>
                    <Input
                      type="text"
                      maxLength={6}
                      className="text-center text-3xl font-mono tracking-[0.5em] h-14"
                      placeholder="000000"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-2 text-center">OTP 10 minutes mein expire hoga</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                    {loading ? "Verifying..." : "OTP Verify Karo"}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => { setStep(STEPS.EMAIL); setOtp(""); setError(""); }}
                    className="text-sm text-brand-500 hover:underline">
                    OTP nahi aaya? Dobara bhejo
                  </button>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 3: New Password */}
          {step === STEPS.PASSWORD && (
            <>
              <CardHeader className="text-center">
                <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock size={24} className="text-green-500" />
                </div>
                <CardTitle>Naya Password Set Karo</CardTitle>
                <CardDescription>Strong password use karo</CardDescription>
              </CardHeader>
              <CardContent>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">New Password</label>
                    <Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm Password</label>
                    <Input type="password" placeholder="Password repeat karo" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords match nahi kar rahe</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || newPassword !== confirmPassword}>
                    {loading ? "Resetting..." : "Password Reset Karo"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 4: Success */}
          {step === STEPS.SUCCESS && (
            <CardContent className="p-8 text-center">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-gray-900 mb-2">Password Reset Ho Gaya! 🎉</h2>
              <p className="text-gray-500 text-sm mb-6">Ab naye password se login karo.</p>
              <Button className="w-full" onClick={() => navigate("/login")}>Login Karo</Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
