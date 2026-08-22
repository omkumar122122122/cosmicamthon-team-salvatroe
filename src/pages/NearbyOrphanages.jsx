import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiGlobe,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiSearch,
  FiGrid,
  FiMap,
  FiHeart,
  FiShield,
  FiPackage,
} from "react-icons/fi";
import { orphanagesService } from "../services/orphanagesService";
import NearbyOrphanageMap from "../components/NearbyOrphanageMap";
import DonationScheduleModal from "../components/DonationScheduleModal";

// Helper to normalize website URLs for external navigation
function getFormattedWebsiteUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || /^none$/i.test(trimmed) || /^n\/a$/i.test(trimmed) || /^null$/i.test(trimmed)) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function NearbyOrphanages() {
  // Coordinates & Location state
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Radius state (Default: 10 km)
  const [radius, setRadius] = useState(10); // 5, 10, 25, 50, or 100 km

  // Results & Loading state
  const [orphanages, setOrphanages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrphanage, setSelectedOrphanage] = useState(null);

  // Mobile View Switcher state ("list" | "map")
  const [mobileTab, setMobileTab] = useState("list");

  // Modal state for Physical Goods Donation
  const [scheduleModalOrphanage, setScheduleModalOrphanage] = useState(null);

  // Fetch nearby orphanages from backend using existing coordinates & radius
  const fetchNearby = useCallback(async (lat, lng, rad) => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await orphanagesService.getNearby(lat, lng, rad);
      setOrphanages(data || []);
    } catch (err) {
      setApiError(err.message || "Nearby orphanage data is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handler to request browser Geolocation permission
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setLocating(false);
        fetchNearby(coords.lat, coords.lng, radius);
      },
      (err) => {
        setLocating(false);
        let errorMsg = "Unable to retrieve your location.";
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please allow location access in your browser settings to find nearby orphanages.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is currently unavailable. Please check your network connection or try again.";
        } else if (err.code === err.TIMEOUT) {
          errorMsg = "Location request timed out. Please try clicking 'Use My Current Location' again.";
        }
        setLocationError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Re-query backend when radius changes (using already acquired location)
  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (userCoords) {
      fetchNearby(userCoords.lat, userCoords.lng, newRadius);
    }
  };

  // Initial auto-check location on page mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  // Filter orphanages by search query
  const filteredOrphanages = orphanages.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name?.toLowerCase().includes(q) ||
      item.address?.toLowerCase().includes(q) ||
      item.city?.toLowerCase().includes(q)
    );
  });

  // OpenStreetMap direction link
  const getDirectionsUrl = (item) => {
    if (userCoords) {
      return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userCoords.lat}%2C${userCoords.lng}%3B${item.latitude}%2C${item.longitude}`;
    }
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${item.latitude}%2C${item.longitude}`;
  };

  return (
    <div className="space-y-8">
      {/* ── Top Page Header Banner (Matches Donor Dashboard Style) ──── */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/85 p-6 sm:p-7 shadow-card backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#2563EB] dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300 mb-2">
              <FiHeart className="h-3.5 w-3.5 fill-current text-rose-500" />
              <span>Nearby Philanthropic Discovery</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Nearby Orphanages
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#64748B] dark:text-slate-300 max-w-xl font-sans">
              Find verified orphanages and child care centers near your location using OpenStreetMap.
            </p>
          </div>

          <button
            onClick={handleGetLocation}
            disabled={locating}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-indigo-700 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all transform active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Use My Current Location"
          >
            <FiRefreshCw className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
            <span>{locating ? "Acquiring Location..." : "Use My Current Location"}</span>
          </button>
        </div>
      </div>

      {/* ── Error & Warning Banners ───────────────────────────────── */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/40 dark:border-amber-500/30 dark:text-amber-200 text-xs font-semibold flex items-start gap-3 shadow-sm"
            role="alert"
          >
            <FiAlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Location Permission Required: </span>
              {locationError}
            </div>
            <button
              onClick={handleGetLocation}
              className="text-xs font-bold underline text-amber-700 dark:text-amber-300 hover:text-amber-900 shrink-0"
            >
              Retry
            </button>
          </motion.div>
        )}

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-900/40 dark:border-rose-500/30 dark:text-rose-200 text-xs font-semibold flex items-start gap-3 shadow-sm"
            role="alert"
          >
            <FiAlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">API Warning: </span>
              {apiError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls Bar Card (Matches Donor Dashboard Form Style) ──── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Radius HTML Select Control */}
          <div className="flex items-center gap-3">
            <label htmlFor="radius-select" className="text-xs font-bold text-[#0F172A] dark:text-slate-200 font-display flex items-center gap-1.5 shrink-0">
              <FiFilter className="h-4 w-4 text-[#2563EB]" /> Search Radius
            </label>
            <div className="relative">
              <select
                id="radius-select"
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-8 py-2 text-xs font-bold text-[#0F172A] dark:border-slate-700 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] cursor-pointer transition-all"
                aria-label="Search Radius"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by orphanage name, city, or street address..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs font-medium text-[#0F172A] placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Mobile View Toggle Switcher */}
          <div className="flex md:hidden justify-end">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMobileTab("list")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mobileTab === "list"
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FiGrid className="h-3.5 w-3.5" /> List View
              </button>
              <button
                onClick={() => setMobileTab("map")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mobileTab === "map"
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FiMap className="h-3.5 w-3.5" /> Map View
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-[#0F172A] dark:text-white font-bold">{filteredOrphanages.length}</strong>{" "}
            {filteredOrphanages.length === 1 ? "orphanage" : "orphanages"} within{" "}
            <strong className="text-[#2563EB] dark:text-blue-400 font-bold">{radius} km</strong>
          </div>
          {userCoords && (
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <FiCheckCircle className="h-3.5 w-3.5" /> Using your current location
            </div>
          )}
        </div>
      </div>

      {/* ── Main Split Content Section (List + Leaflet Map) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Orphanage Cards List ────────────────────── */}
        <div
          className={`lg:col-span-6 xl:col-span-5 space-y-4 max-h-[680px] overflow-y-auto pr-1 custom-scrollbar ${
            mobileTab === "map" ? "hidden lg:block" : "block"
          }`}
        >
          {loading ? (
            // Existing Skeleton Loader
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-2/3"></div>
                  <div className="pt-2 flex gap-2">
                    <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded flex-1"></div>
                    <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded flex-1"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOrphanages.length === 0 ? (
            // Existing Empty State
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-[#2563EB]">
                <FiMapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                  No orphanages found within {radius} km.
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  We couldn't locate child care centers in this search radius. Try expanding your range.
                </p>
              </div>
              {radius < 100 && (
                <button
                  onClick={() => {
                    const steps = [5, 10, 25, 50, 100];
                    const next = steps.find((s) => s > radius) || 100;
                    handleRadiusChange(next);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  Expand Search to {([5, 10, 25, 50, 100].find((s) => s > radius) || 100)} km
                </button>
              )}
            </div>
          ) : (
            // Native Donor Dashboard Cards
            filteredOrphanages.map((item) => {
              const isSelected = selectedOrphanage?.id === item.id;
              const isRegistered = item.source === "registered" || item.source === "DATABASE";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedOrphanage(item)}
                  className={`group relative rounded-2xl border bg-white p-5 shadow-sm transition-all cursor-pointer dark:bg-slate-900 ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/20 dark:border-amber-500 dark:bg-slate-800/90 ring-1 ring-amber-500/50 shadow-md"
                      : "border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 hover:shadow-md"
                  }`}
                >
                  {/* Top Bar Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isRegistered
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                          : "bg-blue-50 text-[#2563EB] border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300"
                      }`}
                    >
                      {isRegistered ? (
                        <>
                          <FiShield className="h-3 w-3" /> Registered
                        </>
                      ) : (
                        "External place"
                      )}
                    </span>

                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/40">
                      {item.distance !== undefined ? `${item.distance} km away` : ""}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white group-hover:text-[#2563EB] transition-colors leading-snug">
                    {item.name}
                  </h3>

                  {/* Address */}
                  {item.address && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 flex items-start gap-1.5 leading-relaxed">
                      <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#2563EB] mt-0.5" />
                      <span>{item.address}{item.city ? `, ${item.city}` : ""}</span>
                    </p>
                  )}

                  {/* Contact Links (Only render if present) */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-600 dark:text-slate-300">
                    {item.phone && (
                      <a
                        href={`tel:${item.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-medium font-mono hover:text-[#2563EB] transition-colors"
                      >
                        <FiPhone className="h-3.5 w-3.5 text-[#2563EB]" />
                        <span>{item.phone}</span>
                      </a>
                    )}

                    {getFormattedWebsiteUrl(item.website) && (
                      <a
                        href={getFormattedWebsiteUrl(item.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-semibold text-[#2563EB] dark:text-blue-400 hover:underline transition-colors"
                      >
                        <FiGlobe className="h-3.5 w-3.5" />
                        <span>Visit Website</span>
                      </a>
                    )}
                  </div>

                  {/* Card Action Buttons (Donate & Directions) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2.5">
                    {/* Directions Button */}
                    <a
                      href={getDirectionsUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 py-2.5 text-xs font-bold text-[#0F172A] dark:text-white transition-all transform active:scale-95"
                    >
                      <FiNavigation className="h-4 w-4 text-[#2563EB]" />
                      <span>Directions</span>
                    </a>

                    {/* Goods Donation Schedule Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setScheduleModalOrphanage(item);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-indigo-700 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/15 transition-all transform active:scale-95"
                    >
                      <FiPackage className="h-4 w-4" />
                      <span>Donate Goods</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right Column: Interactive Leaflet Map Container ────────── */}
        <div
          className={`lg:col-span-6 xl:col-span-7 h-[500px] lg:h-[680px] sticky top-6 rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
            mobileTab === "list" ? "hidden lg:block" : "block"
          }`}
        >
          <NearbyOrphanageMap
            userCoords={userCoords}
            orphanages={filteredOrphanages}
            selectedOrphanage={selectedOrphanage}
            onSelectOrphanage={(item) => setSelectedOrphanage(item)}
          />
        </div>
      </div>

      {/* Physical Goods Donation Schedule Modal */}
      {scheduleModalOrphanage && (
        <DonationScheduleModal
          orphanage={scheduleModalOrphanage}
          onClose={() => setScheduleModalOrphanage(null)}
        />
      )}
    </div>
  );
}
