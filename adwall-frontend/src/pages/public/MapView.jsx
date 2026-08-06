import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { hoardingService } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Search, MapPin, X, List, Map, Star } from "lucide-react";

// Leaflet CSS dynamically load karo
const loadLeafletCSS = () => {
  if (document.getElementById("leaflet-css")) return;
  const link = document.createElement("link");
  link.id = "leaflet-css";
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
};

const CATEGORIES = ["hoarding","billboard","led_screen","wall_painting","bus_branding","auto_branding","metro_ads","airport_ads","mall_branding","cinema_ads"];

const CATEGORY_COLORS = {
  hoarding: "#f97316", billboard: "#3b82f6", led_screen: "#8b5cf6",
  wall_painting: "#10b981", bus_branding: "#f59e0b", metro_ads: "#6366f1",
  airport_ads: "#06b6d4", mall_branding: "#ec4899", default: "#6b7280",
};

const MapView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [hoardings, setHoardings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("map"); // "map" | "list"
  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "",
    category: searchParams.get("category") || "",
  });

  // Leaflet load + map initialize
  useEffect(() => {
    loadLeafletCSS();
    const timer = setTimeout(() => initMap(), 300);
    return () => clearTimeout(timer);
  }, []);

  const initMap = async () => {
    if (mapInstanceRef.current) return;
    const L = await import("leaflet");
    if (!mapRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [20.5937, 78.9629], // India center
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);
  };

  // Hoardings fetch karo
  useEffect(() => {
    fetchHoardings();
  }, [filters]);

  const fetchHoardings = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filters.city) params.city = filters.city;
      if (filters.category) params.category = filters.category;
      const { data } = await hoardingService.search(params);
      const results = data.data.hoardings || [];
      setHoardings(results);
      updateMapMarkers(results);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const updateMapMarkers = async (hoardingsList) => {
    const L = await import("leaflet");
    const map = mapInstanceRef.current;
    if (!map) return;

    // Purane markers hata do
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = [];

    hoardingsList.forEach(h => {
      const coords = h.location?.coordinates?.coordinates;
      if (!coords || coords.length < 2) return;

      const [lng, lat] = coords;
      if (!lat || !lng) return;

      const color = CATEGORY_COLORS[h.category] || CATEGORY_COLORS.default;

      // Custom colored marker
      const icon = L.divIcon({
        html: `<div style="
          background:${color};
          width:32px;height:32px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          cursor:pointer;
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="transform:rotate(45deg);font-size:14px;">🪧</span>
        </div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:200px;font-family:Arial,sans-serif;">
            <div style="font-weight:700;font-size:14px;color:#111;">${h.title}</div>
            <div style="color:#6b7280;font-size:12px;margin:4px 0;">${h.location?.area}, ${h.location?.city}</div>
            <div style="font-size:16px;font-weight:900;color:#f97316;">₹${(h.pricing?.perMonth || 0).toLocaleString("en-IN")}/mo</div>
            <button onclick="window.open('/hoarding/${h._id}','_blank')"
              style="background:#f97316;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;margin-top:8px;width:100%;">
              View Details →
            </button>
          </div>
        `, { maxWidth: 240 })
        .on("click", () => setSelected(h));

      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    // Map fit karo markers ke around
    if (bounds.length > 0) {
      try { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 }); } catch {}
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHoardings();
  };

  const flyToHoarding = async (h) => {
    setSelected(h);
    const coords = h.location?.coordinates?.coordinates;
    if (!coords || !mapInstanceRef.current) return;
    const [lng, lat] = coords;
    mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1 });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0">
          <X size={18} />
        </button>
        <h1 className="font-black text-gray-900 hidden sm:block">Map View</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder="City..."
              value={filters.city}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
            />
          </div>
          <Select
            value={filters.category}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            className="h-9 text-sm w-36"
          >
            <option value="">All Types</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </Select>
          <Button type="submit" size="sm" className="h-9">Search</Button>
        </form>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
          <button onClick={() => setView("map")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${view === "map" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
            <Map size={13} />Map
          </button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${view === "list" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
            <List size={13} />List
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map Container */}
        <div ref={mapRef} className={`${view === "map" ? "flex-1" : "hidden md:block md:flex-1"} z-0`} />

        {/* List Panel */}
        <div className={`
          ${view === "map"
            ? "absolute bottom-0 left-0 right-0 max-h-48 md:max-h-full md:w-80 md:relative md:bottom-auto"
            : "flex-1 md:flex-none md:w-80"}
          bg-white border-t md:border-t-0 md:border-l overflow-y-auto z-10 shadow-lg md:shadow-none
        `}>
          <div className="p-3 border-b bg-gray-50 sticky top-0 z-10">
            <p className="text-sm font-semibold text-gray-700">
              {loading ? "Searching..." : `${hoardings.length} hoardings`}
              {filters.city && ` in ${filters.city}`}
            </p>
          </div>

          {hoardings.length === 0 && !loading ? (
            <div className="p-6 text-center text-gray-400">
              <MapPin size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">Koi hoarding nahi mili</p>
            </div>
          ) : (
            <div className="divide-y">
              {hoardings.map(h => (
                <div
                  key={h._id}
                  onClick={() => flyToHoarding(h)}
                  className={`p-3 cursor-pointer hover:bg-orange-50 transition-colors ${selected?._id === h._id ? "bg-orange-50 border-l-2 border-brand-500" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="h-14 w-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {h.images?.[0]
                        ? <img src={h.images[0]} className="w-full h-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-2xl">🪧</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{h.title}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />{h.location?.area}, {h.location?.city}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-black text-brand-600">{formatCurrency(h.pricing?.perMonth)}<span className="text-xs font-normal text-gray-400">/mo</span></span>
                        {h.rating > 0 && <span className="text-xs text-gray-500 flex items-center gap-0.5"><Star size={10} className="text-yellow-400 fill-yellow-400" />{h.rating}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/hoarding/${h._id}`); }}
                    className="mt-2 w-full text-xs text-brand-500 hover:text-brand-700 font-medium text-center"
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
