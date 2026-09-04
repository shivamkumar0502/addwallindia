import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { hoardingService } from "@/services/api";
import HoardingCard from "@/components/hoarding/HoardingCard";
import SearchFilters from "@/components/hoarding/SearchFilters";
import Loader from "@/components/common/Loader";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LayoutGrid, List, Crosshair, MapPin, X } from "lucide-react";
import LocationPicker from "@/components/hoarding/LocationPicker";

const Search = () => {
  // FIX: `navigate` niche Map View button me use ho raha tha par kabhi
  // import hi nahi kiya gaya tha — button click pe ReferenceError aata tha.
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoardings, setHoardings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");

  // ── Location based search ──
  const [showMap, setShowMap] = useState(false);
  const [geo, setGeo] = useState(null);   // { latitude, longitude, address }
  const [radius, setRadius] = useState(10); // km

  const fetchHoardings = async (filters = {}, page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 12, sortBy };

      // Location filter on ho to distance ke hisaab se results aayenge
      if (geo?.latitude && geo?.longitude) {
        params.lat = geo.latitude;
        params.lng = geo.longitude;
        params.radius = radius;
      }
      // Remove empty values
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await hoardingService.search(params);
      setHoardings(data.data.hoardings);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const city = searchParams.get("city") || "";
    const category = searchParams.get("category") || "";
    fetchHoardings({ city, category });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sortBy, geo, radius]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser location support nahi karta.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeo({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: "Aapki current location",
        }),
      () => alert("Location access nahi mila. Browser settings me permission do.")
    );
  };

  const handleSearch = (filters) => {
    setSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
    fetchHoardings(filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Filters */}
        <div className="mb-4">
          <SearchFilters onSearch={handleSearch} loading={loading} />
        </div>

        {/* ── Location search (naya) ── */}
        <div className="mb-6">
          {!geo ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={useMyLocation}
                className="flex items-center gap-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-lg font-medium transition"
              >
                <Crosshair size={15} /> Mere aas-paas dhundo
              </button>
              <button
                onClick={() => setShowMap((v) => !v)}
                className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-lg font-medium transition"
              >
                <MapPin size={15} /> {showMap ? "Map band karo" : "Map se location chuno"}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-orange-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2 min-w-0">
                  <MapPin size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Is location ke aas-paas</p>
                    <p className="text-xs text-gray-500 truncate">
                      {geo.address || `${(+geo.latitude).toFixed(4)}, ${(+geo.longitude).toFixed(4)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setGeo(null); setShowMap(false); }}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                  title="Location filter hatao"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-gray-500 shrink-0">Dayra</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="text-xs font-semibold text-orange-600 w-14 text-right">
                  {radius} km
                </span>
              </div>
            </div>
          )}

          {showMap && (
            <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
              <LocationPicker
                height={300}
                value={geo}
                onLocationSelect={(loc) => setGeo(loc)}
              />
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {loading ? "Searching..." : `${pagination.total} ad spaces mile`}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => {
                const p = new URLSearchParams(searchParams);
                if (geo?.latitude) { p.set("lat", geo.latitude); p.set("lng", geo.longitude); p.set("radius", radius); }
                navigate("/map" + (p.toString() ? "?" + p.toString() : ""));
              }}
              className="flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
              🗺️ Map View
            </button>
            <Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-40 h-9 text-sm">
              <option value="createdAt">Latest First</option>
              <option value="price">Price: Low to High</option>
              <option value="rating">Top Rated</option>
            </Select>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <Loader className="py-24" size="lg" />
        ) : hoardings.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Koi hoarding nahi mili</h3>
            <p className="text-gray-500">Filters change karke try karo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hoardings.map(h => <HoardingCard key={h._id} hoarding={h} />)}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchHoardings({}, pagination.page - 1)}>
              <ChevronLeft size={16} />Prev
            </Button>
            <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={() => fetchHoardings({}, pagination.page + 1)}>
              Next<ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
export default Search;