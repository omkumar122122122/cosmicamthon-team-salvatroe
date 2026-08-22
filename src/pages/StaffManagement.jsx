import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBriefcase, FiUsers, FiUserCheck, FiUserX, FiPlus, FiLoader, FiShield } from 'react-icons/fi';
import Breadcrumb from '../components/Breadcrumb';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import { SkeletonTable } from '../components/Loader';
import StaffFilters from '../components/StaffFilters';
import StaffRoleBadge from '../components/StaffRoleBadge';
import ToastContainer from '../components/Toast';
import Modal, { ModalFooter } from '../components/Modal';
import FormInput from '../components/FormInput';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { adminStaffService, orphanageStaffService } from '../services/staffService';
import {
  DEFAULT_FILTERS,
  DEFAULT_PAGINATION,
  ADMIN_STAFF_ROLES,
  ORPHANAGE_STAFF_ROLES,
  ROLE_LABELS,
} from '../constants/staffConstants';
import { classNames } from '../utils/formatters';

export default function StaffManagement() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    caretakers: 0,
    administrators: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const activeService = isAdmin ? adminStaffService : orphanageStaffService;
  const availableRoles = isAdmin ? ADMIN_STAFF_ROLES : ORPHANAGE_STAFF_ROLES;
  const defaultRole = isAdmin ? 'ADMIN' : 'CARETAKER';
  const basePath = isAdmin ? '/admin' : '/orphanage';

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: defaultRole,
    designation: '',
    employeeId: '',
    joiningDate: new Date().toISOString().split('T')[0],
  });

  const summaryConfig = [
    {
      label: 'Total Staff',
      key: 'total',
      icon: FiBriefcase,
      color: 'bg-civic-50 text-civic-700 ring-1 ring-civic-200 dark:bg-civic-500/10 dark:text-civic-300 dark:ring-civic-500/20',
    },
    {
      label: 'Active',
      key: 'active',
      icon: FiUserCheck,
      color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
    },
    {
      label: 'Inactive',
      key: 'inactive',
      icon: FiUserX,
      color: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20',
    },
    isAdmin
      ? {
          label: 'System Admins',
          key: 'administrators',
          icon: FiShield,
          color: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/20',
        }
      : {
          label: 'Caretakers',
          key: 'caretakers',
          icon: FiUsers,
          color: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20',
        },
  ];

  const loadStaff = async (page = 1, searchQuery = query, currentFilters = filters) => {
    try {
      setLoading(true);
      const response = await activeService.getAll({
        search: searchQuery,
        ...currentFilters,
        page,
        limit: 10,
      });

      const payload = Array.isArray(response) ? { data: response } : (response ?? {});
      const records = Array.isArray(payload.data) ? payload.data : [];
      setData(records);
      setPagination(payload.pagination ?? DEFAULT_PAGINATION);
      setSummary(
        payload.summary ?? {
          total: 0,
          active: 0,
          inactive: 0,
          caretakers: 0,
          administrators: 0,
        }
      );
    } catch (err) {
      showError(err.message || 'Failed to load staff');
      console.error('Error loading staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [user?.role]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query !== undefined) {
        loadStaff(1, query);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [query]);

  useEffect(() => {
    loadStaff(1, query, filters);
  }, [filters]);

  const handlePageChange = (newPage) => {
    loadStaff(newPage);
  };

  const handleRowClick = (staff) => {
    navigate(`${basePath}/staff/${staff.id}`);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleAddStaff = () => {
    setNewStaff((prev) => ({ ...prev, role: defaultRole }));
    setIsAddModalOpen(true);
  };

  const handleSubmitAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.email.trim()) {
      showError('Name and Email are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: newStaff.name.trim(),
        email: newStaff.email.trim(),
        role: newStaff.role,
        designation: newStaff.designation.trim() || ROLE_LABELS[newStaff.role] || (isAdmin ? 'System Admin' : 'Staff Member'),
        employeeId: newStaff.employeeId.trim() || `${isAdmin ? 'ADM' : 'EMP'}-${Math.floor(1000 + Math.random() * 9000)}`,
        joiningDate: newStaff.joiningDate ? new Date(newStaff.joiningDate).toISOString() : new Date().toISOString(),
      };

      await activeService.create(payload);
      showSuccess(`${isAdmin ? 'Admin' : 'Orphanage'} staff member added successfully`);
      setIsAddModalOpen(false);
      setNewStaff({
        name: '',
        email: '',
        role: defaultRole,
        designation: '',
        employeeId: '',
        joiningDate: new Date().toISOString().split('T')[0],
      });
      loadStaff();
    } catch (err) {
      showError(err.message || 'Failed to add staff member');
      console.error('Error adding staff member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableColumns = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'designation', label: 'Designation' },
    { key: 'joiningDate', label: 'Joining Date' },
    { key: 'status', label: 'Status' },
    { key: 'userEmail', label: 'Email' },
    ...(isAdmin ? [{ key: 'orphanageName', label: 'Scope' }] : []),
  ];

  const tableData = (Array.isArray(data) ? data : []).map((staff) => ({
    id: staff.id,
    employeeId: staff.employeeId || 'N/A',
    name: staff.name,
    role: <StaffRoleBadge role={staff.role} size="sm" />,
    roleRaw: staff.role,
    designation: staff.designation || '-',
    joiningDate: staff.joiningDate
      ? new Date(staff.joiningDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '-',
    status: staff.isActive ? (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20">
        Inactive
      </span>
    ),
    userEmail: staff.userEmail || '-',
    orphanageName: staff.orphanageName || (isAdmin ? 'Platform Administration' : 'N/A'),
  }));

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Breadcrumb items={['Management', isAdmin ? 'Admin Staff' : 'Orphanage Staff']} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
            {isAdmin ? <FiShield className="h-5 w-5" /> : <FiBriefcase className="h-5 w-5" />}
          </div>
          <div>
            <h1 className="page-title">
              {isAdmin ? 'System & Admin Staff' : 'Orphanage Care & Operational Staff'}
            </h1>
            <p className="page-subtitle">
              {isAdmin
                ? 'Manage system administrators, moderators, and platform officers'
                : 'Manage care home staff, caretakers, nurses, teachers, and operational personnel'}
            </p>
          </div>
        </div>
        <button
          onClick={handleAddStaff}
          className="flex items-center gap-2 rounded-lg bg-civic-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-civic-700 hover:shadow-md dark:bg-civic-500 dark:hover:bg-civic-600"
        >
          <FiPlus className="h-4 w-4" />
          {isAdmin ? 'Add Admin Staff' : 'Add Orphanage Staff'}
        </button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {summaryConfig.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={classNames('flex items-center gap-3 rounded-xl px-4 py-3', s.color)}>
              <Icon className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums leading-none">{summary[s.key] || 0}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={isAdmin ? "Search admin staff by name or email..." : "Search orphanage staff by name, email, or ID..."}
          className="sm:max-w-md"
        />
        <StaffFilters
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          availableRoles={availableRoles}
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="section-card"
      >
        {loading ? (
          <SkeletonTable rows={8} cols={tableColumns.length} />
        ) : (Array.isArray(data) ? data : []).length === 0 ? (
          <div className="empty-state py-16">
            <div className="empty-state-icon">
              {isAdmin ? <FiShield className="h-6 w-6 text-slate-400" /> : <FiBriefcase className="h-6 w-6 text-slate-400" />}
            </div>
            <p className="empty-state-title">
              {isAdmin ? 'No Admin Staff Found' : 'No Orphanage Staff Found'}
            </p>
            <p className="empty-state-desc">
              {query ? 'Try adjusting your search or filters' : `No ${isAdmin ? 'system admin' : 'orphanage care'} staff members registered yet`}
            </p>
          </div>
        ) : (
          <>
            <DataTable
              columns={tableColumns}
              rows={tableData}
              onRowClick={handleRowClick}
            />
            {pagination.totalPages > 1 && (
              <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isAdmin ? "Add System / Admin Staff Member" : "Add Orphanage Staff Member"}
        size="lg"
      >
        <form onSubmit={handleSubmitAddStaff} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Full Name"
              required
              value={newStaff.name}
              onChange={(e) => setNewStaff((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Meera Nair"
            />
            <FormInput
              label="Email Address"
              type="email"
              required
              value={newStaff.email}
              onChange={(e) => setNewStaff((prev) => ({ ...prev, email: e.target.value }))}
              placeholder={isAdmin ? "e.g. admin@childsafety.org" : "e.g. meera@orphanage.org"}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                Role <span className="ml-1 text-red-500">*</span>
              </label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-civic-500 focus:ring-2 focus:ring-civic-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
            </div>
            <FormInput
              label="Designation"
              value={newStaff.designation}
              onChange={(e) => setNewStaff((prev) => ({ ...prev, designation: e.target.value }))}
              placeholder={isAdmin ? "e.g. Platform Safety Officer" : "e.g. Senior Caretaker"}
            />
            <FormInput
              label="Employee ID"
              value={newStaff.employeeId}
              onChange={(e) => setNewStaff((prev) => ({ ...prev, employeeId: e.target.value }))}
              placeholder={isAdmin ? "e.g. ADM-101" : "e.g. EMP-101"}
            />
            <FormInput
              label="Joining Date"
              type="date"
              required
              value={newStaff.joiningDate}
              onChange={(e) => setNewStaff((prev) => ({ ...prev, joiningDate: e.target.value }))}
            />
          </div>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-civic-600 px-4 py-2 text-sm font-semibold text-white hover:bg-civic-700 disabled:opacity-50 dark:bg-civic-500 dark:hover:bg-civic-600"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${isAdmin ? 'Admin' : 'Orphanage'} Staff`
              )}
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
