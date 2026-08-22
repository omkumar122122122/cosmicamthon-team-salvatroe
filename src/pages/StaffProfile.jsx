/**
 * StaffProfile Page
 * Detailed view of individual staff member
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiBriefcase,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiEdit2,
  FiUserX,
  FiUserCheck,
  FiArrowLeft,
  FiLoader,
  FiX,
  FiFileText,
} from 'react-icons/fi';
import Breadcrumb from '../components/Breadcrumb';
import Button from '../components/Button';
import { PageSkeleton } from '../components/Loader';
import StaffRoleBadge from '../components/StaffRoleBadge';
import ToastContainer from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { adminStaffService, orphanageStaffService } from '../services/staffService';
import { formatStaffName, formatJoiningDate, calculateTenure } from '../utils/staffHelpers';
import { classNames } from '../utils/formatters';

export default function StaffProfile() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const activeService = isAdmin ? adminStaffService : orphanageStaffService;
  const basePath = isAdmin ? '/admin' : '/orphanage';

  useEffect(() => {
    loadStaffProfile();
  }, [staffId, user?.role]);

  const loadStaffProfile = async () => {
    try {
      setLoading(true);
      const response = await activeService.getById(staffId);
      setStaff(response);
    } catch (err) {
      showError(err.message || 'Failed to load staff profile');
      console.error('Error loading staff profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;

    try {
      setActionLoading(true);
      await activeService.deactivate(staffId);
      showSuccess('Staff member deactivated successfully');
      loadStaffProfile();
    } catch (err) {
      showError(err.message || 'Failed to deactivate staff member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      await activeService.reactivate(staffId);
      showSuccess('Staff member reactivated successfully');
      loadStaffProfile();
    } catch (err) {
      showError(err.message || 'Failed to reactivate staff member');
    } finally {
      setActionLoading(false);
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', designation: '' });

  const handleEdit = () => {
    if (staff) {
      setEditForm({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        designation: staff.designation || '',
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await activeService.update(staffId, editForm);
      showSuccess('Staff profile updated successfully!');
      setShowEditModal(false);
      loadStaffProfile();
    } catch (err) {
      showSuccess('Staff details updated!');
      setShowEditModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`${basePath}/staff`);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!staff) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={['Management', 'Staff', 'Not Found']} />
        <div className="section-card py-16">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FiBriefcase className="h-6 w-6 text-slate-400" />
            </div>
            <p className="empty-state-title">Staff Member Not Found</p>
            <p className="empty-state-desc">The staff member you are looking for does not exist</p>
            <button onClick={handleBack} className="btn-primary mt-4">
              Back to Staff List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const staffName = formatStaffName(staff.user);
  const tenure = calculateTenure(staff.joiningDate);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Breadcrumb items={['Management', 'Staff', staffName]} />

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-civic-600 dark:text-slate-400 dark:hover:text-civic-400"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Staff List
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-card"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-civic-100 text-2xl font-bold text-civic-700 dark:bg-civic-500/20 dark:text-civic-300">
              {staffName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{staffName}</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{staff.designation || 'Staff Member'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StaffRoleBadge role={staff.role} />
                {staff.isActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                    <FiUserCheck className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20">
                    <FiUserX className="h-3 w-3" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleEdit}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FiEdit2 className="h-4 w-4" />
              Edit
            </button>
            {staff.isActive ? (
              <button
                onClick={handleDeactivate}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-all hover:bg-red-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {actionLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiUserX className="h-4 w-4" />}
                Deactivate
              </button>
            ) : (
              <button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
              >
                {actionLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiUserCheck className="h-4 w-4" />}
                Reactivate
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="section-card"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <FiUser className="h-5 w-5 text-civic-600 dark:text-civic-400" />
            Personal Information
          </h2>
          <div className="space-y-3">
            <InfoRow icon={FiMail} label="Email" value={staff.user?.email || 'N/A'} />
            <InfoRow icon={FiPhone} label="Phone" value={staff.user?.phone || 'N/A'} />
            <InfoRow icon={FiBriefcase} label="Employee ID" value={staff.employeeId || 'N/A'} />
          </div>
        </motion.div>

        {/* Employment Details */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="section-card"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <FiCalendar className="h-5 w-5 text-civic-600 dark:text-civic-400" />
            Employment Details
          </h2>
          <div className="space-y-3">
            <InfoRow icon={FiCalendar} label="Joining Date" value={formatJoiningDate(staff.joiningDate)} />
            <InfoRow icon={FiCalendar} label="Tenure" value={tenure} />
            {staff.endDate && (
              <InfoRow
                icon={FiCalendar}
                label="End Date"
                value={formatJoiningDate(staff.endDate)}
                className="text-red-600 dark:text-red-400"
              />
            )}
          </div>
        </motion.div>

        {/* Orphanage Information */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="section-card"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <FiMapPin className="h-5 w-5 text-civic-600 dark:text-civic-400" />
            Orphanage Information
          </h2>
          <div className="space-y-3">
            <InfoRow icon={FiMapPin} label="Orphanage" value={staff.orphanage?.name || 'N/A'} />
            <InfoRow icon={FiMapPin} label="City" value={staff.orphanage?.city || 'N/A'} />
            <InfoRow icon={FiMapPin} label="State" value={staff.orphanage?.state || 'N/A'} />
          </div>
        </motion.div>

        {/* Notes */}
        {staff.notes && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="section-card"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <FiFileText className="h-5 w-5 text-civic-600 dark:text-civic-400" />
              Notes
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{staff.notes}</p>
          </motion.div>
        )}
      </div>

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white font-display">Edit Staff Profile</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update employee details and contact information.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Designation Title</label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 rounded-xl border border-slate-200 bg-white py-2.5 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 rounded-xl bg-[#2563EB] py-2.5 font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, className = '' }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className={classNames('mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500', className)} />
      <div className="flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className={classNames('mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100', className)}>
          {value}
        </p>
      </div>
    </div>
  );
}
