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
import Gate from "../pages/Gate.jsx";
import GateStaffDetails from "../pages/GateStaffDetails.jsx";
import StaffAccessPortal from "../pages/StaffAccessPortal.jsx";
import ParentVisitPortal from "../pages/ParentVisitPortal.jsx";
import AccessAudit from "../pages/AccessAudit.jsx";
import Analytics from "../pages/Analytics.jsx";
import NfcVisitDetails from "../pages/NfcVisitDetails.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function AppRoutes() {
  // Smart root redirect depending on standalone portal port
  const isParentPort = typeof window !== "undefined" && window.location.port === "5175";
  const isStaffPort = typeof window !== "undefined" && window.location.port === "5174";
  const defaultRedirect = isParentPort ? "/visit" : isStaffPort ? "/staff" : "/login";

  return (
    <Routes>
      {/* Dynamic default redirect */}
      <Route path="/" element={<Navigate to={defaultRedirect} replace />} />
      <Route path="/login" element={<Login />} />

      {/* ── Separate Public Staff Access Portal (Port 5174) ─────────── */}
      <Route path="/staff" element={<StaffAccessPortal />} />
      <Route path="/staff/:staffId" element={<StaffAccessPortal />} />

      {/* ── Separate Public Parent Visit Portal (Port 5175) ─────────── */}
      <Route path="/visit" element={<ParentVisitPortal />} />
      <Route path="/visit/:identifier" element={<ParentVisitPortal />} />
      <Route path="/visit/*" element={<ParentVisitPortal />} />
      <Route path="/parent-portal" element={<ParentVisitPortal />} />
      <Route path="/parent-portal/:identifier" element={<ParentVisitPortal />} />
      <Route path="/parent-portal/*" element={<ParentVisitPortal />} />

      {/* ── Public / Shared Live Gate Access, Access Audit, Analytics & AI Welfare ──── */}
      <Route path="/orphanage/gate" element={<Gate />} />
      <Route path="/orphanage/gate/staff/:staffId" element={<GateStaffDetails />} />
      <Route path="/access-audit" element={<AccessAudit />} />
      <Route path="/orphanage/access-audit" element={<AccessAudit />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/orphanage/analytics" element={<Analytics />} />
      <Route path="/ai-welfare" element={<PostAdoptionMonitoring />} />
      <Route path="/post-adoption-monitoring" element={<PostAdoptionMonitoring />} />
      <Route path="/orphanage/ai-welfare" element={<PostAdoptionMonitoring />} />
      <Route path="/orphanage/post-adoption-monitoring" element={<PostAdoptionMonitoring />} />

      {/* ── Public NFC Visit Verification & Parent Details Routes ──────── */}
      <Route path="/nfc" element={<ParentVisitPortal />} />
      <Route path="/nfc/scan" element={<ParentVisitPortal />} />
      <Route path="/nfc/scan/:nfcId" element={<ParentVisitPortal />} />
      <Route path="/nfc/scan/*" element={<ParentVisitPortal />} />
      <Route path="/nfc/visit/:token" element={<ParentVisitPortal />} />
      <Route path="/nfc/parent/:nfcId" element={<ParentVisitPortal />} />
      <Route path="/nfc/parent/*" element={<ParentVisitPortal />} />
      <Route path="/nfc/:nfcId" element={<ParentVisitPortal />} />
      <Route path="/nfc/*" element={<ParentVisitPortal />} />

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
          <Route path="gate" element={<Gate />} />
          <Route path="gate/staff/:staffId" element={<GateStaffDetails />} />
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
          <Route path="access-audit" element={<AccessAudit />} />
          <Route path="analytics" element={<Analytics />} />
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
