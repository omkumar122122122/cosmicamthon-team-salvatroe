import { orphanageNav } from "../data/dummyData.js";
import DashboardLayout from "./DashboardLayout.jsx";

export default function OrphanageLayout() {
  return <DashboardLayout navItems={orphanageNav} role="orphanage" title="Orphanage Console" />;
}
