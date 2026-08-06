import { useState } from "react";
import { Link } from "react-router-dom";
import { campaignService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import useToast from "@/hooks/useToast";
import Loader from "@/components/common/Loader";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Megaphone, Plus, X, MapPin } from "lucide-react";

const CATEGORIES = ["hoarding","billboard","led_screen","wall_painting","bus_branding","auto_branding","metro_ads","airport_ads","mall_branding","cinema_ads"];

const BroadcastCampaign = () => {
  const { toast, showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", cities: [], categories: [],
    budgetMin: "", budgetMax: "", startDate: "", endDate: "",
    targetAudience: "", additionalNotes: "",
  });

  const { data: campaigns, loading: campaignsLoading, execute: refetch } = useFetch(campaignService.getMyCampaigns);

  const addCity = () => {
    if (cityInput.trim() && !form.cities.includes(cityInput.trim())) {
      setForm(f => ({ ...f, cities: [...f.cities, cityInput.trim()] }));
      setCityInput("");
    }
  };

  const toggleCategory = (cat) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.budgetMax || !form.startDate || !form.endDate) {
      showToast("Title, budget aur dates required hain", "error"); return;
    }
    if (form.cities.length === 0) { showToast("Kum se kum ek city add karo", "error"); return; }
    setLoading(true);
    try {
      await campaignService.create({
        ...form,
        budgetMin: parseFloat(form.budgetMin) || 0,
        budgetMax: parseFloat(form.budgetMax),
      });
      showToast("Campaign broadcast ho gaya! Owners ko notify kar diya.", "success");
      setShowForm(false);
      setForm({ title: "", description: "", cities: [], categories: [], budgetMin: "", budgetMax: "", startDate: "", endDate: "", targetAudience: "", additionalNotes: "" });
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || "Campaign failed", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast {...toast} onClose={() => {}} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast Campaign</h1>
          <p className="text-gray-500 text-sm mt-1">Ek saath multiple owners ko request bhejo</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />{showForm ? "Cancel" : "New Campaign"}
        </Button>
      </div>

      {/* Campaign Form */}
      {showForm && (
        <Card className="border-brand-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone size={16} className="text-brand-500" />Campaign Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Campaign Title *</label>
                <Input placeholder="e.g. Summer Sale Campaign 2026" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <Textarea placeholder="Campaign ke baare mein batao..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>

              {/* Cities */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Target Cities *</label>
                <div className="flex gap-2">
                  <Input placeholder="City name (e.g. Delhi)" value={cityInput} onChange={e => setCityInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCity())} />
                  <Button type="button" variant="outline" onClick={addCity}>Add</Button>
                </div>
                {form.cities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.cities.map(c => (
                      <span key={c} className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full">
                        <MapPin size={10} />{c}
                        <button type="button" onClick={() => setForm(f => ({ ...f, cities: f.cities.filter(x => x !== c) }))}><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Ad Categories (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button type="button" key={c} onClick={() => toggleCategory(c)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.categories.includes(c) ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
                      {c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget + Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Min Budget (₹)</label>
                  <Input type="number" placeholder="5000" value={form.budgetMin} onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Max Budget (₹) *</label>
                  <Input type="number" placeholder="50000" value={form.budgetMax} onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date *</label>
                  <Input type="date" value={form.startDate} min={new Date().toISOString().split("T")[0]} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">End Date *</label>
                  <Input type="date" value={form.endDate} min={form.startDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Target Audience</label>
                <Input placeholder="e.g. Young professionals, Families, Students" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Additional Notes</label>
                <Textarea placeholder="Koi special requirements ya notes..." value={form.additionalNotes} onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))} rows={2} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Megaphone size={16} className="mr-2" />
                {loading ? "Broadcasting..." : "🚀 Broadcast to All Matching Owners"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* My Campaigns */}
      {campaignsLoading ? <Loader className="py-12" /> : !campaigns?.length ? (
        <div className="text-center py-16 text-gray-400">
          <Megaphone size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Koi campaign nahi hai abhi</p>
          <p className="text-sm mt-1">Upar "New Campaign" pe click karo</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">My Campaigns ({campaigns.length})</h2>
          {campaigns.map(c => (
            <Card key={c._id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <Badge className={c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>{c.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                      <span>📍 {c.requirements?.cities?.join(", ")}</span>
                      <span>💰 Max {formatCurrency(c.requirements?.budget?.max)}</span>
                      <span>📅 {formatDate(c.requirements?.startDate)} → {formatDate(c.requirements?.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="text-brand-600 font-medium">{c.totalQuotes || 0} quotes received</span>
                      <span className="text-gray-400">{c.aiMatchedHoardings?.length || 0} hoardings matched</span>
                    </div>
                  </div>
                  {c.status === "active" && (
                    <Button size="sm" variant="outline" onClick={async () => { await campaignService.close(c._id); refetch(); }}>
                      Close
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default BroadcastCampaign;
