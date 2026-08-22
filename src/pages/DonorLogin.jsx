import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiHeart
} from "react-icons/fi";
import { donorService } from "../services/donorService";

const USER_STORAGE_KEY = "child_safety_user";
const TOKEN_STORAGE_KEY = "child_safety_token";
const REFRESH_TOKEN_KEY = "child_safety_refresh_token";

export default function DonorLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const initialMsg = location.state?.message || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    setError("");
    setLoading(true);
    try {
      const response = await donorService.login({
        email: values.email,
        password: values.password,
      });

      const { user, tokens } = response;
      const serializedUser = JSON.stringify(user);
      const accessToken = tokens?.accessToken || tokens;
      const refreshToken = tokens?.refreshToken || "";

      localStorage.setItem(USER_STORAGE_KEY, serializedUser);
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

      sessionStorage.setItem(USER_STORAGE_KEY, serializedUser);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

      // Force refresh auth or navigate to /donor
      window.location.href = "/donor";
    } catch (err) {
      const msg = err.data?.message || err.message || "Invalid donor login credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#080E1A] text-[#0F172A] dark:text-slate-100 font-sans selection:bg-[#2563EB]/15 selection:text-[#2563EB] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Soft Gradient Background Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none"
      >
        {/* Top Emblem & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563EB] to-blue-500 shadow-md shadow-blue-600/30 text-white mb-3">
            <FiHeart className="h-6 w-6" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] font-display">
            Velora Donor Portal
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#0F172A] dark:text-white">
            Donor Sign In
          </h1>
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
            Access your philanthropy dashboard & support active child causes
          </p>
        </div>

        {/* Success Alert Message from registration */}
        {initialMsg && !error && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            {initialMsg}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
              Email Address
            </label>
            <div className="flex h-[48px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800">
              <FiMail className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="email"
                placeholder="donor@example.com"
                className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white"
                {...register("email", { required: "Email is required" })}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
              Password
            </label>
            <div className="flex h-[48px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800">
              <FiLock className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white"
                {...register("password", { required: "Password is required" })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="ml-2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Sign In Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.005, y: -1 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 font-display mt-2"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Sign In as Donor</span>
                <FiArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center text-xs text-slate-500">
          New Donor?{" "}
          <Link to="/donor/register" className="font-semibold text-[#2563EB] underline hover:text-blue-700">
            Create a Donor Account
          </Link>
        </div>

        {/* Back to main login link */}
        <div className="mt-2 text-center text-xs">
          <Link to="/login" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ← Back to System Login
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-3 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <FiShield className="h-3.5 w-3.5" />
          Protected by Velora Security • 256-bit SSL Encryption
        </div>
      </motion.div>
    </main>
  );
}
