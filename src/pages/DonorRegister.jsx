import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiHome, FiLock,
  FiEye, FiEyeOff, FiArrowRight, FiShield, FiHeart, FiCheckCircle
} from "react-icons/fi";
import { donorService } from "../services/donorService";

export default function DonorRegister() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      mobileNumber: "",
      address: "",
      city: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordVal = watch("password");

  const onSubmit = async (values) => {
    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await donorService.register({
        fullName: values.fullName,
        email: values.email,
        mobileNumber: values.mobileNumber,
        address: values.address,
        city: values.city,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      // Redirect to login after registration
      navigate("/donor/login", {
        state: { message: "Account created successfully! Please sign in with your credentials." },
      });
    } catch (err) {
      const msg = err.data?.message || err.message || "Registration failed. Please check your information.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#080E1A] text-[#0F172A] dark:text-slate-100 font-sans selection:bg-[#2563EB]/15 selection:text-[#2563EB] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Soft Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none"
      >
        {/* Top Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563EB] to-blue-500 shadow-md shadow-blue-600/30 text-white mb-3">
            <FiHeart className="h-6 w-6" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] font-display">
            Velora Donor Portal
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#0F172A] dark:text-white sm:text-3xl">
            Donor Registration
          </h1>
          <p className="mt-1.5 text-xs text-[#64748B] dark:text-slate-400 max-w-md">
            Join our community of philanthropic partners empowering orphaned and vulnerable children.
          </p>
        </div>

        {/* Feature badge banner */}
        <div className="mb-6 flex items-center justify-center gap-4 rounded-xl bg-blue-50/70 p-3 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          <span className="flex items-center gap-1.5">
            <FiCheckCircle className="h-4 w-4 text-[#2563EB]" /> Instant Activation
          </span>
          <span className="text-blue-300 dark:text-blue-800">•</span>
          <span className="flex items-center gap-1.5">
            <FiShield className="h-4 w-4 text-[#2563EB]" /> 100% Direct Impact
          </span>
        </div>

        {/* Form Error Alert */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
              Full Name *
            </label>
            <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800">
              <FiUser className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Enter your full name"
                className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white"
                {...register("fullName", { required: "Full name is required" })}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          {/* Email & Mobile Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                Email Address *
              </label>
              <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800">
                <FiMail className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="email"
                  placeholder="donor@example.com"
                  className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
                  })}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                Mobile Number *
              </label>
              <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800">
                <FiPhone className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white"
                  {...register("mobileNumber", { required: "Mobile number is required" })}
                />
              </div>
              {errors.mobileNumber && <p className="mt-1 text-xs text-red-500">{errors.mobileNumber.message}</p>}
            </div>
          </div>

          {/* Address & City Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Address */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                Street Address *
              </label>
              <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800">
                <FiMapPin className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Flat / Building / Street"
                  className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white"
                  {...register("address", { required: "Address is required" })}
                />
              </div>
              {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
            </div>

            {/* City */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                City *
              </label>
              <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800">
                <FiHome className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Delhi, Bengaluru"
                  className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white"
                  {...register("city", { required: "City is required" })}
                />
              </div>
              {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
            </div>
          </div>

          {/* Password & Confirm Password Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Password */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                Password *
              </label>
              <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800">
                <FiLock className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Minimum 6 characters" },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="ml-2 text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
                Confirm Password *
              </label>
              <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800">
                <FiLock className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => value === passwordVal || "Passwords do not match",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="ml-2 text-slate-400 transition hover:text-slate-600"
                >
                  {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.005, y: -1 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 font-display mt-4"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Complete Registration</span>
                <FiArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Existing account link */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered as a Donor?{" "}
          <Link to="/donor/login" className="font-semibold text-[#2563EB] hover:underline">
            Sign In to Donor Portal
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <FiShield className="h-3.5 w-3.5" />
          Protected by Velora Security • Encrypted Donor Privacy
        </div>
      </motion.div>
    </main>
  );
}
