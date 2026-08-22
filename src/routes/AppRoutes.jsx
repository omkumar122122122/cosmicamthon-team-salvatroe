import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout.jsx";
import OrphanageLayout from "../layouts/OrphanageLayout.jsx";
import ParentLayout from "../layouts/ParentLayout.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import Alerts from "../pages/Alerts.jsx";
import ChildAdoptionManagement from "../pages/ChildAdoptionManagement.jsx";
import ChildProfile from "../pages/ChildProfile.jsx";
import Children from "../pages/Children.jsx";
import HealthMonitoring from "../pages/HealthMonitoring.jsx";
import Login from "../pages/Login.jsx";
import ManageVisitRequests from "../pages/ManageVisitRequests.jsx";
import AIAttendance from "../pages/AIAttendance.jsx";
import NotFound from "../pages/NotFound.jsx";
import OrphanageDashboard from "../pages/OrphanageDashboard.jsx";
import OrphanageDetail from "../pages/OrphanageDetail.jsx";
import OrphanageFullProfile from "../pages/OrphanageFullProfile.jsx";
import Orphanages from "../pages/Orphanages.jsx";
import ParentDashboard from "../pages/ParentDashboard.jsx";
import PostAdoptionMonitoring from "../pages/PostAdoptionMonitoring.jsx";
import ParentKYC from "../pages/ParentKYC.jsx";
import ParentProfile from "../pages/ParentProfile.jsx";
import ParentVerificationCenter from "../pages/ParentVerificationCenter.jsx";
import Profile from "../pages/Profile.jsx";
import RegisterChild from "../pages/RegisterChild.jsx";
import RegisterOrphanage from "../pages/RegisterOrphanage.jsx";
import Reports from "../pages/Reports.jsx";
import StaffManagement from "../pages/StaffManagement.jsx";
import StaffProfile from "../pages/StaffProfile.jsx";
import SystemSettings from "../pages/SystemSettings.jsx";
import ChildWelfareFollowUpSession from "../pages/ChildWelfareFollowUpSession.jsx";
import VisitRequest from "../pages/VisitRequest.jsx";
import SahayakAI from "../pages/SahayakAI.jsx";
import DonorLayout from "../layouts/DonorLayout.jsx";
import DonorLogin from "../pages/DonorLogin.jsx";
import DonorRegister from "../pages/DonorRegister.jsx";
import DonorDashboard from "../pages/DonorDashboard.jsx";
import DonorRequests from "../pages/DonorRequests.jsx";
import MyDonations from "../pages/MyDonations.jsx";
import OrphanageDonationRequests from "../pages/OrphanageDonationRequests.jsx";
import NearbyOrphanages from "../pages/NearbyOrphanages.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default → login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* ── Donor Auth Public Routes ─────────────────────── */}
      <Route path="/donor/login" element={<DonorLogin />} />
      <Route path="/donor/register" element={<DonorRegister />} />

      {/* ── Admin ─────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="children" element={<Children />} />
          <Route path="children/:childId" element={<ChildProfile />} />
          <Route path="children/:childId/welfare-followup" element={<ChildWelfareFollowUpSession />} />
          <Route path="parent-profiles/:parentId" element={<ParentProfile />} />
          <Route path="parent-profiles/:parentId/kyc" element={<ParentKYC />} />
          <Route path="register-orphanage" element={<RegisterOrphanage />} />
          <Route path="orphanages" element={<Orphanages />} />
          <Route path="orphanages/:orphanageId" element={<OrphanageDetail />} />
          <Route path="orphanages/:orphanageId/profile" element={<OrphanageFullProfile />} />
          <Route path="staff/:staffId" element={<StaffProfile />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="profile" element={<Profile />} />
          <Route path="parent-verification" element={<ParentVerificationCenter />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="staff/:staffId" element={<StaffProfile />} />
          <Route path="adoption-management" element={<ChildAdoptionManagement />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Route>

      {/* ── Parent ────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
        <Route path="/parent" element={<ParentLayout />}>
          <Route index element={<ParentDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="kyc" element={<ParentKYC />} />
          <Route path="visit-request" element={<VisitRequest />} />
          <Route path="sahayak-ai" element={<SahayakAI />} />
          <Route path="notifications" element={<Alerts />} />
          <Route path="post-adoption-monitoring" element={<PostAdoptionMonitoring />} />
          <Route path="child-welfare-follow-up-session" element={<ChildWelfareFollowUpSession />} />
        </Route>
      </Route>

      {/* ── Orphanage ─────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={["orphanage"]} />}>
        <Route path="/orphanage" element={<OrphanageLayout />}>
          <Route index element={<OrphanageDashboard />} />
          <Route path="ai-attendance" element={<AIAttendance />} />
          <Route path="visit-requests" element={<ManageVisitRequests />} />
          <Route path="children" element={<Children />} />
          <Route path="children/:childId" element={<ChildProfile />} />
          <Route path="children/:childId/welfare-followup" element={<ChildWelfareFollowUpSession />} />
          <Route path="parent-profiles/:parentId" element={<ParentProfile />} />
          <Route path="register-child" element={<RegisterChild />} />
          <Route path="adoption-management" element={<ChildAdoptionManagement />} />
          <Route path="health-monitoring" element={<HealthMonitoring />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="staff/:staffId" element={<StaffProfile />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="donation-requests" element={<OrphanageDonationRequests />} />
        </Route>
      </Route>

      {/* ── Donor Protected Portal ─────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={["donor"]} />}>
        <Route path="/donor" element={<DonorLayout />}>
          <Route index element={<DonorDashboard />} />
          <Route path="nearby" element={<NearbyOrphanages />} />
          <Route path="donations" element={<MyDonations />} />
          <Route path="requests" element={<MyDonations />} />
          <Route path="causes" element={<DonorDashboard />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
