/**
 * Staff Module Constants
 * Enums, labels, colors, and default configurations
 */

export const ADMIN_STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'GOVERNMENT_OFFICER',
];

export const ORPHANAGE_STAFF_ROLES = [
  'CARETAKER',
  'DOCTOR',
  'NURSE',
  'TEACHER',
  'SECURITY_GUARD',
  'COUNSELOR',
  'SOCIAL_WORKER',
  'VOLUNTEER',
  'ACCOUNTANT',
  'COOK',
  'CLEANER',
  'ADMINISTRATOR',
  'OTHER',
];

export const STAFF_ROLES = [
  ...ADMIN_STAFF_ROLES,
  ...ORPHANAGE_STAFF_ROLES,
];

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'System Admin',
  MODERATOR: 'Moderator',
  GOVERNMENT_OFFICER: 'Government Officer',
  ADMINISTRATOR: 'Administrator',
  CARETAKER: 'Caretaker',
  TEACHER: 'Teacher',
  MEDICAL_STAFF: 'Medical Staff',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  SECURITY_GUARD: 'Security Guard',
  COUNSELOR: 'Counselor',
  SOCIAL_WORKER: 'Social Worker',
  VOLUNTEER: 'Volunteer',
  ACCOUNTANT: 'Accountant',
  COOK: 'Cook',
  CLEANER: 'Cleaner',
  OTHER: 'Other',
};

export const ROLE_COLORS = {
  SUPER_ADMIN: 'purple',
  ADMIN: 'blue',
  MODERATOR: 'cyan',
  GOVERNMENT_OFFICER: 'amber',
  ADMINISTRATOR: 'indigo',
  CARETAKER: 'emerald',
  TEACHER: 'indigo',
  MEDICAL_STAFF: 'red',
  DOCTOR: 'red',
  NURSE: 'red',
  SECURITY_GUARD: 'amber',
  COUNSELOR: 'purple',
  SOCIAL_WORKER: 'cyan',
  VOLUNTEER: 'green',
  ACCOUNTANT: 'gray',
  COOK: 'orange',
  CLEANER: 'slate',
  OTHER: 'slate',
};

export const ROLE_BADGE_CLASSES = {
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/20',
  cyan: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/20',
  green: 'bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20',
  gray: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-500/20',
  orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20',
  slate: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20',
};

export const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'joiningDate', label: 'Joining Date' },
  { value: 'role', label: 'Role' },
  { value: 'employeeId', label: 'Employee ID' },
];

export const SORT_ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

export const DEFAULT_FILTERS = {
  search: '',
  orphanageId: '',
  role: '',
  isActive: '',
  sortBy: 'joiningDate',
  sortOrder: 'desc',
};

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};
