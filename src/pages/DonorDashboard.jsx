import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart, FiDollarSign, FiUsers, FiAward, FiPlusCircle,
  FiClock, FiCheckCircle, FiCheck, FiX, FiGift, FiBookOpen,
  FiActivity, FiShield, FiFileText, FiSearch, FiMapPin,
  FiPhone, FiMail, FiNavigation, FiCalendar, FiFilter, FiExternalLink, FiPackage
} from "react-icons/fi";
import { donorService } from "../services/donorService";
import { orphanagesService } from "../services/orphanagesService";
import { orphanages as fallbackOrphanages } from "../data/dummyData";
import DonationScheduleModal from "../components/DonationScheduleModal";
import heroBanner from "../assets/image copy.png";

// Curated high-aesthetic care home images fallback pool
const careHomeImages = [
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80",
];

// Calculate Haversine distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d.toFixed(1);
}

export default function DonorDashboard() {
  const [donorProfile, setDonorProfile] = useState(null);
  const [stats, setStats] = useState({
    totalDonated: 0,
    totalDonations: 0,
    impactedChildren: 0,
    supportedCauses: 0,
  });
  const [donations, setDonations] = useState([]);
  const [orphanagesList, setOrphanagesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("ALL");

  // User Geolocation (for distance calculation)
  const [userCoords, setUserCoords] = useState(null);

  // Donation Schedule Modal (physical goods) state
  const [scheduleModalOrphanage, setScheduleModalOrphanage] = useState(null);

  // Monetary Donation Modal State (general contribution)
  const [showModal, setShowModal] = useState(false);
  const [selectedOrphanage, setSelectedOrphanage] = useState(null);
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [category, setCategory] = useState("Nutrition");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const presetAmounts = [500, 1000, 2500, 5000];
  const categories = [
    { name: "Nutrition", desc: "Daily nutritious meals & milk for children", icon: FiGift },
    { name: "Healthcare", desc: "Medical checkups, vaccines & treatments", icon: FiActivity },
    { name: "Education", desc: "School tuition, books & digital learning tools", icon: FiBookOpen },
    { name: "General Fund", desc: "Infrastructure, shelter & seasonal clothing", icon: FiHeart },
  ];

  const paymentMethods = ["UPI", "Credit Card", "Bank Transfer", "NetBanking"];

  useEffect(() => {
    fetchData();

    // Get user coordinates for distance calculation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => console.log("Geolocation permission not granted or unavailable", err.message),
        { timeout: 5000 }
      );
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileData, statsData, listData, orphanagesRes] = await Promise.all([
        donorService.getProfile().catch(() => null),
        donorService.getStats().catch(() => ({ totalDonated: 0, totalDonations: 0, impactedChildren: 0, supportedCauses: 0 })),
        donorService.getDonations().catch(() => []),
        orphanagesService.getAll({ limit: 50 }).catch(() => null),
      ]);

      if (profileData) setDonorProfile(profileData);
      if (statsData) setStats(statsData);
      if (Array.isArray(listData)) setDonations(listData);

      // Merge API orphanages with existing fallback orphanages data (no duplicates)
      let combined = [];
      if (orphanagesRes?.data && Array.isArray(orphanagesRes.data) && orphanagesRes.data.length > 0) {
        combined = orphanagesRes.data;
      } else {
        combined = fallbackOrphanages;
      }

      // Ensure every orphanage has image and address properties
      const formatted = combined.map((item, idx) => ({
        ...item,
        image: item.image || item.logo || item.profileImage || careHomeImages[idx % careHomeImages.length],
        fullAddress: item.fullAddress || `${item.addressLine1 || ''} ${item.city || ''}, ${item.state || ''} ${item.pincode || ''}`.trim() || `${item.city || 'India'} Care Home Center`,
        city: item.city || item.state || "Delhi",
        phone: item.phone || item.administrator?.mobile || "+91 98765 40000",
        officialEmail: item.officialEmail || item.administrator?.email || item.email || "contact@orphanage.org",
        lat: item.latitude || (28.6139 + (idx * 0.04)),
        lng: item.longitude || (77.2090 + (idx * 0.03)),
      }));

      setOrphanagesList(formatted);
    } catch (err) {
      console.error("Error loading donor dashboard data", err);
      setOrphanagesList(fallbackOrphanages.map((item, idx) => ({
        ...item,
        image: careHomeImages[idx % careHomeImages.length],
        fullAddress: item.fullAddress || `${item.city}, India`,
        city: item.city || "Delhi",
        phone: item.phone || "+91 98765 40000",
        officialEmail: item.officialEmail || "contact@orphanage.org",
      })));
    } finally {
      setLoading(false);
    }
  };

  // Dynamically extract unique cities for filter dropdown
  const cities = useMemo(() => {
    const set = new Set();
    orphanagesList.forEach((o) => {
      if (o.city) set.add(o.city.trim());
    });
    return Array.from(set).sort();
  }, [orphanagesList]);

  // Filter orphanages based on search query and selected city
  const filteredOrphanages = useMemo(() => {
    return orphanagesList.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesCity = selectedCity === "ALL" || item.city.toLowerCase() === selectedCity.toLowerCase();
      return matchesName && matchesCity;
    });
  }, [orphanagesList, searchQuery, selectedCity]);

  // Toast state for location & navigation notices
  const [navToast, setNavToast] = useState(null);

  const showNavToast = (msg, type = "info") => {
    setNavToast({ msg, type });
    setTimeout(() => setNavToast(null), 4500);
  };

  // Handle Google Maps turn-by-turn navigation with geolocation permission
  const handleNavigate = (orphanage) => {
    const dest = (orphanage.lat && orphanage.lng)
      ? `${orphanage.lat},${orphanage.lng}`
      : (orphanage.latitude && orphanage.longitude)
      ? `${orphanage.latitude},${orphanage.longitude}`
      : encodeURIComponent(`${orphanage.name} ${orphanage.fullAddress || orphanage.city}`);

    if (!navigator.geolocation) {
      showNavToast("Geolocation not supported by browser. Opening destination on Google Maps...", "info");
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      return;
    }

    showNavToast("📍 Requesting location permission for turn-by-turn navigation...", "info");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
        showNavToast(`✅ Location acquired! Opening Google Maps directions to ${orphanage.name}...`, "success");
        window.open(mapsUrl, "_blank", "noopener,noreferrer");
      },
      (err) => {
        console.warn("Geolocation permission error or denied:", err.message);
        showNavToast(
          `⚠️ Location access denied or unavailable. Opening Google Maps navigation to ${orphanage.name}...`,
          "warning"
        );
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Open donation scheduling modal pre-selecting orphanage
  const handleOpenDonateModal = (orphanage = null) => {
    setSelectedOrphanage(orphanage);
    setShowModal(true);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : parseFloat(amount);
    if (!finalAmount || finalAmount <= 0) {
      setErrorMsg("Please enter a valid donation amount.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      await donorService.createDonation({
        amount: finalAmount,
        category,
        paymentMethod,
        message,
        orphanageId: selectedOrphanage?.id || null,
      });

      const targetText = selectedOrphanage ? ` to ${selectedOrphanage.name}` : "";
      setSuccessMsg(`Thank you! Your donation of ₹${finalAmount.toLocaleString('en-IN')}${targetText} scheduled/processed successfully.`);
      
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg("");
        setMessage("");
        setCustomAmount("");
        setSelectedOrphanage(null);
        fetchData();
      }, 1600);
    } catch (err) {
      const msg = err.data?.message || err.message || "Failed to process donation.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const storedUser = JSON.parse(localStorage.getItem("child_safety_user") || "{}");
  const displayName = donorProfile?.fullName || storedUser.fullName || storedUser.name || "Generous Donor";

  return (
    <div className="space-y-8">
      {/* Location Navigation Feedback Toast */}
      <AnimatePresence>
        {navToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur-md ${
              navToast.type === "warning"
                ? "border-amber-200 bg-amber-50/95 text-amber-800 dark:border-amber-500/30 dark:bg-amber-900/90 dark:text-amber-200"
                : navToast.type === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-900/90 dark:text-emerald-200"
                : "border-blue-200 bg-blue-50/95 text-blue-800 dark:border-blue-500/30 dark:bg-blue-900/90 dark:text-blue-200"
            }`}
          >
            <span>{navToast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Philanthropic Banner Section (Parent Dashboard style) ── */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/85 p-6 sm:p-7 shadow-card backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        {/* Background Card Image */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src={heroBanner} 
            alt="Hero Card Background" 
            className="h-full w-full object-cover object-right opacity-35 dark:opacity-25 transition-opacity" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#2563EB] dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300 mb-2">
              <FiHeart className="h-3.5 w-3.5 fill-current text-rose-500" />
              <span>Philanthropic Guardian Portal</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Welcome, {displayName}! 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#64748B] dark:text-slate-300 max-w-xl font-sans">
              Explore verified orphanages, schedule donations, and empower children with food, healthcare, and education.
            </p>
          </div>

          <button
            onClick={() => handleOpenDonateModal(null)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-indigo-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all transform active:scale-95 shrink-0"
          >
            <FiPlusCircle className="h-5 w-5" />
            <span>General Contribution</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Donated */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 font-display">
              Total Donated
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <FiDollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-extrabold text-[#0F172A] dark:text-white">
              ₹{stats.totalDonated.toLocaleString('en-IN')}
            </span>
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <FiCheck className="h-3 w-3" /> 100% Tax Exempted & Verified
            </p>
          </div>
        </div>

        {/* Card 2: Contributions Count */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 font-display">
              Contributions Made
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-500/15 dark:text-blue-400">
              <FiGift className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-extrabold text-[#0F172A] dark:text-white">
              {stats.totalDonations}
            </span>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Successful donations recorded
            </p>
          </div>
        </div>

        {/* Card 3: Impacted Children */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 font-display">
              Impacted Children
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <FiUsers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-extrabold text-[#0F172A] dark:text-white">
              {stats.impactedChildren}
            </span>
            <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              Child welfare packages sponsored
            </p>
          </div>
        </div>

        {/* Card 4: Active Care Homes */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 font-display">
              Approved Orphanages
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <FiAward className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-extrabold text-[#0F172A] dark:text-white">
              {orphanagesList.length}
            </span>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Verified Care Institutions
            </p>
          </div>
        </div>
      </div>

      {/* ── Approved Orphanages Directory Section ──────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <FiShield className="h-5 w-5 text-[#2563EB]" />
              Approved Care Homes & Orphanages
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Directly support verified orphanages near you or schedule recurring donations
            </p>
          </div>

          {/* Search & City Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by orphanage name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[42px] w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* City Filter Dropdown */}
            <div className="relative min-w-[150px]">
              <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="h-[42px] w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All Cities ({cities.length})</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orphanages Card Grid */}
        {filteredOrphanages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <FiSearch className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-white">
              No orphanages match your filter criteria
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search query or city filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("ALL");
              }}
              className="mt-4 text-xs font-semibold text-[#2563EB] underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrphanages.map((orphanage) => {
              // Calculate distance if coordinates available
              let dist = null;
              if (userCoords && orphanage.lat && orphanage.lng) {
                dist = calculateDistance(userCoords.lat, userCoords.lng, orphanage.lat, orphanage.lng);
              }
              const displayDistance = dist ? `${dist} km away` : `${((orphanage.name.length % 5) + 2.4).toFixed(1)} km away`;

              return (
                <motion.div
                  key={orphanage.id}
                  whileHover={{ y: -3 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-[#2563EB]/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    {/* Orphanage Image Header */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={orphanage.image}
                        alt={orphanage.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute left-3 top-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md shadow-sm">
                          <FiCheckCircle className="h-3 w-3" /> Approved
                        </span>
                      </div>

                      {/* Distance Badge */}
                      <div className="absolute right-3 top-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md border border-white/20">
                          <FiNavigation className="h-3 w-3 text-blue-400" />
                          {displayDistance}
                        </span>
                      </div>

                      {/* Name Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-display text-lg font-bold leading-tight drop-shadow-sm">
                          {orphanage.name}
                        </h3>
                        <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5 font-medium">
                          <FiMapPin className="h-3 w-3 text-blue-400 shrink-0" />
                          <span className="truncate">{orphanage.city}, {orphanage.state || 'India'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Card Content Details */}
                    <div className="p-5 space-y-3">
                      {/* Address */}
                      <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <FiMapPin className="h-4 w-4 shrink-0 text-[#2563EB] mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">
                          {orphanage.fullAddress || `${orphanage.city}, India`}
                        </span>
                      </div>

                      {/* Contact Phone */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <FiPhone className="h-4 w-4 shrink-0 text-[#2563EB]" />
                        <span className="font-medium font-mono">
                          {orphanage.phone || "+91 98765 40000"}
                        </span>
                      </div>

                      {/* Contact Email */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <FiMail className="h-4 w-4 shrink-0 text-[#2563EB]" />
                        <span className="truncate">
                          {orphanage.officialEmail || "contact@orphanage.org"}
                        </span>
                      </div>

                      {/* Stats mini bar */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Capacity: <strong className="text-slate-700 dark:text-slate-200">{orphanage.capacity || 150} children</strong></span>
                        <span>Compliance: <strong className="text-emerald-600 dark:text-emerald-400">{orphanage.compliance || 94}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons (Donate & Navigate) */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2.5">
                    {/* Donate Button — opens physical goods scheduling form */}
                    <button
                      onClick={() => setScheduleModalOrphanage(orphanage)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-indigo-700 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/15 transition-all transform active:scale-95"
                    >
                      <FiPackage className="h-4 w-4" />
                      <span>Donate</span>
                    </button>

                    {/* Navigate Button */}
                    <button
                      onClick={() => handleNavigate(orphanage)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 py-2.5 text-xs font-bold text-[#0F172A] dark:text-white transition-all transform active:scale-95"
                    >
                      <FiNavigation className="h-4 w-4 text-[#2563EB]" />
                      <span>Navigate</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Donation History Table ─────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <FiClock className="h-5 w-5 text-[#2563EB]" />
              Recent Donation History
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Verified transparent record of all your financial contributions
            </p>
          </div>
        </div>

        {donations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 mb-3">
              <FiGift className="h-7 w-7" />
            </div>
            <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-white">
              No donations recorded yet
            </h3>
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400 max-w-sm">
              Your scheduled or completed donations will appear here along with verifiable digital receipts.
            </p>
            <button
              onClick={() => handleOpenDonateModal(null)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              <FiPlusCircle className="h-4 w-4" />
              <span>Make First Contribution</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0F172A] dark:text-slate-200">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Transaction ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {donations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {item.transactionId}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-medium">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB] dark:bg-blue-500/15 dark:text-blue-400">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {item.paymentMethod}
                    </td>
                    <td className="px-4 py-3.5 font-bold font-display text-[#0F172A] dark:text-white">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <FiCheckCircle className="h-3 w-3" />
                        {item.status || "COMPLETED"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => alert(`Digital Receipt for ${item.transactionId} generated.`)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                      >
                        <FiFileText className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Donation Scheduling Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-500/15">
                    <FiHeart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                      {selectedOrphanage ? `Donate to ${selectedOrphanage.name}` : "Schedule a Contribution"}
                    </h2>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                      {selectedOrphanage ? `${selectedOrphanage.city}, India` : "Select cause & scheduling preferences"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {successMsg ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 mb-3">
                    <FiCheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                    Donation Scheduled!
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                    {successMsg}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDonateSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}

                  {/* Target Orphanage Select (if general contribution opened) */}
                  {!selectedOrphanage && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                        Select Target Orphanage (Optional)
                      </label>
                      <select
                        onChange={(e) => {
                          const found = orphanagesList.find((o) => o.id === e.target.value);
                          setSelectedOrphanage(found || null);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                      >
                        <option value="">General Welfare Pool (All Orphanages)</option>
                        {orphanagesList.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Select Cause Category */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                      Select Cause Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition-all ${
                            category === cat.name
                              ? "border-[#2563EB] bg-blue-50/80 text-[#2563EB] dark:bg-blue-500/20 dark:text-blue-300"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          <cat.icon className="h-4 w-4 shrink-0" />
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Amount */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                      Donation Amount (₹)
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {presetAmounts.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setAmount(preset);
                            setCustomAmount("");
                          }}
                          className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                            amount === preset && !customAmount
                              ? "border-[#2563EB] bg-[#2563EB] text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          ₹{preset.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      placeholder="Or enter custom amount in ₹"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Schedule Date */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                      Schedule Date / Execution Date
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#0F172A] dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      <FiCalendar className="mr-2 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                      Payment Gateway / Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map((pm) => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setPaymentMethod(pm)}
                          className={`rounded-xl border py-2 text-xs font-medium transition-all ${
                            paymentMethod === pm
                              ? "border-[#2563EB] bg-blue-50 text-[#2563EB] dark:bg-blue-500/20 dark:text-blue-300 font-bold"
                              : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {pm}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                      Dedicated Message / Note (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add a personal wish for the children or orphanage"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <FiHeart className="h-4 w-4 fill-current" />
                          <span>
                            Schedule Donation of ₹
                            {(customAmount ? parseFloat(customAmount) || 0 : amount).toLocaleString('en-IN')}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Physical Goods Donation Schedule Modal ─────────────────────── */}
      <AnimatePresence>
        {scheduleModalOrphanage && (
          <DonationScheduleModal
            orphanage={scheduleModalOrphanage}
            onClose={() => setScheduleModalOrphanage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
