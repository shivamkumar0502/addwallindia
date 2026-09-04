import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

// Public screens
import HomeScreen from "../screens/public/HomeScreen";
import LoginScreen from "../screens/public/LoginScreen";
import RegisterScreen from "../screens/public/RegisterScreen";
// FIX: ForgotPassword pehle DashboardPlaceholder pe point karta tha —
// screen khulti thi par kuch kaam nahi karti thi. Ab asli screen hai.
import ForgotPasswordScreen from "../screens/public/ForgotPasswordScreen";
import SearchScreen from "../screens/public/SearchScreen";
import HoardingDetailScreen from "../screens/public/HoardingDetailScreen";
import DashboardPlaceholder from "../screens/DashboardPlaceholder";
import ProfileScreen from "../screens/ProfileScreen";
import PublicHeader from "../components/PublicHeader";

// Shared
import MyBookingsScreen from "../screens/shared/MyBookingsScreen";
import BookingDetailScreen from "../screens/shared/BookingDetailScreen";
import WalletScreen from "../screens/shared/WalletScreen";

// Client
import ClientDashboardScreen from "../screens/client/DashboardScreen";
import AnalyticsScreen from "../screens/client/AnalyticsScreen";
import BroadcastCampaignScreen from "../screens/client/BroadcastCampaignScreen";

// Owner
import OwnerDashboardScreen from "../screens/owner/DashboardScreen";
import MyHoardingsScreen from "../screens/owner/MyHoardingsScreen";
import AddHoardingScreen from "../screens/owner/AddHoardingScreen";
import KYCScreen from "../screens/owner/KYCScreen";
import FeaturedListingsScreen from "../screens/owner/FeaturedListingsScreen";
import SubscriptionScreen from "../screens/owner/SubscriptionScreen";

// Admin
import AdminDashboardScreen from "../screens/admin/DashboardScreen";
import KYCReviewScreen from "../screens/admin/KYCReviewScreen";
import HoardingsReviewScreen from "../screens/admin/HoardingsReviewScreen";
import UsersScreen from "../screens/admin/UsersScreen";
import AdminBookingsScreen from "../screens/admin/AdminBookingsScreen";
import AdminPaymentsScreen from "../screens/admin/AdminPaymentsScreen";
import ReportsScreen from "../screens/admin/ReportsScreen";
import CouponsScreen from "../screens/admin/CouponsScreen";

// Chat
import ChatScreen from "../screens/shared/ChatScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---------- Public (logged-out) stack ----------
function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: true, header: (props) => <PublicHeader {...props} /> }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: true, header: (props) => <PublicHeader {...props} /> }}
      />
      <Stack.Screen name="HoardingDetail" component={HoardingDetailScreen} options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: true, title: "Forgot Password" }} />
    </Stack.Navigator>
  );
}

// ---------- Shared stack screens wrapper (adds detail/nested screens on top of tabs) ----------
function withSharedStack(TabsComponent, homeName) {
  return function Wrapped() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={homeName} component={TabsComponent} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ headerShown: true, title: "Booking Details" }} />
        <Stack.Screen name="HoardingDetail" component={HoardingDetailScreen} options={{ headerShown: true, title: "" }} />
        <Stack.Screen name="AddHoarding" component={AddHoardingScreen} options={{ headerShown: true, title: "Add Hoarding" }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ headerShown: true, title: "Analytics" }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: "Chat" }} />
      </Stack.Navigator>
    );
  };
}

// ---------- Client tabs ----------
function ClientTabsInner() {
  return (
    <Tab.Navigator screenOptions={({ route }) => tabScreenOptions(route)}>
      <Tab.Screen name="Dashboard" component={ClientDashboardScreen} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: "Bookings" }} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Campaigns" component={BroadcastCampaignScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
const ClientTabs = withSharedStack(ClientTabsInner, "ClientTabsHome");

// ---------- Owner tabs ----------
function OwnerTabsInner() {
  return (
    <Tab.Navigator screenOptions={({ route }) => tabScreenOptions(route)}>
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="MyHoardings" component={MyHoardingsScreen} options={{ title: "Hoardings" }} />
      <Tab.Screen name="Bookings" component={MyBookingsScreen} initialParams={{ isOwner: true }} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
function OwnerTabsWrapped() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerTabsHome" component={OwnerTabsInner} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ headerShown: true, title: "Booking Details" }} />
      <Stack.Screen name="HoardingDetail" component={HoardingDetailScreen} options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="AddHoarding" component={AddHoardingScreen} options={{ headerShown: true, title: "Add Hoarding" }} />
      <Stack.Screen name="KYC" component={KYCScreen} options={{ headerShown: true, title: "KYC Verification" }} />
      <Stack.Screen name="FeaturedListings" component={FeaturedListingsScreen} options={{ headerShown: true, title: "Featured Listings" }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ headerShown: true, title: "Subscription" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: "Chat" }} />
    </Stack.Navigator>
  );
}

// ---------- Admin tabs ----------
function AdminTabsInner() {
  return (
    <Tab.Navigator screenOptions={({ route }) => tabScreenOptions(route)}>
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Bookings" component={AdminBookingsScreen} />
      <Tab.Screen name="Payments" component={AdminPaymentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
function AdminTabsWrapped() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabsHome" component={AdminTabsInner} />
      <Stack.Screen name="KYCReview" component={KYCReviewScreen} options={{ headerShown: true, title: "KYC Review" }} />
      <Stack.Screen name="HoardingsReview" component={HoardingsReviewScreen} options={{ headerShown: true, title: "Verify Hoardings" }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerShown: true, title: "Reports" }} />
      <Stack.Screen name="Coupons" component={CouponsScreen} options={{ headerShown: true, title: "Coupons" }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ headerShown: true, title: "Booking Details" }} />
    </Stack.Navigator>
  );
}

const ICONS = {
  Dashboard: "grid-outline",
  MyBookings: "receipt-outline",
  Bookings: "receipt-outline",
  Search: "search-outline",
  Wallet: "wallet-outline",
  Profile: "person-outline",
  MyHoardings: "megaphone-outline",
  Users: "people-outline",
  Payments: "card-outline",
  Campaigns: "megaphone-outline",
};

function tabScreenOptions(route) {
  return {
    headerShown: true,
    tabBarActiveTintColor: colors.brand600,
    tabBarInactiveTintColor: colors.gray400,
    tabBarIcon: ({ color, size }) => (
      <Ionicons name={ICONS[route.name] || "ellipse-outline"} size={size} color={color} />
    ),
  };
}

// ---------- Root: switch based on auth + role ----------
export default function AppNavigator() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.brand500} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated && <PublicStack />}
      {isAuthenticated && user.role === "client" && <ClientTabs />}
      {isAuthenticated && user.role === "owner" && <OwnerTabsWrapped />}
      {isAuthenticated && user.role === "admin" && <AdminTabsWrapped />}
    </NavigationContainer>
  );
}