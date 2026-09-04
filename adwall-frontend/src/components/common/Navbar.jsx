import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Bell, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/search", label: "Search Hoardings" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    return `/${user.role}/dashboard`;
  };

  // FIX: Profile link hardcoded "/profile" pe jaa raha tha, par aisa koi
  // route hai hi nahi — Profile nested route hai (/client/profile,
  // /owner/profile, /admin/profile). Isliye click karne pe kuch nahi hota tha.
  const getProfileLink = () => {
    if (!user) return "/login";
    return `/${user.role}/profile`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">AW</span>
            </div>
            <span className="text-xl font-black text-gray-900">
              AdWall <span className="text-brand-500">India</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === to
                    ? "text-brand-600 bg-orange-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-brand-500 rounded-lg hover:bg-gray-50">
                  <Bell size={20} />
                </Link>
                <div className="relative">
                  <button onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 hover:bg-gray-50 transition-colors">
                    <Avatar src={user.avatar} alt={user.name} fallback={user.name?.[0]?.toUpperCase()} className="h-7 w-7" />
                    <span className="text-sm font-medium text-gray-700">{user.name?.split(" ")[0]}</span>
                    <ChevronDown size={13} className="text-gray-400" />
                  </button>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-white shadow-xl py-1.5 z-50">
                        <div className="px-4 py-2 border-b mb-1">
                          <p className="text-xs font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                        </div>
                        <Link to={getDashboardLink()} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Dashboard</Link>
                        <Link to={getProfileLink()} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Profile</Link>
                        <div className="border-t my-1" />
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Logout</button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
                <Button size="sm" onClick={() => navigate("/register")}>Register Free</Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="block px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
          <div className="border-t pt-3 mt-3">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="block px-3 py-2.5 text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-sm text-red-500">Logout</button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm" onClick={() => { navigate("/login"); setMenuOpen(false); }}>Login</Button>
                <Button className="flex-1" size="sm" onClick={() => { navigate("/register"); setMenuOpen(false); }}>Register</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;