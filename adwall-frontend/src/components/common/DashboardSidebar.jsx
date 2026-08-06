import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const clientLinks = [
  { to: "/client/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/client/bookings", label: "My Bookings", icon: "📋" },
  { to: "/client/campaigns", label: "Broadcast Campaign", icon: "📢" },
  { to: "/client/wallet", label: "Wallet", icon: "💰" },
  { to: "/client/analytics", label: "Analytics", icon: "📊" },
  { to: "/client/notifications", label: "Notifications", icon: "🔔" },
  { to: "/client/profile", label: "Profile", icon: "👤" },
];

const ownerLinks = [
  { to: "/owner/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/owner/hoardings", label: "My Hoardings", icon: "🪧" },
  { to: "/owner/add-hoarding", label: "Add Hoarding", icon: "➕" },
  { to: "/owner/bookings", label: "Bookings", icon: "📋" },
  { to: "/owner/wallet", label: "Wallet & Earnings", icon: "💰" },
  { to: "/owner/featured", label: "Featured Listing", icon: "👑", badge: "PRO" },
  { to: "/owner/subscription", label: "Subscription", icon: "⚡", badge: "NEW" },
  { to: "/owner/kyc", label: "KYC Status", icon: "✅" },
  { to: "/owner/notifications", label: "Notifications", icon: "🔔" },
  { to: "/owner/profile", label: "Profile", icon: "👤" },
];

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/admin/kyc", label: "KYC Verification", icon: "🔍" },
  { to: "/admin/hoardings", label: "Hoarding Verify", icon: "🪧" },
  { to: "/admin/bookings", label: "Bookings", icon: "📋" },
  { to: "/admin/payments", label: "Payments", icon: "💳" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/coupons", label: "Coupons", icon: "🏷️" },
  { to: "/admin/reports", label: "Reports & Export", icon: "📈" },
  { to: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { to: "/admin/profile", label: "Profile", icon: "👤" },
];

const DashboardSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const links = user?.role === "client" ? clientLinks
    : user?.role === "owner" ? ownerLinks : adminLinks;

  return (
    <aside className="w-64 min-h-screen bg-white border-r hidden md:flex flex-col">
      <div className="p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-brand-500 flex items-center justify-center">
            <span className="text-white font-black text-xs">AW</span>
          </div>
          <span className="font-black text-gray-900">AdWall India</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, icon, badge }) => (
          <Link key={to} to={to}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === to || location.pathname.startsWith(to + "/")
                ? "bg-brand-50 text-brand-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}>
            <span className="text-base flex-shrink-0">{icon}</span>
            <span className="flex-1">{label}</span>
            {badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0
                ${badge === "NEW" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="text-xs text-gray-400">Logged in as</div>
        <div className="font-semibold text-gray-900 text-sm truncate">{user?.name}</div>
        <div className="text-xs text-brand-500 capitalize">{user?.role}</div>
      </div>
    </aside>
  );
};
export default DashboardSidebar;
