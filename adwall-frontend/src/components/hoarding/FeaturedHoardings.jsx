import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Star, Crown, Flame, TrendingUp } from "lucide-react";

const BADGE_UI = {
  hot: { icon: <Flame size={11} />, label: "Hot", color: "bg-red-500 text-white" },
  trending: { icon: <TrendingUp size={11} />, label: "Trending", color: "bg-blue-500 text-white" },
  premium: { icon: <Crown size={11} />, label: "Premium", color: "bg-yellow-500 text-white" },
};

const FeaturedHoardings = () => {
  const [hoardings, setHoardings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/featured").then(r => setHoardings(r.data.data || [])).catch(() => {});
  }, []);

  if (!hoardings.length) return null;

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown size={20} className="text-yellow-500" />
              <span className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">Featured Listings</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900">Premium Ad Spaces</h2>
            <p className="text-gray-500 mt-1">Top verified locations — high visibility, guaranteed reach</p>
          </div>
          <button onClick={() => navigate("/search")} className="text-sm text-brand-500 hover:underline font-medium hidden md:block">
            Sab Dekho →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {hoardings.slice(0, 8).map(h => {
            const badge = BADGE_UI[h.featuredBadge];
            return (
              <Link key={h._id} to={`/hoarding/${h._id}`} className="group block">
                <div className="rounded-2xl border bg-white overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative h-44 bg-gray-100 overflow-hidden">
                    {h.images?.[0]
                      ? <img src={h.images[0]} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="flex h-full items-center justify-center text-4xl">🪧</div>}

                    {/* Featured Badge */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {badge && (
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.icon}{badge.label}
                        </span>
                      )}
                    </div>

                    {/* Featured crown */}
                    <div className="absolute top-2 right-2 h-7 w-7 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                      <Crown size={14} className="text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-brand-500 transition-colors">{h.title}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <MapPin size={11} />{h.location?.area}, {h.location?.city}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-lg font-black text-gray-900">{formatCurrency(h.pricing?.perMonth)}</span>
                        <span className="text-xs text-gray-400">/mo</span>
                      </div>
                      {h.rating > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Star size={11} className="text-yellow-400 fill-yellow-400" />{h.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedHoardings;
