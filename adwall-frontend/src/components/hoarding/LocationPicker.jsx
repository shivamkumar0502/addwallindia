import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Crosshair, Search, Loader2 } from "lucide-react";

/**
 * LocationPicker — exact location pin karne ke liye.
 *
 * Google Maps API key ki zarurat NAHI. Leaflet + OpenStreetMap use karta hai,
 * dono free hain (leaflet package.json me pehle se hai).
 *
 * Teen tarike se location set hoti hai:
 *   1. Jagah ka naam search karo (Nominatim geocoding — free)
 *   2. Map pe kahin bhi click karo, ya pin drag karo
 *   3. "Meri location" button — browser GPS
 *
 * Props (purane picker se same, isliye AddHoarding.jsx me kuch nahi badalna):
 *   onLocationSelect ({ latitude, longitude, address, city, area }) => void
 *   value            { latitude, longitude } — optional, edit form ke liye
 *   height           map ki height (default 320px)
 */

const loadLeafletCSS = () => {
  if (document.getElementById("leaflet-css")) return;
  const link = document.createElement("link");
  link.id = "leaflet-css";
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
};

// Nominatim ki fair-use policy hai — 1 request/second se zyada mat maro
const reverseGeocode = async (lat, lng) => {
  try {
    // NOTE: custom headers mat bhejo — Nominatim pe CORS preflight fail
    // ho jaata hai aur fetch chupchaap catch me chala jaata hai.
    // Language query param se set karo.
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=en&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const d = await res.json();
    const a = d.address || {};
    return {
      address: d.display_name || "",
      city: a.city || a.town || a.village || a.state_district || a.county || "",
      area: a.suburb || a.neighbourhood || a.road || a.hamlet || "",
    };
  } catch (err) {
    console.warn("Reverse geocode fail:", err.message);
    return { address: "", city: "", area: "" };
  }
};

const LocationPicker = ({ onLocationSelect, onChange, value, height = 320 }) => {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const LRef = useRef(null);
  // Dono prop names support karo — purana onLocationSelect, naya onChange
  const onChangeRef = useRef(null);
  onChangeRef.current = onLocationSelect || onChange;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [resolving, setResolving] = useState(false);
  const [ready, setReady] = useState(false);

  // Pin set karo + parent ko batao
  const setPin = useCallback(async (lat, lng, skipReverse = false) => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on("dragend", (e) => {
        const p = e.target.getLatLng();
        setPin(p.lat, p.lng);
      });
    }

    if (skipReverse) {
      onChangeRef.current?.({ latitude: lat, longitude: lng });
      return;
    }

    setResolving(true);
    const info = await reverseGeocode(lat, lng);
    setResolving(false);
    onChangeRef.current?.({ latitude: lat, longitude: lng, ...info });
  }, []);

  // Map initialize — sirf ek baar
  useEffect(() => {
    loadLeafletCSS();
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default || (await import("leaflet"));
      if (cancelled || !mapEl.current || mapRef.current) return;

      LRef.current = L;

      // Marker icon ka default path Vite build me tut jaata hai —
      // isliye CDN se explicitly set kar rahe hain
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const start = value?.latitude && value?.longitude
        ? [parseFloat(value.latitude), parseFloat(value.longitude)]
        : [20.5937, 78.9629]; // India center

      const map = L.map(mapEl.current, {
        center: start,
        zoom: value?.latitude ? 16 : 5,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "©️ OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e) => setPin(e.latlng.lat, e.latlng.lng));

      mapRef.current = map;
      setReady(true);

      if (value?.latitude && value?.longitude) {
        setPin(parseFloat(value.latitude), parseFloat(value.longitude), true);
      }

      // Container ka size baad me settle hota hai — warna map aadha grey dikhta hai
      setTimeout(() => map.invalidateSize(), 200);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchPlace = useCallback(async (q) => {
    const term = (q ?? query).trim();
    if (term.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&accept-language=en` +
          `&q=${encodeURIComponent(term)}&countrycodes=in&limit=6&addressdetails=1`
      );
      if (!res.ok) throw new Error(`Nominatim ${res.status}`);
      const data = await res.json();
      setResults(data);
      if (!data.length) setSearchError("Koi jagah nahi mili. Doosre naam se try karo, ya map pe seedha click kar do.");
    } catch (err) {
      console.error("Location search fail:", err);
      setResults([]);
      setSearchError("Search service se connect nahi hua. Map pe click karke pin laga sakte ho.");
    } finally {
      setSearching(false);
    }
  }, [query]);

  // Type karte hi apne aap search — button dabana zaroori na ho
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => searchPlace(query), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const pickResult = (r) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    mapRef.current?.setView([lat, lng], 17);
    setPin(lat, lng);
    setResults([]);
    setQuery(r.display_name.split(",").slice(0, 3).join(", "));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setResolving(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapRef.current?.setView([latitude, longitude], 17);
        setPin(latitude, longitude);
      },
      () => {
        setResolving(false);
        alert("Location access nahi mila. Browser settings me permission do.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchPlace();
              }
            }}
            placeholder="Jagah ka naam likho — jaise 'Boring Road, Patna'"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <button
          type="button"
          onClick={() => searchPlace()}
          disabled={searching}
          className="h-11 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {searching ? <Loader2 size={16} className="animate-spin" /> : "Dhundo"}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          title="Meri current location"
          className="h-11 px-3 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <Crosshair size={17} className="text-gray-600" />
        </button>
      </div>

      {searchError && !results.length && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {searchError}
        </p>
      )}

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden divide-y">
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => pickResult(r)}
              className="w-full text-left px-3 py-2.5 hover:bg-orange-50 text-sm flex gap-2"
            >
              <MapPin size={15} className="text-orange-500 shrink-0 mt-0.5" />
              <span className="text-gray-700 line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative rounded-xl overflow-hidden border border-gray-200">
        <div ref={mapEl} style={{ height }} className="w-full bg-gray-100" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-sm text-gray-500">
            Map load ho raha hai...
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <MapPin size={13} className="text-orange-500" />
        Map pe click karo ya pin ko drag karke exact jagah set karo.
        {resolving && <span className="text-orange-500">Address nikal rahe hain...</span>}
      </p>

      {value?.latitude && value?.longitude && (
        <div className="text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700">
          Pin set hai — {parseFloat(value.latitude).toFixed(6)},{" "}
          {parseFloat(value.longitude).toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;