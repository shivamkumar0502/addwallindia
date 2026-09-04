import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, CheckCircle } from "lucide-react";
import api from "@/services/api";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", mobile: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // FIX: pehle ye sirf setSubmitted(true) karta tha — message kahin
  // jaata hi nahi tha, par user ko "Message Send Ho Gaya!" dikh jaata tha.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Message bhejne me problem aayi. Thodi der baad try karo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-orange-900 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-black mb-3">Contact Us</h1>
        <p className="text-gray-300 text-lg">Koi bhi sawaal? Hum yahan hain aapke liye.</p>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-5">
            {[
              { icon: <Mail size={20} className="text-brand-500" />, title: "Email", lines: ["contact@adwallindia.com", "shivamkumartek123@gmail.com"] },
              { icon: <Phone size={20} className="text-brand-500" />, title: "Phone", lines: ["+91 9955950777", "Mon–Sat, 9AM–7PM"] },
              { icon: <MapPin size={20} className="text-brand-500" />, title: "Office", lines: ["AdWall India Pvt Ltd", "Bihar,India"] },
              { icon: <Clock size={20} className="text-brand-500" />, title: "Support Hours", lines: ["Mon–Fri: 9AM–7PM", "Sat: 10AM–4PM"] },
            ].map(({ icon, title, lines }) => (
              <Card key={title}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">{icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{title}</p>
                    {lines.map(l => <p key={l} className="text-xs text-gray-500 mt-0.5">{l}</p>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                {submitted ? (
                  <div className="text-center py-10">
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message Send Ho Gaya!</h3>
                    <p className="text-gray-500 text-sm">Hum 24 hours mein aapse contact karenge.</p>
                    <Button className="mt-6" variant="outline" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", mobile: "", subject: "", message: "" }); }}>
                      Another Message Bhejo
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Message Bhejo</h2>
                    {error && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                        {error}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
                        <Input placeholder="Aapka naam" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile</label>
                        <Input type="tel" placeholder="Mobile number" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
                      <Input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Subject *</label>
                      <Input placeholder="Kya help chahiye?" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Message *</label>
                      <Textarea placeholder="Detail mein batao..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5} required />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11">
                      {loading ? "Bhej rahe hain..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Contact;