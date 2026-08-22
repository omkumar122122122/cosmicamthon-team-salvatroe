import { FiCheckCircle, FiUser } from "react-icons/fi";

const roleAvatarBg = {
  admin:     "bg-indigo-600",
  orphanage: "bg-civic-600",
  parent:    "bg-emerald-600",
};

export default function ProfileHeader({ user }) {
  const avatarBg = roleAvatarBg[user.role] ?? "bg-slate-600";

  return (
    <div className="flex flex-col gap-4 border-b border-gray-100 px-5 pb-5 pt-5 dark:border-slate-800 sm:flex-row sm:items-center">
      {/* Avatar */}
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm ${avatarBg}`}>
        {user.avatar ?? <FiUser className="h-7 w-7" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
            <FiCheckCircle className="h-3 w-3" />
            Active
          </span>
        </div>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 capitalize">
          {user.role} · {user.department}
        </p>
      </div>

      {/* Joined */}
      {user.joiningDate && (
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500">Member since</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{user.joiningDate}</p>
        </div>
      )}
    </div>
  );
}
