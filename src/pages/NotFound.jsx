import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Button from "../components/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 dark:bg-slate-950">
      <div className="w-full max-w-md text-center">
        {/* Large 404 */}
        <p className="text-[6rem] font-black leading-none tracking-tighter text-gray-100 dark:text-slate-800">
          404
        </p>

        {/* Content */}
        <div className="-mt-4 rounded-2xl border border-gray-100 bg-white px-8 py-8 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-civic-50 dark:bg-civic-500/10">
            <svg className="h-7 w-7 text-civic-600 dark:text-civic-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Page not found</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            The requested route does not exist in this system. Please return to the login page or use the navigation.
          </p>
          <Link to="/login" className="mt-6 inline-block">
            <Button icon={FiArrowLeft}>Return to Login</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
