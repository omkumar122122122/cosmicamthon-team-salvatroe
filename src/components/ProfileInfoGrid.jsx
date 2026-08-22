import { Briefcase, Building, Calendar, Hash, Mail, Phone } from "lucide-react";

function InfoField({ icon: Icon, label, value }) {
  return (
    <div className="field-block min-w-0">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="field-label">{label}</span>
      </div>
      <p className="field-value mt-2 truncate" title={value || "Not provided"}>{value || "Not provided"}</p>
    </div>
  );
}

export default function ProfileInfoGrid({ user }) {
  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 min-w-0">
      <InfoField icon={Hash}      label="Full Name"    value={user.name} />
      <InfoField icon={Mail}      label="Email"        value={user.email} />
      <InfoField icon={Phone}     label="Phone"        value={user.phone} />
      <InfoField icon={Hash}      label="Employee ID"  value={user.employeeId} />
      <InfoField icon={Building}  label="Department"   value={user.department} />
      <InfoField icon={Briefcase} label="Designation"  value={user.designation} />
      <InfoField icon={Calendar}  label="Joining Date" value={user.joiningDate} />
    </div>
  );
}
