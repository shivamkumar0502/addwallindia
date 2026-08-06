import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { hoardingService } from "@/services/api";
import HoardingCard from "@/components/hoarding/HoardingCard";
import SearchFilters from "@/components/hoarding/SearchFilters";
import Loader from "@/components/common/Loader";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoardings, setHoardings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");

  const fetchHoardings = async (filters = {}, page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 12, sortBy };
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
  }, [searchParams, sortBy]);

  const handleSearch = (filters) => {
    setSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
    fetchHoardings(filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Filters */}
        <div className="mb-6">
          <SearchFilters onSearch={handleSearch} loading={loading} />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {loading ? "Searching..." : `${pagination.total} ad spaces mile`}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/map" + (searchParams.toString() ? "?" + searchParams.toString() : ""))}
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
