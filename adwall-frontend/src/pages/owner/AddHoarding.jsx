import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hoardingService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LocationPicker from "@/components/hoarding/LocationPicker";
import { CheckCircle, Upload } from "lucide-react";

const CATEGORIES = [
  "hoarding","billboard","led_screen","wall_painting","bus_branding",
  "auto_branding","cab_branding","metro_ads","railway_ads","airport_ads",
  "mall_branding","cinema_ads","stadium_ads","petrol_pump","event_branding"
];

const STEPS = ["Basic Info", "Location", "Specs & Pricing", "Upload Images"];

const AddHoarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [form, setForm] = useState({
    title: "", description: "", category: "hoarding",
    city: "", area: "", address: "", latitude: "", longitude: "",
    width: "", height: "",
    perMonth: "", perDay: "", perWeek: "", isNegotiable: true,
    lighting: "none", dailyTraffic: "medium",
    facingDirection: "", landmarkNearby: "",
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Google Maps se location auto-fill
  const handleLocationSelect = (loc) => {
    setForm(f => ({
      ...f,
      address: loc.address || f.address,
      city: loc.city || f.city,
      area: loc.area || f.area,
      latitude: loc.latitude || f.latitude,
      longitude: loc.longitude || f.longitude,
    }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append("images", img));
      await hoardingService.add(fd);
      navigate("/owner/hoardings");
    } catch (err) {
      setError(err.response?.data?.message || "Submit failed");
      setStep(0);
    } finally { setLoading(false); }
  };

  // Step validation
  const canNext = [
    !!(form.title && form.category),
    !!(form.city && form.area && form.latitude && form.longitude),
    !!(form.width && form.height && form.perMonth),
    true,
  ][step];

  const stepContent = [
    /* ── Step 0: Basic Info ── */
    <div key="basic" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hoarding Title *</label>
        <Input placeholder="e.g. Premium Hoarding at MG Road" value={form.title} onChange={e => set("title", e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <Select value={form.category} onChange={e => set("category", e.target.value)}>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <Textarea
          placeholder="Hoarding ke baare mein batao — visibility, highlights, nearby attractions etc."
          value={form.description}
          onChange={e => set("description", e.target.value)}
          rows={4}
        />
      </div>
    </div>,

    /* ── Step 1: Location (Google Maps Autocomplete) ── */
    <div key="location" className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location Search *
          <span className="ml-2 text-xs text-gray-400 font-normal">Google Maps se dhundho — sab auto-fill ho jayega</span>
        </label>
        <LocationPicker onLocationSelect={handleLocationSelect} />
      </div>

      {/* Manual override fields — auto-filled but editable */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <Input
            placeholder="Delhi"
            value={form.city}
            onChange={e => set("city", e.target.value)}
            className={form.city ? "border-green-300 bg-green-50" : ""}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
          <Input
            placeholder="Connaught Place"
            value={form.area}
            onChange={e => set("area", e.target.value)}
            className={form.area ? "border-green-300 bg-green-50" : ""}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
        <Input
          placeholder="Street address"
          value={form.address}
          onChange={e => set("address", e.target.value)}
          className={form.address ? "border-green-300 bg-green-50" : ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
          <Input
            type="number"
            step="any"
            placeholder="28.6139"
            value={form.latitude}
            onChange={e => set("latitude", e.target.value)}
            className={form.latitude ? "border-green-300 bg-green-50" : ""}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
          <Input
            type="number"
            step="any"
            placeholder="77.2090"
            value={form.longitude}
            onChange={e => set("longitude", e.target.value)}
            className={form.longitude ? "border-green-300 bg-green-50" : ""}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nearby Landmark</label>
        <Input placeholder="Near XYZ Mall, Metro Station etc." value={form.landmarkNearby} onChange={e => set("landmarkNearby", e.target.value)} />
      </div>
    </div>,

    /* ── Step 2: Specs & Pricing ── */
    <div key="specs" className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Width (feet) *</label>
          <Input type="number" placeholder="40" value={form.width} onChange={e => set("width", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (feet) *</label>
          <Input type="number" placeholder="20" value={form.height} onChange={e => set("height", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lighting</label>
          <Select value={form.lighting} onChange={e => set("lighting", e.target.value)}>
            <option value="none">None</option>
            <option value="frontlit">Front Lit</option>
            <option value="backlit">Back Lit</option>
            <option value="led">LED</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Traffic</label>
          <Select value={form.dailyTraffic} onChange={e => set("dailyTraffic", e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </Select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (₹) *</label>
        <Input type="number" placeholder="25000" value={form.perMonth} onChange={e => set("perMonth", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Price (₹)</label>
          <Input type="number" placeholder="1000" value={form.perDay} onChange={e => set("perDay", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Price (₹)</label>
          <Input type="number" placeholder="6000" value={form.perWeek} onChange={e => set("perWeek", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Facing Direction</label>
        <Select value={form.facingDirection} onChange={e => set("facingDirection", e.target.value)}>
          <option value="">Select direction</option>
          {["north","south","east","west","north_east","north_west","south_east","south_west"].map(d => (
            <option key={d} value={d}>{d.replace("_", " ").toUpperCase()}</option>
          ))}
        </Select>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isNegotiable} onChange={e => set("isNegotiable", e.target.checked)} className="rounded border-gray-300" />
        <span className="text-sm text-gray-700">Price negotiable hai</span>
      </label>
    </div>,

    /* ── Step 3: Images ── */
    <div key="images" className="space-y-4">
      <div
        className="border-2 border-dashed rounded-xl p-10 text-center hover:border-brand-400 transition-colors cursor-pointer"
        onClick={() => document.getElementById("img-upload").click()}
      >
        <Upload size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-700">Hoarding ki photos yahan upload karo</p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5MB each, upto 10 images</p>
        <p className="text-xs text-brand-500 mt-2 font-medium">Click to select</p>
        <input id="img-upload" type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
      </div>

      {previews.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{previews.length} photo(s) selected:</p>
          <div className="grid grid-cols-3 gap-3">
            {previews.map((p, i) => (
              <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100 border">
                <img src={p} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">* Images optional hain for now, baad mein bhi add kar sakte ho</p>
    </div>,
  ];

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Hoarding</h1>

      {/* Step Indicators */}
      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors flex-shrink-0
                ${i < step ? "bg-green-500 text-white" : i === step ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap hidden sm:block ${i === step ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 mx-2 flex-shrink-0 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{STEPS[step]}</CardTitle></CardHeader>
        <CardContent>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
          {stepContent[step]}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          ← Previous
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext}>
            Next Step →
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit for Verification ✓"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddHoarding;
