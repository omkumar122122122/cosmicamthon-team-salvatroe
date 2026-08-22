/**
 * Staff Module Helper Functions
 * Utility functions for formatting, validation, and data transformation
 */

import { ROLE_LABELS, ROLE_COLORS, STAFF_ROLES } from '../constants/staffConstants';

/**
 * Convert role enum to display label
 * @param {string} role - OrphanageStaffRole enum value
 * @returns {string} Human-readable label
 */
export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

/**
 * Get color for role badge
 * @param {string} role - OrphanageStaffRole enum value
 * @returns {string} Color identifier
 */
export function getRoleColor(role) {
  return ROLE_COLORS[role] || 'slate';
}

/**
 * Format staff member's full name
 * @param {Object} user - User object with firstName and lastName
 * @returns {string} Formatted full name
 */
export function formatStaffName(user) {
  if (!user) return 'Unknown';
  const { firstName, lastName } = user;
  return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';
}

/**
 * Format joining date for display
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted date (e.g., "Jan 15, 2024")
 */
export function formatJoiningDate(date) {
  if (!date) return 'N/A';
  
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Get initials from staff name for avatar
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "JD" for "John Doe")
 */
export function getStaffInitials(name) {
  if (!name || typeof name !== 'string') return '??';
  
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Check if staff member is active
 * @param {Object} staff - Staff object
 * @returns {boolean} True if active
 */
export function isStaffActive(staff) {
  return staff?.isActive === true;
}

/**
 * Get all role options for dropdown
 * @returns {Array} Array of {value, label} objects
 */
export function getStaffRoleOptions(roleList = STAFF_ROLES) {
  return roleList.map(role => ({
    value: role,
    label: getRoleLabel(role),
  }));
}

/**
 * Validate staff form data
 * @param {Object} data - Form data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateStaffForm(data) {
  const errors = {};

  if (!data.userId) {
    errors.userId = 'User is required';
  }

  if (!data.orphanageId) {
    errors.orphanageId = 'Orphanage is required';
  }

  if (!data.role) {
    errors.role = 'Role is required';
  } else if (!STAFF_ROLES.includes(data.role)) {
    errors.role = 'Invalid role';
  }

  if (!data.joiningDate) {
    errors.joiningDate = 'Joining date is required';
  } else {
    const joiningDate = new Date(data.joiningDate);
    if (isNaN(joiningDate.getTime())) {
      errors.joiningDate = 'Invalid date format';
    } else if (joiningDate > new Date()) {
      errors.joiningDate = 'Joining date cannot be in the future';
    }
  }

  if (data.endDate) {
    const endDate = new Date(data.endDate);
    const joiningDate = new Date(data.joiningDate);
    
    if (isNaN(endDate.getTime())) {
      errors.endDate = 'Invalid date format';
    } else if (endDate <= joiningDate) {
      errors.endDate = 'End date must be after joining date';
    }
  }

  if (data.designation && data.designation.length > 100) {
    errors.designation = 'Designation must not exceed 100 characters';
  }

  if (data.employeeId && data.employeeId.length > 50) {
    errors.employeeId = 'Employee ID must not exceed 50 characters';
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must not exceed 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Format staff data for display in table
 * @param {Object} staff - Raw staff data from API
 * @returns {Object} Formatted staff data
 */
export function formatStaffForTable(staff) {
  return {
    id: staff.id,
    employeeId: staff.employeeId || 'N/A',
    name: staff.name || formatStaffName(staff.user),
    role: getRoleLabel(staff.role),
    roleRaw: staff.role,
    designation: staff.designation || '-',
    joiningDate: formatJoiningDate(staff.joiningDate),
    status: staff.isActive ? 'Active' : 'Inactive',
    isActive: staff.isActive,
    orphanageName: staff.orphanageName || 'Unknown',
    userEmail: staff.userEmail || '-',
    userPhone: staff.userPhone || '-',
  };
}

/**
 * Calculate tenure (time since joining)
 * @param {string|Date} joiningDate - Joining date
 * @returns {string} Formatted tenure (e.g., "2 years", "6 months")
 */
export function calculateTenure(joiningDate) {
  if (!joiningDate) return 'N/A';
  
  try {
    const joining = new Date(joiningDate);
    const now = new Date();
    const diffMs = now - joining;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    return 'N/A';
  }
}
