import { adminNav } from "../data/dummyData.js";
import DashboardLayout from "./DashboardLayout.jsx";

export default function AdminLayout() {
  return <DashboardLayout navItems={adminNav} role="admin" title="Admin Dashboard" />;
}
