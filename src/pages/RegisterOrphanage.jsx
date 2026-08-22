import { useState, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiCamera, FiCheckSquare, FiCreditCard, FiFileText, FiHome, FiLock, FiMail, FiPhone, FiShield, FiUpload, FiUserCheck, FiUsers, FiRefreshCw } from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import Button from "../components/Button";
import Card from "../components/Card";
import FormInput from "../components/FormInput";
import { orphanagesService } from "../services/orphanagesService";
import { useToast } from "../hooks/useToast";

const facilities = [
  "Medical Room",
  "CCTV Surveillance",
  "School",
  "Playground",
  "Library",
  "Computer Lab",
  "Dining Hall",
  "Dormitory",
  "Security Guards",
  "Biometric Attendance"
];

export default function RegisterOrphanage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { register, handleSubmit, reset, formState, watch } = useForm({
    defaultValues: {
      organizationType: "NGO",
      country: "India",
      faceRecognitionEnabled: "No",
      cctvInstalled: "Yes",
      visitorFaceVerificationEnabled: "No",
      gpsTrackingAvailable: "No",
      emergencyAlertSystemEnabled: "Yes",
      password: "",
      confirmPassword: ""
    }
  });
  const errors = formState.errors;

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      setSuccess("");

      if (values.password !== values.confirmPassword) {
        showToast?.('Passwords do not match', 'error');
        setLoading(false);
        return;
      }

      // Extract files from form inputs
      const files = {
        profilePhoto: values.profilePhoto?.[0],
        registrationCertificate: values.registrationCertificate?.[0],
        ngoCertificate: values.ngoCertificate?.[0],
        governmentLicense: values.governmentLicense?.[0],
        administratorIdProof: values.administratorIdProof?.[0],
        panCard: values.panCard?.[0],
        addressProof: values.addressProof?.[0],
      };

      // Remove file objects from form data (they'll be sent separately)
      const formData = { ...values };
      delete formData.profilePhoto;
      delete formData.registrationCertificate;
      delete formData.ngoCertificate;
      delete formData.governmentLicense;
      delete formData.administratorIdProof;
      delete formData.panCard;
      delete formData.addressProof;

      const result = await orphanagesService.create(formData, files);
      
      const createdCode = result?.code || result?.data?.code || '';
      setSuccess(`✅ Orphanage registered successfully! ${createdCode ? `Code: ${createdCode}` : ''}`);
      showToast?.('Orphanage account created successfully', 'success');
      
      // Reset form after 2 seconds and navigate
      setTimeout(() => {
        reset();
        navigate('/admin/orphanages');
      }, 2000);
    } catch (error) {
      console.error('Failed to register orphanage:', error);
      showToast?.(error.message || 'Failed to register orphanage', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={["Admin", "Register Orphanage"]} />
      <div>
        <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white">Orphanage Registration</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Capture licensing, KYC, staff, facility, AI safety, and banking details for a new orphanage.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Section title="1. Organization Details">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormInput label="Orphanage Name *" icon={FiHome} error={errors.name?.message} {...register("name", { required: "Orphanage name is required" })} />
            <FormInput label="Registration Number *" icon={FiFileText} error={errors.registrationNumber?.message} {...register("registrationNumber", { required: "Registration number is required" })} />
            <FormInput label="Government License Number *" icon={FiShield} error={errors.governmentLicenseNumber?.message} {...register("governmentLicenseNumber", { required: "Government license number is required" })} />
            <FormInput label="Date of Establishment" type="date" icon={FiFileText} {...register("establishmentDate")} />
            <Select label="Type of Organization" icon={FiBriefcase} {...register("organizationType")}>
              <option value="NGO">NGO</option>
              <option value="GOVERNMENT">Government</option>
              <option value="TRUST">Trust</option>
              <option value="SOCIETY">Society</option>
              <option value="PRIVATE">Private</option>
            </Select>
            <FormInput label="Number of Children" type="number" icon={FiUsers} {...register("numberOfChildren")} />
            <FormInput label="Capacity" type="number" icon={FiUsers} {...register("capacity")} />
          </div>
        </Section>

        <Section title="2. Contact Information">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormInput label="Official Email *" type="email" icon={FiMail} error={errors.officialEmail?.message} {...register("officialEmail", { required: "Official email is required" })} />
            <FormInput label="Phone Number *" type="tel" icon={FiPhone} error={errors.phone?.message} {...register("phone", { required: "Phone number is required" })} />
            <FormInput label="Alternative Contact Number" type="tel" icon={FiPhone} {...register("alternativeContact")} />
            <FormInput label="Website (Optional)" type="url" icon={FiHome} {...register("website")} />
          </div>
        </Section>

        <Section title="3. Address">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormInput label="Country" icon={FiHome} {...register("country")} />
            <FormInput label="State *" icon={FiHome} error={errors.state?.message} {...register("state", { required: "State is required" })} />
            <FormInput label="District" icon={FiHome} {...register("district")} />
            <FormInput label="City *" icon={FiHome} error={errors.city?.message} {...register("city", { required: "City is required" })} />
            <FormInput label="PIN Code" icon={FiHome} {...register("pinCode")} />
          </div>
          <TextArea label="Full Address" icon={FiHome} {...register("fullAddress")} />
        </Section>

        <Section title="4. Administrator Details">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormInput label="Administrator Name *" icon={FiUserCheck} error={errors.administratorName?.message} {...register("administratorName", { required: "Administrator name is required" })} />
            <FormInput label="Designation" icon={FiBriefcase} {...register("designation")} />
            <FormInput label="Mobile Number *" type="tel" icon={FiPhone} error={errors.mobile?.message} {...register("mobile", { required: "Mobile number is required" })} />
            <FormInput label="Email" type="email" icon={FiMail} {...register("administratorEmail")} />
            <FormInput label="Profile Photo" type="file" icon={FiUpload} {...register("profilePhoto")} />
          </div>
        </Section>

        <Section title="5. Identity Verification (KYC)">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormInput label="Registration Certificate" type="file" icon={FiUpload} {...register("registrationCertificate")} />
            <FormInput label="NGO Certificate (if applicable)" type="file" icon={FiUpload} {...register("ngoCertificate")} />
            <FormInput label="Government License" type="file" icon={FiUpload} {...register("governmentLicense")} />
            <FormInput label="Administrator ID Proof" type="file" icon={FiUpload} {...register("administratorIdProof")} />
            <FormInput label="PAN Card (Organization)" type="file" icon={FiUpload} {...register("panCard")} />
            <FormInput label="GST Number (Optional)" icon={FiCreditCard} {...register("gstNumber")} />
            <FormInput label="Address Proof" type="file" icon={FiUpload} {...register("addressProof")} />
          </div>
        </Section>

        <Section title="7. Child Information Summary">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormInput label="Total Boys" type="number" icon={FiUsers} {...register("totalBoys")} />
            <FormInput label="Total Girls" type="number" icon={FiUsers} {...register("totalGirls")} />
            <FormInput label="Children Below 5 Years" type="number" icon={FiUsers} {...register("below5")} />
            <FormInput label="Children 5-12 Years" type="number" icon={FiUsers} {...register("age5To12")} />
            <FormInput label="Children Above 12 Years" type="number" icon={FiUsers} {...register("above12")} />
            <FormInput label="Special Needs Children" type="number" icon={FiUsers} {...register("specialNeeds")} />
          </div>
        </Section>

        <Section title="8. Staff Details">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormInput label="Total Staff" type="number" icon={FiUsers} {...register("totalStaff")} />
            <FormInput label="Caretakers" type="number" icon={FiUsers} {...register("caretakers")} />
            <FormInput label="Teachers" type="number" icon={FiUsers} {...register("teachers")} />
            <FormInput label="Medical Staff" type="number" icon={FiUsers} {...register("medicalStaff")} />
            <FormInput label="Security Guards" type="number" icon={FiShield} {...register("securityGuards")} />
            <FormInput label="Volunteers" type="number" icon={FiUsers} {...register("volunteers")} />
          </div>
        </Section>

        <Section title="9. Facilities Available">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {facilities.map((facility) => (
              <label key={facility} className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                <input type="checkbox" value={facility} className="h-4 w-4 rounded border-slate-300 text-civic-600" {...register("facilities")} />
                {facility}
              </label>
            ))}
          </div>
        </Section>

        <Section title="10. Emergency Contact">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormInput label="Contact Person" icon={FiUserCheck} {...register("emergencyContactPerson")} />
            <FormInput label="Mobile Number" type="tel" icon={FiPhone} {...register("emergencyMobile")} />
            <FormInput label="Email" type="email" icon={FiMail} {...register("emergencyEmail")} />
            <FormInput label="Relationship/Role" icon={FiBriefcase} {...register("emergencyRelationship")} />
          </div>
        </Section>

        <Section title="11. AI Safety Details">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Select label="AI Face Recognition Enabled" icon={FiCamera} {...register("faceRecognitionEnabled")}>
              <option>Yes</option>
              <option>No</option>
            </Select>
            <Select label="CCTV Cameras Installed" icon={FiCamera} {...register("cctvInstalled")}>
              <option>Yes</option>
              <option>No</option>
            </Select>
            <FormInput label="Number of Cameras" type="number" icon={FiCamera} {...register("numberOfCameras")} />
            <Select label="Visitor Face Verification Enabled" icon={FiShield} {...register("visitorFaceVerificationEnabled")}>
              <option>Yes</option>
              <option>No</option>
            </Select>
            <FormInput label="Child Attendance System" icon={FiCheckSquare} {...register("childAttendanceSystem")} />
            <Select label="GPS Tracking Available" icon={FiShield} {...register("gpsTrackingAvailable")}>
              <option>Yes</option>
              <option>No</option>
            </Select>
            <Select label="Emergency Alert System Enabled" icon={FiShield} {...register("emergencyAlertSystemEnabled")}>
              <option>Yes</option>
              <option>No</option>
            </Select>
          </div>
        </Section>

        <Section title="12. Bank Details (Optional)">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormInput label="Bank Name" icon={FiCreditCard} {...register("bankName")} />
            <FormInput label="Account Holder Name" icon={FiUserCheck} {...register("accountHolderName")} />
            <FormInput label="Account Number" icon={FiCreditCard} {...register("accountNumber")} />
            <FormInput label="IFSC Code" icon={FiCreditCard} {...register("ifscCode")} />
          </div>
        </Section>

        <Section title="13. Login Credentials">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput 
              label="Password *" 
              type="password" 
              icon={FiLock} 
              error={errors.password?.message}
              {...register("password", { 
                required: "Password is required",
                minLength: { value: 8, message: "Password must be at least 8 characters" }
              })} 
            />
            <FormInput 
              label="Confirm Password *" 
              type="password" 
              icon={FiLock} 
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", { 
                required: "Please confirm password",
                validate: (value) => value === watch("password") || "Passwords do not match"
              })} 
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            These credentials will be assigned to the new Orphanage account for login.
          </p>
        </Section>

        {success && (
          <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{success}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Login Email: <span className="font-medium text-slate-900 dark:text-white">{watch("officialEmail")}</span>
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => navigate('/admin/orphanages')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            icon={FiHome}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Orphanage Registration'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <Card>
      <h2 className="mb-5 text-lg font-extrabold text-slate-950 dark:text-white">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

const TextArea = forwardRef(function TextArea({ label, error, icon: Icon, ...props }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div className="mt-2 flex rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-inset focus-within:ring-civic-500 focus-within:ring-offset-0 dark:border-slate-700 dark:bg-slate-950">
        {Icon && <Icon className="mr-2 mt-1 h-4 w-4 text-slate-400" />}
        <textarea
          ref={ref}
          rows={3}
          className="w-full resize-y border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
          {...props}
        />
      </div>
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
});

const Select = forwardRef(function Select({ label, icon: Icon, children, ...props }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-civic-500 focus-within:ring-offset-0 dark:border-slate-700 dark:bg-slate-950">
        {Icon && <Icon className="mr-2 h-4 w-4 text-slate-400" />}
        <select ref={ref} className="min-h-11 w-full border-0 bg-transparent text-sm text-slate-950 outline-none dark:text-white" {...props}>
          {children}
        </select>
      </div>
    </label>
  );
});
