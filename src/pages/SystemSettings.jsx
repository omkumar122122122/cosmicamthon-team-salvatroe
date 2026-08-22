import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiSettings, FiSave, FiRotateCw, FiShield, FiLock, FiUsers,
  FiAlertTriangle, FiBell, FiCpu, FiFileText, FiDatabase,
  FiActivity, FiGlobe, FiMail, FiPhone, FiMapPin, FiClock,
  FiKey, FiUserCheck, FiCheckCircle, FiAlertCircle
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import { PageSkeleton } from "../components/Loader";
import Button from "../components/Button";
import { settingsService } from "../services/settingsService";
import toast from "react-hot-toast";
import { classNames } from "../utils/formatters";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay },
});

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Settings state
  const [general, setGeneral] = useState({});
  const [authentication, setAuthentication] = useState({});
  const [registration, setRegistration] = useState({});
  const [childSafety, setChildSafety] = useState({});
  const [notifications, setNotifications] = useState({});
  const [alerts, setAlerts] = useState({});
  const [ai, setAi] = useState({});
  const [reports, setReports] = useState({});
  const [backup, setBackup] = useState({});
  const [audit, setAudit] = useState({});
  const [security, setSecurity] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAll();
      
      setGeneral(data.general || {});
      setAuthentication(data.authentication || {});
      setRegistration(data.registration || {});
      setChildSafety(data.childSafety || {});
      setNotifications(data.notifications || {});
      setAlerts(data.alerts || {});
      setAi(data.ai || {});
      setReports(data.reports || {});
      setBackup(data.backup || {});
      setAudit(data.audit || {});
      setSecurity(data.security || {});
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section) => {
    try {
      setSaving(true);
      let data;
      
      switch (section) {
        case 'general':
          data = general;
          break;
        case 'authentication':
          data = authentication;
          break;
        case 'registration':
          data = registration;
          break;
        case 'childSafety':
          data = childSafety;
          break;
        case 'notifications':
          data = notifications;
          break;
        case 'alerts':
          data = alerts;
          break;
        case 'ai':
          data = ai;
          break;
        case 'reports':
          data = reports;
          break;
        case 'backup':
          data = backup;
          break;
        case 'audit':
          data = audit;
          break;
        case 'security':
          data = security;
          break;
        default:
          return;
      }
      
      await settingsService.update(section, data);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      await settingsService.createBackup();
      toast.success('Backup created successfully');
    } catch (err) {
      console.error('Backup failed:', err);
      toast.error('Backup failed');
    }
  };

  const handleRestore = async (backupId) => {
    try {
      await settingsService.restoreBackup(backupId);
      toast.success('Backup restored successfully');
      loadSettings();
    } catch (err) {
      console.error('Restore failed:', err);
      toast.error('Restore failed');
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      return;
    }
    
    try {
      await settingsService.resetToDefaults();
      toast.success('Settings reset to defaults');
      loadSettings();
    } catch (err) {
      console.error('Reset failed:', err);
      toast.error('Reset failed');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FiGlobe },
    { id: 'authentication', label: 'Authentication', icon: FiLock },
    { id: 'registration', label: 'Registration', icon: FiUserCheck },
    { id: 'childSafety', label: 'Child Safety', icon: FiShield },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'alerts', label: 'Alerts', icon: FiAlertTriangle },
    { id: 'ai', label: 'AI Settings', icon: FiCpu },
    { id: 'reports', label: 'Reports', icon: FiFileText },
    { id: 'backup', label: 'Backup', icon: FiDatabase },
    { id: 'audit', label: 'Audit', icon: FiActivity },
    { id: 'security', label: 'Security', icon: FiShield },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={["Admin", "System Settings"]} />

      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <FiSettings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">System Settings</h1>
            <p className="page-subtitle">Manage global system configuration and preferences</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            icon={FiRotateCw} 
            variant="secondary"
            onClick={handleResetDefaults}
            disabled={saving}
          >
            Reset to Defaults
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp(0.05)} className="section-card">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={classNames(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-civic-500 text-civic-600 dark:text-civic-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <GeneralSettings 
          settings={general}
          onChange={setGeneral}
          onSave={() => handleSave('general')}
          saving={saving}
        />
      )}

      {/* Authentication Settings */}
      {activeTab === 'authentication' && (
        <AuthenticationSettings
          settings={authentication}
          onChange={setAuthentication}
          onSave={() => handleSave('authentication')}
          saving={saving}
        />
      )}

      {/* Registration Settings */}
      {activeTab === 'registration' && (
        <RegistrationSettings
          settings={registration}
          onChange={setRegistration}
          onSave={() => handleSave('registration')}
          saving={saving}
        />
      )}

      {/* Child Safety Settings */}
      {activeTab === 'childSafety' && (
        <ChildSafetySettings
          settings={childSafety}
          onChange={setChildSafety}
          onSave={() => handleSave('childSafety')}
          saving={saving}
        />
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <NotificationSettings
          settings={notifications}
          onChange={setNotifications}
          onSave={() => handleSave('notifications')}
          saving={saving}
        />
      )}

      {/* Alert Settings */}
      {activeTab === 'alerts' && (
        <AlertSettings
          settings={alerts}
          onChange={setAlerts}
          onSave={() => handleSave('alerts')}
          saving={saving}
        />
      )}

      {/* AI Settings */}
      {activeTab === 'ai' && (
        <AISettings
          settings={ai}
          onChange={setAi}
          onSave={() => handleSave('ai')}
          saving={saving}
        />
      )}

      {/* Report Settings */}
      {activeTab === 'reports' && (
        <ReportSettings
          settings={reports}
          onChange={setReports}
          onSave={() => handleSave('reports')}
          saving={saving}
        />
      )}

      {/* Backup Settings */}
      {activeTab === 'backup' && (
        <BackupSettings
          settings={backup}
          onChange={setBackup}
          onSave={() => handleSave('backup')}
          onBackup={handleBackup}
          onRestore={handleRestore}
          saving={saving}
        />
      )}

      {/* Audit Settings */}
      {activeTab === 'audit' && (
        <AuditSettings
          settings={audit}
          onChange={setAudit}
          onSave={() => handleSave('audit')}
          saving={saving}
        />
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <SecuritySettings
          settings={security}
          onChange={setSecurity}
          onSave={() => handleSave('security')}
          saving={saving}
        />
      )}
    </div>
  );
}

// ========================================
// General Settings Component
// ========================================
function GeneralSettings({ settings, onChange, onSave, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <FiGlobe className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">General Information</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                System Name
              </label>
              <input
                type="text"
                value={settings.systemName || ''}
                onChange={(e) => handleChange('systemName', e.target.value)}
                className="input-field"
                placeholder="Orphan Age Child Safety System"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={settings.organizationName || ''}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                className="input-field"
                placeholder="Your Organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Contact Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={settings.contactEmail || ''}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className="input-field pl-10"
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Contact Number
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={settings.contactNumber || ''}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  className="input-field pl-10"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Address
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  value={settings.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="input-field pl-10"
                  rows={3}
                  placeholder="Complete address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone || 'UTC'}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="input-field"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Date Format
              </label>
              <select
                value={settings.dateFormat || 'MM/DD/YYYY'}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="input-field"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Language
              </label>
              <select
                value={settings.language || 'en'}
                onChange={(e) => handleChange('language', e.target.value)}
                className="input-field"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// Authentication Settings Component
// ========================================
function AuthenticationSettings({ settings, onChange, onSave, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  const handlePasswordPolicyChange = (field, value) => {
    onChange({
      ...settings,
      passwordPolicy: {
        ...(settings.passwordPolicy || {}),
        [field]: value
      }
    });
  };

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <FiLock className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">Authentication Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                JWT Expiry (minutes)
              </label>
              <input
                type="number"
                value={settings.jwtExpiry || 60}
                onChange={(e) => handleChange('jwtExpiry', parseInt(e.target.value))}
                className="input-field"
                min="5"
                max="1440"
              />
              <p className="mt-1 text-xs text-slate-500">Access token expiration time</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Refresh Token Expiry (days)
              </label>
              <input
                type="number"
                value={settings.refreshTokenExpiry || 7}
                onChange={(e) => handleChange('refreshTokenExpiry', parseInt(e.target.value))}
                className="input-field"
                min="1"
                max="90"
              />
              <p className="mt-1 text-xs text-slate-500">Refresh token expiration time</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Maximum Login Attempts
              </label>
              <input
                type="number"
                value={settings.maxLoginAttempts || 5}
                onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                className="input-field"
                min="3"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Account Lock Duration (minutes)
              </label>
              <input
                type="number"
                value={settings.accountLockDuration || 30}
                onChange={(e) => handleChange('accountLockDuration', parseInt(e.target.value))}
                className="input-field"
                min="5"
                max="1440"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.sessionTimeout || 30}
                onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                className="input-field"
                min="5"
                max="480"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                OTP Expiry (minutes)
              </label>
              <input
                type="number"
                value={settings.otpExpiry || 5}
                onChange={(e) => handleChange('otpExpiry', parseInt(e.target.value))}
                className="input-field"
                min="1"
                max="15"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.twoFactorEnabled || false}
                onChange={(e) => handleChange('twoFactorEnabled', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Enable Two-Factor Authentication
              </span>
            </label>
            <p className="mt-1 ml-6 text-xs text-slate-500">Require 2FA for all admin users</p>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Password Policy</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Minimum Length
                </label>
                <input
                  type="number"
                  value={settings.passwordPolicy?.minLength || 8}
                  onChange={(e) => handlePasswordPolicyChange('minLength', parseInt(e.target.value))}
                  className="input-field"
                  min="6"
                  max="20"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy?.requireUppercase || false}
                    onChange={(e) => handlePasswordPolicyChange('requireUppercase', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    Require Uppercase Letter
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy?.requireLowercase || false}
                    onChange={(e) => handlePasswordPolicyChange('requireLowercase', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    Require Lowercase Letter
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy?.requireNumber || false}
                    onChange={(e) => handlePasswordPolicyChange('requireNumber', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    Require Number
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy?.requireSpecialChar || false}
                    onChange={(e) => handlePasswordPolicyChange('requireSpecialChar', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    Require Special Character
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Remaining components will be in the next part due to file size...
// (RegistrationSettings, ChildSafetySettings, NotificationSettings, etc.)

// ========================================
// Registration Settings Component
// ========================================
function RegistrationSettings({ settings, onChange, onSave, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <FiUserCheck className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">User Registration Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowParentRegistration || false}
                onChange={(e) => handleChange('allowParentRegistration', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Allow Parent Registration
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Enable self-registration for parents/adopters</p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowOrphanageRegistration || false}
                onChange={(e) => handleChange('allowOrphanageRegistration', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Allow Orphanage Registration
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Enable self-registration for orphanages</p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification || false}
                onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Require Email Verification
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Users must verify email before accessing the system</p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireAdminApproval || false}
                onChange={(e) => handleChange('requireAdminApproval', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Require Admin Approval
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Admin must approve new registrations manually</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Default User Status
            </label>
            <select
              value={settings.defaultUserStatus || 'PENDING'}
              onChange={(e) => handleChange('defaultUserStatus', e.target.value)}
              className="input-field"
            >
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">Initial status for newly registered users</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// Child Safety Settings Component
// ========================================
function ChildSafetySettings({ settings, onChange, onSave, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <FiShield className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">Child Safety Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                AI Risk Threshold (0-100)
              </label>
              <input
                type="number"
                value={settings.aiRiskThreshold || 70}
                onChange={(e) => handleChange('aiRiskThreshold', parseInt(e.target.value))}
                className="input-field"
                min="0"
                max="100"
              />
              <p className="mt-1 text-xs text-slate-500">Minimum score to trigger risk alert</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                High Risk Score (0-100)
              </label>
              <input
                type="number"
                value={settings.highRiskScore || 80}
                onChange={(e) => handleChange('highRiskScore', parseInt(e.target.value))}
                className="input-field"
                min="0"
                max="100"
              />
              <p className="mt-1 text-xs text-slate-500">Threshold for high risk classification</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Medium Risk Score (0-100)
              </label>
              <input
                type="number"
                value={settings.mediumRiskScore || 50}
                onChange={(e) => handleChange('mediumRiskScore', parseInt(e.target.value))}
                className="input-field"
                min="0"
                max="100"
              />
              <p className="mt-1 text-xs text-slate-500">Threshold for medium risk classification</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Welfare Session Frequency (days)
              </label>
              <input
                type="number"
                value={settings.welfareSessionFrequency || 30}
                onChange={(e) => handleChange('welfareSessionFrequency', parseInt(e.target.value))}
                className="input-field"
                min="7"
                max="365"
              />
              <p className="mt-1 text-xs text-slate-500">How often welfare checks should occur</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Adoption Follow-up Interval (days)
              </label>
              <input
                type="number"
                value={settings.adoptionFollowUpInterval || 90}
                onChange={(e) => handleChange('adoptionFollowUpInterval', parseInt(e.target.value))}
                className="input-field"
                min="7"
                max="365"
              />
              <p className="mt-1 text-xs text-slate-500">Post-adoption follow-up frequency</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Emergency Alert Threshold (0-100)
              </label>
              <input
                type="number"
                value={settings.emergencyAlertThreshold || 90}
                onChange={(e) => handleChange('emergencyAlertThreshold', parseInt(e.target.value))}
                className="input-field"
                min="0"
                max="100"
              />
              <p className="mt-1 text-xs text-slate-500">Critical risk score requiring immediate action</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// Notification Settings Component
// ========================================
function NotificationSettings({ settings, onChange, onSave, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  const handleEventToggle = (event, enabled) => {
    onChange({
      ...settings,
      events: {
        ...(settings.events || {}),
        [event]: enabled
      }
    });
  };

  const notificationEvents = [
    { id: 'newChildRegistration', label: 'New Child Registration' },
    { id: 'adoptionRequest', label: 'Adoption Request Submitted' },
    { id: 'adoptionApproved', label: 'Adoption Approved' },
    { id: 'highRiskAlert', label: 'High Risk Child Alert' },
    { id: 'missedWelfareSession', label: 'Missed Welfare Session' },
    { id: 'documentExpiring', label: 'Document Expiring Soon' },
    { id: 'verificationPending', label: 'Verification Pending' },
    { id: 'emergencyCase', label: 'Emergency Case' },
  ];

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <FiBell className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">Notification Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notification Channels</h3>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications || false}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Email Notifications
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotifications || false}
                onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                SMS Notifications
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications || false}
                onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Push Notifications
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.inAppNotifications || false}
                onChange={(e) => handleChange('inAppNotifications', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                In-App Notifications
              </span>
            </label>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Event Notifications</h3>
            <p className="text-xs text-slate-500 mb-4">Enable or disable notifications for specific events</p>
            
            <div className="space-y-3">
              {notificationEvents.map((event) => (
                <label key={event.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.events?.[event.id] || false}
                    onChange={(e) => handleEventToggle(event.id, e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    {event.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// Alert Settings Component
// ========================================
function AlertSettings({ settings, onChange, onSave, saving }) {
  const handleAlertToggle = (alert, enabled) => {
    onChange({
      ...settings,
      [alert]: enabled
    });
  };

  const alertTypes = [
    { id: 'highRiskChild', label: 'High Risk Child', description: 'Alert when a child is flagged as high risk' },
    { id: 'missedWelfareSession', label: 'Missed Welfare Session', description: 'Alert when welfare check is overdue' },
    { id: 'failedAISession', label: 'Failed AI Session', description: 'Alert when AI analysis fails or shows concerning patterns' },
    { id: 'rejectedVerification', label: 'Rejected Verification', description: 'Alert when parent verification is rejected' },
    { id: 'missedAttendance', label: 'Missed Attendance', description: 'Alert for consecutive attendance misses' },
    { id: 'emergencyCase', label: 'Emergency Case', description: 'Critical alert requiring immediate intervention' },
    { id: 'expiredDocuments', label: 'Expired Documents', description: 'Alert when important documents expire' },
  ];

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
              <FiAlertTriangle className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">Alert Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure automatic alerts for critical events requiring immediate attention
          </p>

          <div className="space-y-4">
            {alertTypes.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={settings[alert.id] || false}
                  onChange={(e) => handleAlertToggle(alert.id, e.target.checked)}
                  className="checkbox mt-1"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    {alert.label}
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// AI Settings Component
// ========================================
function AISettings({ settings, onChange, onSave, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <FiCpu className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">AI Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAI || false}
                onChange={(e) => handleChange('enableAI', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Enable AI Features
              </span>
            </label>
            <p className="ml-6 mt-1 text-xs text-slate-500">Master switch for all AI functionality</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Default AI Model
            </label>
            <select
              value={settings.defaultAIModel || 'gemini-1.5-flash'}
              onChange={(e) => handleChange('defaultAIModel', e.target.value)}
              className="input-field"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">AI model to use for analysis</p>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">AI Capabilities</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.riskAnalysis || false}
                  onChange={(e) => handleChange('riskAnalysis', e.target.checked)}
                  className="checkbox"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  Risk Analysis
                </span>
              </label>
              <p className="ml-6 text-xs text-slate-500">Analyze child safety risk patterns</p>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.faceRecognition || false}
                  onChange={(e) => handleChange('faceRecognition', e.target.checked)}
                  className="checkbox"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  Face Recognition
                </span>
              </label>
              <p className="ml-6 text-xs text-slate-500">Use facial recognition for attendance and verification</p>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.conversationAnalysis || false}
                  onChange={(e) => handleChange('conversationAnalysis', e.target.checked)}
                  className="checkbox"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  Conversation Analysis
                </span>
              </label>
              <p className="ml-6 text-xs text-slate-500">Analyze conversations for emotional distress indicators</p>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRiskDetection || false}
                  onChange={(e) => handleChange('autoRiskDetection', e.target.checked)}
                  className="checkbox"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  Auto Risk Detection
                </span>
              </label>
              <p className="ml-6 text-xs text-slate-500">Automatically detect and flag risk patterns</p>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRecommendations || false}
                  onChange={(e) => handleChange('autoRecommendations', e.target.checked)}
                  className="checkbox"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  Auto Recommendations
                </span>
              </label>
              <p className="ml-6 text-xs text-slate-500">Generate AI-powered intervention recommendations</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// Report Settings Component
// ========================================
function ReportSettings({ settings, onChange, onSave, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
              <FiFileText className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">Report Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Default Report Format
            </label>
            <select
              value={settings.defaultFormat || 'PDF'}
              onChange={(e) => handleChange('defaultFormat', e.target.value)}
              className="input-field"
            >
              <option value="PDF">PDF</option>
              <option value="EXCEL">Excel</option>
              <option value="CSV">CSV</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">Default format for generated reports</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Report Retention (days)
            </label>
            <input
              type="number"
              value={settings.reportRetention || 365}
              onChange={(e) => handleChange('reportRetention', parseInt(e.target.value))}
              className="input-field"
              min="30"
              max="3650"
            />
            <p className="mt-1 text-xs text-slate-500">How long to store generated reports</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoMonthlyReports || false}
                onChange={(e) => handleChange('autoMonthlyReports', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Automatic Monthly Reports
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Generate comprehensive monthly reports automatically</p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoWeeklyReports || false}
                onChange={(e) => handleChange('autoWeeklyReports', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Automatic Weekly Reports
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Generate summary reports every week</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// Backup Settings Component
// ========================================
function BackupSettings({ settings, onChange, onSave, onBackup, onRestore, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  const [backupList, setBackupList] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);
      // This would be a real API call in production
      // const backups = await settingsService.getBackups();
      // setBackupList(backups);
    } catch (err) {
      console.error('Failed to load backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
              <FiDatabase className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">Backup Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Backup Schedule
            </label>
            <select
              value={settings.schedule || 'DAILY'}
              onChange={(e) => handleChange('schedule', e.target.value)}
              className="input-field"
            >
              <option value="HOURLY">Hourly</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="MANUAL">Manual Only</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">Automatic database backup frequency</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Retention Days
            </label>
            <input
              type="number"
              value={settings.retentionDays || 30}
              onChange={(e) => handleChange('retentionDays', parseInt(e.target.value))}
              className="input-field"
              min="7"
              max="365"
            />
            <p className="mt-1 text-xs text-slate-500">How long to keep backup files</p>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Manual Operations</h3>
            
            <div className="flex gap-3 mb-6">
              <Button
                icon={FiDatabase}
                variant="secondary"
                onClick={onBackup}
              >
                Create Backup Now
              </Button>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Available Backups</h4>
              {loadingBackups ? (
                <p className="text-sm text-slate-500">Loading backups...</p>
              ) : backupList.length === 0 ? (
                <p className="text-sm text-slate-500">No backups available</p>
              ) : (
                <div className="space-y-2">
                  {backupList.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{backup.name}</p>
                        <p className="text-xs text-slate-500">{backup.date}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onRestore(backup.id)}
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// Audit Settings Component
// ========================================
function AuditSettings({ settings, onChange, onSave, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <FiActivity className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">Audit Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auditLogging || false}
                onChange={(e) => handleChange('auditLogging', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Enable Audit Logging
              </span>
            </label>
            <p className="ml-6 mt-1 text-xs text-slate-500">Log all system activities for compliance</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.loginLogs || false}
                onChange={(e) => handleChange('loginLogs', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">
                Login/Logout Logs
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Track all user authentication events</p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.actionLogs || false}
                onChange={(e) => handleChange('actionLogs', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">
                Action Logs
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Track all data modifications and sensitive operations</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Log Retention Period (days)
            </label>
            <input
              type="number"
              value={settings.retentionPeriod || 365}
              onChange={(e) => handleChange('retentionPeriod', parseInt(e.target.value))}
              className="input-field"
              min="30"
              max="3650"
            />
            <p className="mt-1 text-xs text-slate-500">How long to keep audit logs</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// Security Settings Component
// ========================================
function SecuritySettings({ settings, onChange, onSave, saving }) {
  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
  };

  const handleAllowedOriginsChange = (value) => {
    // Convert comma-separated string to array
    const origins = value.split(',').map(o => o.trim()).filter(Boolean);
    handleChange('allowedOrigins', origins);
  };

  const handleAllowedFileTypesChange = (value) => {
    const types = value.split(',').map(t => t.trim()).filter(Boolean);
    handleChange('allowedFileTypes', types);
  };

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2.5">
            <div className="section-card-icon bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <FiShield className="h-3.5 w-3.5" />
            </div>
            <h2 className="section-card-title">Security Configuration</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.helmet || false}
                onChange={(e) => handleChange('helmet', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Enable Helmet (Security Headers)
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Add security headers to all responses</p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.rateLimiter || false}
                onChange={(e) => handleChange('rateLimiter', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Enable Rate Limiting
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Protect against brute force and DDoS attacks</p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cors || false}
                onChange={(e) => handleChange('cors', e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Enable CORS
              </span>
            </label>
            <p className="ml-6 text-xs text-slate-500">Allow cross-origin resource sharing</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Allowed Origins (comma-separated)
            </label>
            <textarea
              value={(settings.allowedOrigins || []).join(', ')}
              onChange={(e) => handleAllowedOriginsChange(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="https://example.com, https://app.example.com"
            />
            <p className="mt-1 text-xs text-slate-500">Domains allowed to access the API</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Allowed File Types (comma-separated)
            </label>
            <textarea
              value={(settings.allowedFileTypes || []).join(', ')}
              onChange={(e) => handleAllowedFileTypesChange(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="pdf, jpg, jpeg, png, doc, docx"
            />
            <p className="mt-1 text-xs text-slate-500">File types allowed for upload</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Maximum Upload Size (MB)
            </label>
            <input
              type="number"
              value={settings.maxUploadSize || 10}
              onChange={(e) => handleChange('maxUploadSize', parseInt(e.target.value))}
              className="input-field"
              min="1"
              max="100"
            />
            <p className="mt-1 text-xs text-slate-500">Maximum file size for uploads</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              icon={FiSave}
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
