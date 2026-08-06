import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Phone, Lock, Megaphone, Building } from "lucide-react";

const Register = () => {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get("role") || "client");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await register({ ...form, role });
      navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
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
            <CardTitle className="text-2xl">Account Banao</CardTitle>
            <CardDescription>Pehle batao — aap kya hain?</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button type="button" onClick={() => setRole("client")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${role === "client" ? "border-brand-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                <Megaphone size={24} className={role === "client" ? "text-brand-500" : "text-gray-400"} />
                <div>
                  <div className={`text-sm font-semibold ${role === "client" ? "text-brand-600" : "text-gray-700"}`}>Advertiser</div>
                  <div className="text-xs text-gray-500">Ad space book karna hai</div>
                </div>
              </button>
              <button type="button" onClick={() => setRole("owner")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${role === "owner" ? "border-brand-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                <Building size={24} className={role === "owner" ? "text-brand-500" : "text-gray-400"} />
                <div>
                  <div className={`text-sm font-semibold ${role === "owner" ? "text-brand-600" : "text-gray-700"}`}>Space Owner</div>
                  <div className="text-xs text-gray-500">Hoarding list karna hai</div>
                </div>
              </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input className="pl-9" placeholder="Aapka naam" value={form.name} onChange={e => handle("name", e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input type="email" className="pl-9" placeholder="your@email.com" value={form.email} onChange={e => handle("email", e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input type="tel" className="pl-9" placeholder="10-digit mobile number" value={form.mobile} onChange={e => handle("mobile", e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input type="password" className="pl-9" placeholder="Min 6 characters" value={form.password} onChange={e => handle("password", e.target.value)} minLength={6} required />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : `Register as ${role === "client" ? "Advertiser" : "Space Owner"}`}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-500">
              Pehle se account hai? <Link to="/login" className="text-brand-500 font-medium hover:underline">Login karo</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Register;
