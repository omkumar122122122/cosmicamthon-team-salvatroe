import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield, FiUserCheck, FiUsers, FiUser, FiMail, FiLock,
  FiEye, FiEyeOff, FiArrowRight, FiFileText, FiGlobe, FiLock as FiLockIcon,
  FiCheckCircle, FiCpu
} from "react-icons/fi";
import ThemeToggle from "../components/ThemeToggle";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../utils/constants";
import { parentsService } from "../services/parentsService";

/* ─── Role Configuration (Administrator, Orphanage Staff, Parent) ─── */
const roleConfig = {
  admin:     { label: "Administrator", icon: FiShield },
  orphanage: { label: "Orphanage Staff", icon: FiUsers },
  parent:    { label: "Parent", icon: FiUser },
};

/* ─── 4 Feature Cards (Exact text & icons from Image 2) ─── */
const featureCards = [
  {
    title: "Secure Access",
    desc: "Role-based authentication and advanced encryption",
    icon: FiShield,
  },
  {
    title: "AI Verification",
    desc: "Intelligent verification and risk detection",
    icon: FiCpu,
  },
  {
    title: "Trusted Records",
    desc: "Tamper-proof digital records and audit logs",
    icon: FiFileText,
  },
  {
    title: "Enterprise Security",
    desc: "End-to-end security and compliance",
    icon: FiCheckCircle,
  },
];

/* ─── Main Login Page Component ─────────────────────── */
export default function Login() {
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError]               = useState("");
  const [authMode, setAuthMode]         = useState("login");
  const [selectedRole, setSelectedRole] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { register, handleSubmit, formState } = useForm({
    defaultValues: { email: "", password: "" },
  });
  const signupForm = useForm({ defaultValues: { hasAnotherChild: "no", otherChildStatus: "own" } });

  if (user) return <Navigate to={roleHome[user.role]} replace />;

  const onSubmit = async (values) => {
    if (!selectedRole) { setError("Please select your role to continue."); return; }
    setError("");
    try {
      const loggedInUser = await login({ ...values, role: selectedRole });
      navigate(roleHome[loggedInUser.role], { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const onSignupSubmit = async (values) => {
    setSignupLoading(true);
    setError("");
    try {
      const requestData = {
        firstName: values.firstName || "Parent",
        lastName: values.lastName || "",
        email: values.email,
        phone: values.phone || "",
        password: values.password || "TempPassword123!",
        relationship: "Parent",
        occupation: values.occupation || "",
        adoptionMotivation: values.adoptionReason || "",
      };
      await parentsService.registerParent(requestData);
      setSignupSuccess("Application submitted for admin verification.");
      signupForm.reset({ hasAnotherChild: "no", otherChildStatus: "own" });
    } catch (err) {
      const errorMsg = err?.data?.message || err.message || "Registration failed. Please try again.";
      setError(errorMsg);
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#080E1A] text-[#0F172A] dark:text-slate-100 font-sans selection:bg-[#2563EB]/15 selection:text-[#2563EB]">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">

        {/* ════════════════════════════════════════════════════════════
           LEFT PANEL — 50% Desktop Split Screen
           (Crisp light background with faint architectural glass lines,
            matching Image 2 pixel-for-pixel)
        ════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 p-12 xl:p-16 border-r border-slate-200/60 dark:border-slate-800"
        >
          {/* 4K Glass Architecture Facade Render Background Overlay */}
          <div 
            className="pointer-events-none absolute inset-0 bg-right bg-cover bg-no-repeat opacity-[0.22] dark:opacity-[0.15] mix-blend-multiply dark:mix-blend-screen"
            style={{ 
              backgroundImage: "url('/velora_bg.png')",
              maskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)"
            }} 
          />
          
          {/* Soft background blue glow gradient */}
          <div className="pointer-events-none absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-[#2563EB]/8 blur-[140px]" />

          {/* Top Left Header (Velora Logo & Tagline) */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              {/* Velora Geometric V-Shield Emblem */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] shadow-md shadow-blue-600/20 text-white">
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 15 10-15-10-5zm0 3.8L18.4 8 12 17.6 5.6 8 12 5.8z" />
                </svg>
              </div>
              <div>
                <span className="font-display text-xl font-extrabold tracking-wider text-[#0F172A] dark:text-white">
                  VELORA
                </span>
                <p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">
                  AI Powered Child Safety Management System
                </p>
              </div>
            </div>
          </div>

          {/* Center Content Section */}
          <div className="relative z-10 my-auto py-6">
            
            {/* Main Headline (3 Lines as shown in Image 2) */}
            <h1 className="max-w-xl font-display text-3xl lg:text-[2.5rem] xl:text-[2.75rem] font-extrabold leading-[1.16] tracking-tight text-[#0F172A] dark:text-white">
              Protecting Every Child <br />
              Through Secure &amp; <br />
              <span className="text-[#2563EB]">Intelligent Technology</span>
            </h1>

            {/* Short Blue Accent Line */}
            <div className="my-5 h-1 w-9 rounded-full bg-[#2563EB]" />

            {/* Paragraph Subtitle */}
            <p className="max-w-[420px] text-sm leading-relaxed text-[#64748B] dark:text-slate-400 font-normal">
              Velora combines advanced AI, secure infrastructure and real-time monitoring to ensure every child's safety and well-being.
            </p>

            {/* 2x2 Feature Cards Grid (Exact matching Image 2 styling & hover) */}
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-[480px]">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    whileHover={{ y: -2 }}
                    className="flex items-start gap-3.5 rounded-[16px] border border-slate-200/70 bg-[#F1F5F9]/60 p-4 transition-all duration-200 hover:border-[#2563EB]/40 hover:bg-[#EFF6FF] hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB] dark:bg-blue-500/20 dark:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xs font-bold text-[#0F172A] dark:text-white">
                        {card.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] leading-tight text-[#64748B] dark:text-slate-400 font-sans">
                        {card.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bottom Security Footer Tags with separators */}
          <div className="relative z-10 border-t border-slate-200/80 dark:border-slate-800 pt-5 text-xs text-[#64748B] dark:text-slate-400 max-w-[480px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <FiLockIcon className="h-3.5 w-3.5 text-[#64748B]" /> DPDP Act Compliant
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1.5 font-medium">
                <FiShield className="h-3.5 w-3.5 text-[#64748B]" /> Government Standard
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1.5 font-medium">
                <FiGlobe className="h-3.5 w-3.5 text-[#64748B]" /> 256-bit SSL Encrypted
              </span>
            </div>
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════════════════════
           RIGHT PANEL — 50% Desktop Floating Card
           (Matches Image 2 Floating Card Layout & Proportions)
        ════════════════════════════════════════════════════════════ */}
        <section className="flex flex-1 items-center justify-center bg-[#F8FAFC] dark:bg-[#080E1A] p-4 sm:p-8 lg:p-12 lg:w-1/2 min-h-screen">
          
          {/* Floating Authentication Card: 470px max-width, pure white, 24px radius, soft ambient shadow */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[470px] rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.06)] dark:shadow-none"
          >
            {/* Header: Left Pill Badge + Right Floating Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] dark:bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#2563EB] dark:text-blue-400 font-display">
                <FiLockIcon className="h-3 w-3" /> SECURE PORTAL
              </div>
              <ThemeToggle />
            </div>

            {/* Title & Subtitle */}
            <div className="mt-4 mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                {authMode === "login" ? "Welcome Back" : "Parent Registration"}
              </h2>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400 font-sans">
                {authMode === "login"
                  ? "Sign in to continue to Velora."
                  : "Fill in your details to apply for parent access."}
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {authMode === "login" ? (
                  <LoginForm
                    register={register}
                    handleSubmit={handleSubmit}
                    formState={formState}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    error={error}
                    loading={loading}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    rememberMe={rememberMe}
                    setRememberMe={setRememberMe}
                    onSignup={() => setAuthMode("signup")}
                    onSubmit={onSubmit}
                  />
                ) : (
                  <ParentSignupForm
                    form={signupForm}
                    onSubmit={onSignupSubmit}
                    success={signupSuccess}
                    loading={signupLoading}
                    onBack={() => setAuthMode("login")}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </section>

      </div>
    </main>
  );
}

/* ════════════════════════════════════════════════════════════
   LOGIN FORM COMPONENT
════════════════════════════════════════════════════════════ */
function LoginForm({
  register, handleSubmit, formState, selectedRole, setSelectedRole,
  error, loading, showPassword, setShowPassword, rememberMe, setRememberMe, onSignup, onSubmit,
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">

      {/* Role Selection Segment (3 equal buttons matching Image 2) */}
      <div>
        <label className="mb-2.5 block text-xs font-semibold text-[#64748B] dark:text-slate-400 font-display">
          Select your role
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {Object.entries(roleConfig).map(([roleKey, cfg]) => {
            const Icon = cfg.icon;
            const isSelected = selectedRole === roleKey;
            return (
              <motion.button
                key={roleKey}
                type="button"
                whileHover={{ y: -1 }}
                onClick={() => setSelectedRole(roleKey)}
                className={
                  "flex flex-col items-center gap-2 rounded-xl p-3.5 text-center transition-all duration-150 font-display text-xs font-medium focus:outline-none " +
                  (isSelected
                    ? "border-2 border-[#2563EB] bg-[#EFF6FF] dark:bg-blue-500/10 text-[#2563EB] dark:text-blue-400 font-semibold shadow-sm"
                    : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-[#64748B] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")
                }
                aria-pressed={isSelected}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="truncate w-full">{cfg.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* "or" divider matching Image 2 */}
      <div className="flex items-center gap-3 my-4 text-xs text-slate-400 before:h-px before:flex-1 before:bg-slate-200 dark:before:bg-slate-800 after:h-px after:flex-1 after:bg-slate-200 dark:after:bg-slate-800">
        or
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Email Address Input */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
            Email address
          </label>
          <div className="flex h-[50px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800/90 dark:focus-within:border-[#2563EB]">
            <FiMail className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="email"
              className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 font-sans"
              placeholder="you@example.com"
              {...register("email", { required: "Email is required" })}
            />
          </div>
          {formState.errors.email && (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
              {formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display">
            Password
          </label>
          <div className="flex h-[50px] items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-700 dark:bg-slate-800/90 dark:focus-within:border-[#2563EB]">
            <FiLock className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              className="h-full w-full bg-transparent text-sm outline-none text-[#0F172A] placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 font-sans"
              placeholder="Enter your password"
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="ml-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
          {formState.errors.password && (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
              {formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/20 accent-[#2563EB]"
            />
            Remember me
          </label>
          <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-[#2563EB] hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Sign In Button (52px Height, Gradient #2563EB to #1D4ED8 with Arrow) */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.005, y: -1 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading || !selectedRole}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white font-semibold text-sm shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-50 font-display mt-2"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>Sign In</span>
              <FiArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>

        {/* Bottom Hyperlink: Apply for registration */}
        <div className="pt-2 text-center flex flex-col gap-1.5 items-center">
          <button
            type="button"
            onClick={onSignup}
            className="text-xs font-medium text-slate-500 hover:text-[#2563EB] transition-colors"
          >
            New adoptive parent? <span className="font-semibold text-[#2563EB] underline">Apply for registration</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/donor/login')}
            className="text-xs font-medium text-slate-500 hover:text-[#2563EB] transition-colors flex items-center gap-1 mt-0.5"
          >
            ❤️ <span className="font-semibold text-[#2563EB] hover:underline">Donate Now</span>
          </button>
        </div>

        {/* Card Footer Security Tag */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <FiShield className="h-3.5 w-3.5 text-slate-400" />
            Protected by Velora Security • 256-bit SSL Encryption
          </p>
        </div>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PARENT SIGNUP FORM COMPONENT
════════════════════════════════════════════════════════════ */
function ParentSignupForm({ form, onSubmit, success, loading, onBack }) {
  const { register, handleSubmit } = form;

  const fieldCls =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0F172A] outline-none transition " +
    "placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 " +
    "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

  const labelCls = "block text-xs font-semibold text-[#0F172A] dark:text-slate-300 font-display";

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-[#64748B] dark:text-slate-400">
        Fill in your details to apply as a registered parent. An admin will verify and activate your account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>First Name *
            <input placeholder="First name" className={fieldCls} {...register("firstName", { required: true })} />
          </label>
          <label className={labelCls}>Last Name
            <input placeholder="Last name" className={fieldCls} {...register("lastName")} />
          </label>
          <label className={labelCls}>Phone *
            <input type="tel" placeholder="+91 XXXXX XXXXX" className={fieldCls} {...register("phone", { required: true })} />
          </label>
          <label className={labelCls}>Email *
            <input type="email" placeholder="family@example.com" className={fieldCls} {...register("email", { required: true })} />
          </label>
          <label className={labelCls}>Password *
            <input type="password" placeholder="Create password" className={fieldCls} {...register("password", { required: true, minLength: 8 })} />
          </label>
          <label className={labelCls}>Occupation
            <input placeholder="e.g. Teacher" className={fieldCls} {...register("occupation")} />
          </label>
        </div>

        <label className={labelCls}>Reason for Adoption *
          <textarea rows={3} placeholder="Why do you wish to adopt?" className={fieldCls} {...register("adoptionReason", { required: true })} />
        </label>

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            {success}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onBack} className="flex-none min-h-[44px]">
            ← Back
          </Button>
          <Button type="submit" fullWidth disabled={loading} className="min-h-[44px]">
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}