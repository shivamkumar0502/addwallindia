import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = ["hoarding","billboard","led_screen","wall_painting","bus_branding","auto_branding","metro_ads","railway_ads","airport_ads","mall_branding","cinema_ads","stadium_ads","event_branding"];

const SearchFilters = ({ onSearch, loading }) => {
  const [filters, setFilters] = useState({ city: "", category: "", minPrice: "", maxPrice: "", lighting: "", dailyTraffic: "" });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const handle = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const handleSubmit = (e) => { e.preventDefault(); onSearch(filters); };
  const handleReset = () => { setFilters({ city: "", category: "", minPrice: "", maxPrice: "", lighting: "", dailyTraffic: "" }); onSearch({}); };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <Input className="flex-1" placeholder="City search karo... (Delhi, Mumbai, Bangalore)" value={filters.city} onChange={e => handle("city", e.target.value)} />
        <Select value={filters.category} onChange={e => handle("category", e.target.value)} className="md:w-48">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </Select>
        <Button type="submit" disabled={loading}><Search size={16} className="mr-2" />Search</Button>
        <Button type="button" variant="outline" onClick={() => setShowAdvanced(!showAdvanced)}><SlidersHorizontal size={16} /></Button>
      </div>
      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
          <div><label className="text-xs text-gray-500 mb-1 block">Min Price (₹/month)</label><Input type="number" placeholder="5000" value={filters.minPrice} onChange={e => handle("minPrice", e.target.value)} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Max Price (₹/month)</label><Input type="number" placeholder="100000" value={filters.maxPrice} onChange={e => handle("maxPrice", e.target.value)} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Lighting</label>
            <Select value={filters.lighting} onChange={e => handle("lighting", e.target.value)}>
              <option value="">Any</option><option value="none">None</option><option value="frontlit">Front Lit</option><option value="backlit">Back Lit</option><option value="led">LED</option>
            </Select>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Daily Traffic</label>
            <Select value={filters.dailyTraffic} onChange={e => handle("dailyTraffic", e.target.value)}>
              <option value="">Any</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="very_high">Very High</option>
            </Select>
          </div>
          <button type="button" onClick={handleReset} className="col-span-full flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 mt-1"><X size={12} />Clear all filters</button>
        </div>
      )}
    </form>
  );
};
export default SearchFilters;
