/**
 * StaffRoleBadge Component
 * Displays a color-coded badge for staff roles
 */

import { getRoleLabel, getRoleColor } from '../utils/staffHelpers';
import { ROLE_BADGE_CLASSES } from '../constants/staffConstants';
import { classNames } from '../utils/formatters';

export default function StaffRoleBadge({ role, size = 'md', className = '' }) {
  if (!role) return null;

  const label = getRoleLabel(role);
  const color = getRoleColor(role);
  const badgeClass = ROLE_BADGE_CLASSES[color] || ROLE_BADGE_CLASSES.slate;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full font-medium',
        badgeClass,
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}
