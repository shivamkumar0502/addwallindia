const mongoose = require("mongoose");

const hoardingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Hoarding title required hai"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "hoarding", "billboard", "led_screen", "wall_painting",
        "bus_branding", "auto_branding", "cab_branding", "metro_ads",
        "railway_ads", "airport_ads", "mall_branding", "cinema_ads",
        "stadium_ads", "petrol_pump", "event_branding",
      ],
    },

    // Location details
    location: {
      city: { type: String, required: true, trim: true },
      area: { type: String, required: true, trim: true },
      address: { type: String, trim: true },
      // GeoJSON format - Google Maps API ke saath kaam karta hai
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: {
          type: [Number], // [longitude, latitude] — GeoJSON order ye hai
          required: true,
        },
      },
    },

    // Physical specs
    dimensions: {
      width: { type: Number, required: true },   // feet me
      height: { type: Number, required: true },  // feet me
      unit: { type: String, default: "feet" },
    },

    // Media
    images: [{ type: String }],  // Cloudinary URLs
    video: { type: String, default: null },

    // Pricing — per day/week/month
    pricing: {
      perDay: { type: Number, default: null },
      perWeek: { type: Number, default: null },
      perMonth: { type: Number, required: [true, "Monthly price required hai"] },
      isNegotiable: { type: Boolean, default: true },
    },

    // Extra details
    facingDirection: {
      type: String,
      enum: ["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"],
      default: null,
    },
    lighting: {
      type: String,
      enum: ["none", "frontlit", "backlit", "led"],
      default: "none",
    },
    dailyTraffic: {
      type: String,
      enum: ["low", "medium", "high", "very_high"],
      default: "medium",
    },
    landmarkNearby: { type: String, default: null }, // "Near XYZ Mall"

    // Admin verification
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: null },

    isActive: { type: Boolean, default: true }, // owner ne temporarily band kiya ho

    // Analytics (baad me kaam aayega)
    views: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    // Featured listing
    // Availability calendar
    availability: {
      blockedDates: [{ type: String }], // "2026-07-15" format
      availableFrom: { type: Date, default: null },
      availableUntil: { type: Date, default: null },
    },

    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date, default: null },
    featuredBadge: { type: String, enum: ["hot", "trending", "premium", null], default: null },
  },
  { timestamps: true }
);

// Geospatial queries ke liye 2dsphere index — location based search enable karta hai
hoardingSchema.index({ "location.coordinates": "2dsphere" });

// Filtering ke liye compound index
hoardingSchema.index({ "location.city": 1, category: 1, verificationStatus: 1 });

module.exports = mongoose.model("Hoarding", hoardingSchema);
