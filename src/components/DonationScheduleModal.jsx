import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX, FiHeart, FiCheckCircle, FiPackage, FiCalendar, FiClock,
  FiMessageSquare, FiHash
} from "react-icons/fi";
import { donationRequestsService } from "../services/donationRequestsService";

const DONATION_TYPES = [
  { name: "Food", emoji: "🍱", color: "amber" },
  { name: "Clothes", emoji: "👕", color: "blue" },
  { name: "Books", emoji: "📚", color: "indigo" },
  { name: "School Supplies", emoji: "✏️", color: "purple" },
  { name: "Toys", emoji: "🧸", color: "pink" },
  { name: "Medicine", emoji: "💊", color: "red" },
  { name: "Furniture", emoji: "🪑", color: "orange" },
  { name: "Other", emoji: "📦", color: "slate" },
];

const colorMap = {
  amber:  { pill: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300", active: "bg-amber-500 border-amber-500 text-white" },
  blue:   { pill: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-300", active: "bg-blue-500 border-blue-500 text-white" },
  indigo: { pill: "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300", active: "bg-indigo-500 border-indigo-500 text-white" },
  purple: { pill: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-300", active: "bg-purple-500 border-purple-500 text-white" },
  pink:   { pill: "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-500/10 dark:border-pink-500/30 dark:text-pink-300", active: "bg-pink-500 border-pink-500 text-white" },
  red:    { pill: "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300", active: "bg-red-500 border-red-500 text-white" },
  orange: { pill: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-300", active: "bg-orange-500 border-orange-500 text-white" },
  slate:  { pill: "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-500/10 dark:border-slate-500/30 dark:text-slate-300", active: "bg-slate-600 border-slate-600 text-white" },
};

export default function DonationScheduleModal({ orphanage, onClose }) {
  const [donationType, setDonationType] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [preferredTime, setPreferredTime] = useState("10:00");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const formatTimeDisplay = (t) => {
    if (!t) return "";
    const [hh, mm] = t.split(":");
    const h = parseInt(hh, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${mm} ${ampm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!donationType) { setErrorMsg("Please select a donation type."); return; }
    if (!quantity || quantity < 1) { setErrorMsg("Quantity must be at least 1."); return; }
    if (!preferredDate) { setErrorMsg("Please select a preferred date."); return; }
    if (!preferredTime) { setErrorMsg("Please select a preferred time."); return; }
    if (!orphanage?.id) { setErrorMsg("No orphanage selected. Please try again."); return; }

    setErrorMsg("");
    setSubmitting(true);

    try {
      await donationRequestsService.create({
        orphanageId: orphanage.id,
        donationType,
        quantity: parseInt(quantity, 10),
        preferredDate: new Date(preferredDate).toISOString(),
        preferredTime: formatTimeDisplay(preferredTime),
        message: message.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "Failed to submit donation request. Please try again.";
      setErrorMsg(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-indigo-600 shadow-md shadow-blue-600/25">
              <FiPackage className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A] dark:text-white leading-tight">
                Schedule a Donation
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                {orphanage?.name} • {orphanage?.city}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 mb-4">
              <FiCheckCircle className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
              Donation Request Submitted!
            </h3>
            <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400 max-w-xs">
              Your donation schedule for <strong>{orphanage?.name}</strong> has been sent.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Status: Pending — awaiting orphanage confirmation
            </div>
            <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              You can track the status in <strong>My Requests</strong> from the sidebar.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Donation Type Grid */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#0F172A] dark:text-slate-200 font-display uppercase tracking-wide">
                Donation Type *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DONATION_TYPES.map((type) => {
                  const isActive = donationType === type.name;
                  const cls = colorMap[type.color];
                  return (
                    <button
                      key={type.name}
                      type="button"
                      onClick={() => { setDonationType(type.name); setErrorMsg(""); }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center transition-all duration-150 ${
                        isActive ? cls.active : cls.pill
                      } hover:scale-105 active:scale-95`}
                    >
                      <span className="text-xl leading-none">{type.emoji}</span>
                      <span className="text-[10px] font-semibold leading-tight">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0F172A] dark:text-slate-200 font-display uppercase tracking-wide">
                Quantity *
              </label>
              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800 transition-all">
                <FiHash className="mr-2.5 h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Number of items"
                  className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-slate-400 dark:text-white"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                E.g. 50 books, 30 kg food, 20 sets of clothes
              </p>
            </div>

            {/* Date + Time Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Preferred Date */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0F172A] dark:text-slate-200 font-display uppercase tracking-wide">
                  Preferred Date *
                </label>
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800 transition-all">
                  <FiCalendar className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={preferredDate}
                    min={today}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full bg-transparent text-sm text-[#0F172A] outline-none dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Preferred Time */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0F172A] dark:text-slate-200 font-display uppercase tracking-wide">
                  Preferred Time *
                </label>
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800 transition-all">
                  <FiClock className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-transparent text-sm text-[#0F172A] outline-none dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0F172A] dark:text-slate-200 font-display uppercase tracking-wide">
                Short Message{" "}
                <span className="text-slate-400 font-normal normal-case">(Optional)</span>
              </label>
              <div className="rounded-xl border border-slate-200 bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800 transition-all">
                <div className="flex items-start gap-2 px-3.5 pt-3">
                  <FiMessageSquare className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Any special instructions or a message for the orphanage..."
                    className="w-full resize-none bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-slate-400 dark:text-white pb-3"
                    maxLength={500}
                  />
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 text-right">{message.length}/500</p>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-indigo-600 hover:from-[#1D4ED8] hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <FiHeart className="h-4 w-4 fill-current" />
                    <span>Submit Donation Request</span>
                  </>
                )}
              </button>
              <p className="mt-2.5 text-center text-[11px] text-slate-400">
                Your request will be sent to the orphanage. Status starts as <strong>Pending</strong>.
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
