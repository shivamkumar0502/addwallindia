import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const handle = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const redirect = from || `/${user.role}/dashboard`;
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed, please try again");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <span className="text-white font-bold">AW</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">AdWall <span className="text-brand-500">India</span></span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription>Apne account mein login karo</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input type="email" className="pl-9" placeholder="your@email.com" value={form.email} onChange={e => handle("email", e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input type={showPass ? "text" : "password"} className="pl-9 pr-9" placeholder="••••••" value={form.password} onChange={e => handle("password", e.target.value)} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-500">
              <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-brand-500">Password bhool gaye?</Link>
              <br />
              Account nahi hai? <Link to="/register" className="text-brand-500 font-medium hover:underline">Register karo</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Login;
