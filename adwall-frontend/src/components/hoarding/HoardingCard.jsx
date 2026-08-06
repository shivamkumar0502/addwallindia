import { Link } from "react-router-dom";
import { MapPin, Eye, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_LABEL = {
  hoarding: "Hoarding", billboard: "Billboard", led_screen: "LED Screen",
  wall_painting: "Wall Painting", bus_branding: "Bus Branding", metro_ads: "Metro Ads",
  airport_ads: "Airport Ads", mall_branding: "Mall Branding",
};

const HoardingCard = ({ hoarding }) => {
  const { _id, title, images, location, category, pricing, lighting, dailyTraffic, rating, totalReviews } = hoarding;
  return (
    <Link to={`/hoarding/${_id}`} className="group block">
      <div className="rounded-xl border bg-white overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {images?.[0] ? (
            <img src={images[0]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300 text-4xl">🪧</div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs bg-white/90 text-gray-700">{CATEGORY_LABEL[category] || category}</Badge>
          </div>
          {lighting === "led" && (
            <div className="absolute top-2 right-2">
              <Badge className="text-xs"><Zap size={10} className="inline mr-1" />LED</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-500">{title}</h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <MapPin size={13} />{location?.area}, {location?.city}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(pricing?.perMonth)}</span>
              <span className="text-xs text-gray-500">/month</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {rating > 0 && <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" />{rating} ({totalReviews})</span>}
              <span className="flex items-center gap-1 capitalize"><Eye size={12} />{dailyTraffic?.replace("_", " ")}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
export default HoardingCard;
