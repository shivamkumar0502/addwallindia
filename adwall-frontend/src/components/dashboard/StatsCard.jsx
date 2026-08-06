import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const StatsCard = ({ title, value, subtitle, icon, color = "brand" }) => {
  const colors = {
    brand: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center text-2xl", colors[color])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};
export default StatsCard;
