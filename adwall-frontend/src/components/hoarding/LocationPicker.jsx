import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, CheckCircle, Search, X } from "lucide-react";

/**
 * LocationPicker — OpenStreetMap Nominatim use karta hai (FREE, no API key needed)
 * Google Maps API key optional hai — agar set ho toh map preview bhi show hoga
 */

const LocationPicker = ({ onLocationSelect }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef(null);

  // OpenStreetMap Nominatim se search karo (free, no key)
  const searchLocation = useCallback(async (q) => {
    if (!q || q.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=in&format=json&addressdetails=1&limit=6`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Location search error:", err);
    } finally { setSearching(false); }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(val), 400);
  };

  const handleSelect = (place) => {
    const addr = place.address || {};

    // City nikalo — multiple fallbacks
    const city =
      addr.city || addr.town || addr.county ||
      addr.state_district || addr.state || "";

    // Area nikalo
    const area =
      addr.suburb || addr.neighbourhood || addr.quarter ||
      addr.road || addr.village || addr.town || city;

    const locationData = {
      address: place.display_name,
      city,
      area,
      latitude: parseFloat(place.lat).toFixed(7),
      longitude: parseFloat(place.lon).toFixed(7),
    };

    setSelected(locationData);
    setQuery(place.display_name);
    setSuggestions([]);
    onLocationSelect(locationData);
  };

  const handleClear = () => {
    setQuery(""); setSelected(null); setSuggestions([]);
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <Input
          className="pl-9 pr-10"
          placeholder="Location type karo... (Connaught Place Delhi, MG Road Bangalore)"
          value={query}
          onChange={handleInput}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {searching
            ? <Loader2 size={16} className="text-brand-500 animate-spin" />
            : selected
              ? <CheckCircle size={16} className="text-green-500" />
              : query
                ? <button onClick={handleClear}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
                : <Search size={16} className="text-gray-300" />}
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto">
            {suggestions.map((place, i) => {
              const addr = place.address || {};
              const city = addr.city || addr.town || addr.county || addr.state_district || "";
              const area = addr.suburb || addr.neighbourhood || addr.road || "";
              return (
                <button
                  key={place.place_id}
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b last:border-0 flex items-start gap-3"
                >
                  <MapPin size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {area || city || place.name}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{place.display_name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Location Preview */}
      {selected && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          {[
            ["📍 City", selected.city],
            ["🏘️ Area", selected.area],
            ["🌐 Latitude", selected.latitude],
            ["🌐 Longitude", selected.longitude],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-green-600 font-medium mb-0.5">{label}</p>
              <p className="text-sm text-gray-900 font-semibold truncate">{value || "—"}</p>
            </div>
          ))}
          <div className="col-span-2">
            <p className="text-xs text-green-600 font-medium mb-0.5">📋 Full Address</p>
            <p className="text-xs text-gray-600 line-clamp-2">{selected.address}</p>
          </div>
          <p className="col-span-2 text-xs text-green-700 flex items-center gap-1">
            <CheckCircle size={11} />Location auto-fill ho gaya! Niche fields edit kar sakte ho.
          </p>
        </div>
      )}

      {/* OSM Credit */}
      <p className="text-xs text-gray-300">Powered by OpenStreetMap</p>
    </div>
  );
};

export default LocationPicker;
