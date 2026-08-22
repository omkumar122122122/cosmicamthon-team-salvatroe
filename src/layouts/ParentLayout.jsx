import { FiActivity, FiMessageCircle, FiShield, FiUser, FiCalendar, FiHeart, FiAlertTriangle } from "react-icons/fi";
import DashboardLayout from "./DashboardLayout.jsx";

const parentNav = [
  { label: "Dashboard", path: "/parent", icon: FiActivity },
  { label: "Post Adoption Monitoring", path: "/parent/post-adoption-monitoring", icon: FiHeart },
  { label: "Sahayak AI", path: "/parent/sahayak-ai", icon: FiMessageCircle },
  { label: "KYC Verification", path: "/parent/kyc", icon: FiShield },
  { label: "Profile", path: "/parent/profile", icon: FiUser },
  { label: "Visit Request", path: "/parent/visit-request", icon: FiCalendar },
  { label: "Notifications", path: "/parent/notifications", icon: FiAlertTriangle },
];

export default function ParentLayout() {
  return <DashboardLayout navItems={parentNav} role="parent" title="Parent Portal" />;
}