/**
 * StaffFilters Component
 * Filter controls for staff list (role, status, sort)
 */

import { FiFilter, FiX } from 'react-icons/fi';
import { getStaffRoleOptions } from '../utils/staffHelpers';
import { STATUS_OPTIONS, SORT_OPTIONS, SORT_ORDER_OPTIONS } from '../constants/staffConstants';

export default function StaffFilters({ filters, onChange, onClear, availableRoles }) {
  const roleOptions = [
    { value: '', label: 'All Roles' },
    ...getStaffRoleOptions(availableRoles),
  ];

  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasActiveFilters =
    filters.role || filters.isActive || filters.sortBy !== 'joiningDate' || filters.sortOrder !== 'desc';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <FiFilter className="h-4 w-4" />
        <span>Filters:</span>
      </div>

      {/* Role Filter */}
      <select
        value={filters.role}
        onChange={(e) => handleChange('role', e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-civic-500 focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-civic-400 dark:focus:border-civic-400"
      >
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={filters.isActive}
        onChange={(e) => handleChange('isActive', e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-civic-500 focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-civic-400 dark:focus:border-civic-400"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Sort By */}
      <select
        value={filters.sortBy}
        onChange={(e) => handleChange('sortBy', e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-civic-500 focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-civic-400 dark:focus:border-civic-400"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Sort: {option.label}
          </option>
        ))}
      </select>

      {/* Sort Order */}
      <select
        value={filters.sortOrder}
        onChange={(e) => handleChange('sortOrder', e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-civic-500 focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-civic-400 dark:focus:border-civic-400"
      >
        {SORT_ORDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <FiX className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}
