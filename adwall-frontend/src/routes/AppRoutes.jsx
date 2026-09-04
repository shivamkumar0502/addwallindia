import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import DashboardSidebar from "@/components/common/DashboardSidebar";
import ProtectedRoute from "@/components/common/ProtectedRoute";

// Public
import Home from "@/pages/public/Home";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import Search from "@/pages/public/Search";
import HoardingDetail from "@/pages/public/HoardingDetail";
import Services from "@/pages/public/Services";
import About from "@/pages/public/About";
import Contact from "@/pages/public/Contact";
// FIX: ye page banaya hua tha par route kabhi add nahi kiya —
// isliye /forgot-password pe jaate hi 404 aata tha.
import ForgotPassword from "@/pages/public/ForgotPassword";
// FIX: MapView page bana hua tha par route missing tha — Search page ka
// "Map View" button /map pe navigate karta hai aur 404 mil jaata tha.
import MapView from "@/pages/public/MapView";

// Shared
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Chat from "@/pages/Chat";

// Client
import ClientDashboard from "@/pages/client/Dashboard";
import MyBookings from "@/pages/client/MyBookings";
import BookingDetail from "@/pages/client/BookingDetail";
import ClientWallet from "@/pages/client/Wallet";
import ClientAnalytics from "@/pages/client/Analytics";
import BroadcastCampaign from "@/pages/client/BroadcastCampaign";

// Owner
import OwnerDashboard from "@/pages/owner/Dashboard";
import MyHoardings from "@/pages/owner/MyHoardings";
import AddHoarding from "@/pages/owner/AddHoarding";
import OwnerBookings from "@/pages/owner/Bookings";
import OwnerKyc from "@/pages/owner/KYC";
import FeaturedListings from "@/pages/owner/FeaturedListings";
import SubscriptionPage from "@/pages/owner/Subscription";

// Admin
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminKYC from "@/pages/admin/KYC";
import AdminHoardings from "@/pages/admin/Hoardings";
import AdminUsers from "@/pages/admin/Users";
import AdminBookings from "@/pages/admin/Bookings";
import AdminPayments from "@/pages/admin/Payments";
import AdminReports from "@/pages/admin/Reports";
import AdminCoupons from "@/pages/admin/Coupons";

// Legal Pages
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsConditions from "@/pages/legal/TermsConditions";
import RefundCancellationPolicy from "@/pages/legal/RefundCancellationPolicy";
import CookiePolicy from "@/pages/legal/CookiePolicy";
import Disclaimer from "@/pages/legal/Disclaimer";

const PublicLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1"><Outlet /></main>
    <Footer />
  </div>
);

const DashboardLayout = ({ role }) => (
  <ProtectedRoute allowedRoles={[role]}>
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  </ProtectedRoute>
);

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/hoarding/:id" element={<HoardingDetail />} />
      <Route path="/services" element={<Services />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/map" element={<MapView />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
  <Route path="/terms-and-conditions" element={<TermsConditions />} />
  <Route
    path="/refund-cancellation-policy"
    element={<RefundCancellationPolicy />}
  />
  <Route path="/cookie-policy" element={<CookiePolicy />} />
  <Route path="/disclaimer" element={<Disclaimer />} />
    </Route>

    {/* Chat — Full screen */}
    <Route path="/chat/:bookingId" element={
      <ProtectedRoute allowedRoles={["client","owner","admin"]}>
        <Chat />
      </ProtectedRoute>
    } />

    {/* Client */}
    <Route path="/client" element={<DashboardLayout role="client" />}>
      <Route path="dashboard" element={<ClientDashboard />} />
      <Route path="bookings" element={<MyBookings />} />
      <Route path="bookings/:id" element={<BookingDetail />} />
      <Route path="campaigns" element={<BroadcastCampaign />} />
      <Route path="wallet" element={<ClientWallet />} />
      <Route path="analytics" element={<ClientAnalytics />} />
      <Route path="profile" element={<Profile />} />
      <Route path="notifications" element={<Notifications />} />
    </Route>

    {/* Owner */}
    <Route path="/owner" element={<DashboardLayout role="owner" />}>
      <Route path="dashboard" element={<OwnerDashboard />} />
      <Route path="hoardings" element={<MyHoardings />} />
      <Route path="add-hoarding" element={<AddHoarding />} />
      <Route path="bookings" element={<OwnerBookings />} />
      <Route path="bookings/:id" element={<BookingDetail />} />
      <Route path="wallet" element={<ClientWallet />} />
      <Route path="kyc" element={<OwnerKyc />} />
      <Route path="featured" element={<FeaturedListings />} />
      <Route path="subscription" element={<SubscriptionPage />} />
      <Route path="profile" element={<Profile />} />
      <Route path="notifications" element={<Notifications />} />
    </Route>

    {/* Admin */}
    <Route path="/admin" element={<DashboardLayout role="admin" />}>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="kyc" element={<AdminKYC />} />
      <Route path="hoardings" element={<AdminHoardings />} />
      <Route path="bookings" element={<AdminBookings />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="reports" element={<AdminReports />} />
      <Route path="coupons" element={<AdminCoupons />} />
      <Route path="profile" element={<Profile />} />
      <Route path="notifications" element={<Notifications />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;