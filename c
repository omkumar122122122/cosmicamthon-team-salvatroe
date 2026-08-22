import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar, FiCamera, FiCheckCircle, FiFileText,
  FiMapPin, FiSave, FiUser, FiAlertCircle
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb.jsx";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Modal from "../components/Modal.jsx";
import ToastContainer from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../hooks/useToast.js";
import { childrenService } from "../services/childrenService.js";
import { orphanagesService } from "../services/orphanagesService.js";
import { roleLabels } from "../utils/constants.js";
import { classNames } from "../utils/formatters.js";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const foundConditions = ["Found alone","Rescued by police","Referred by hospital","Transferred from agency","Surrendered safely"];

const selectCls = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-civic-500 focus:ring-2 focus:ring-civic-500/15 disabled:bg-slate-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/80 dark:text-white";
const textareaCls = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-civic-500 focus:ring-2 focus:ring-civic-500/15 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white";

function RegisterChild() {
  const { user } = useAuth();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState("");
  const [savedRecord, setSavedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orphanages, setOrphanages] = useState([]);
  const [loadingOrphanages, setLoadingOrphanages] = useState(true);

  // For ORPHANAGE users, orphanage is auto-assigned by backend
  // For ADMIN users, they need to select an orphanage
  const isOrphanageUser = user?.role === 'orphanage';

  useEffect(() => {
    // Only load orphanages for ADMIN users
    if (user?.role === 'admin') {
      const loadOrphanages = async () => {
        try {
          const response = await orphanagesService.getAll({ limit: 100 });
          const payload = response.data ?? response;
          const list = Array.isArray(payload) ? payload : (payload.data || []);
          setOrphanages(list);
        } catch (err) {
          console.error("Failed to load orphanages:", err);
          showError("Failed to load orphanage list");
        } finally {
          setLoadingOrphanages(false);
        }
      };
      loadOrphanages();
    } else {
      setLoadingOrphanages(false);
    }
  }, [user?.role]);

  const { register, handleSubmit, reset, formState, watch } = useForm({
    defaultValues: {
      orphanage: !isOrphanageUser ? "" : undefined,
      risk: "Low",
      foundCondition: foundConditions[0],
    },
  });

  const selectedPhoto = watch("photo");
  const photoName = selectedPhoto?.[0]?.name;
  const recordId = useMemo(() => `CH-${Math.floor(1000 + Math.random() * 9000)}`, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    setPhotoPreview(file ? URL.createObjectURL(file) : "");
  };

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);

      // Map form values to API format
      const childData = {
        firstName: values.name.split(' ')[0],
        lastName: values.name.split(' ').slice(1).join(' ') || undefined,
        approximateAge: parseInt(values.age),
        gender: values.gender.toUpperCase(),
        bloodGroup: values.bloodGroup.replace('+', '_POSITIVE').replace('-', '_NEGATIVE'),
        admissionDate: values.admissionDate,
        foundLocation: values.foundLocation,
        entrySource: values.foundCondition,
        admissionReason: values.notes,
        distinguishingMarks: values.identificationMarks,
        healthStatus: 'UNKNOWN',
        specialNotes: values.medicalCondition,
      };

      // For ADMIN users, assign orphanage ID from selection
      if (user.role === 'admin' && values.orphanage) {
        const orphanage = orphanages.find(o => o.name === values.orphanage || o.id === values.orphanage);
        if (orphanage) {
          childData.orphanageId = orphanage.id;
        }
      }

      // For ORPHANAGE users, orphanage is auto-assigned by backend based on JWT token

      // Get photo file
      const photoFile = values.photo?.[0];

      // Call API
      const response = await childrenService.create(childData, photoFile);

      // Show success and redirect
      setSavedRecord({
        id: response.childCode,
        name: response.name,
        registeredBy: response.registeredBy,
      });
      
      showSuccess("Child registered successfully!");
      
      // Navigate to children list after successful registration
      setTimeout(() => {
        navigate(`/${user.role === 'admin' ? 'admin' : 'orphanage'}/children`);
      }, 1500);

      // Reset form
      reset({ 
        orphanage: !isOrphanageUser ? "" : undefined, 
        risk: "Low", 
        foundCondition: foundConditions[0] 
      });
      setPhotoPreview("");
    } catch (err) {
      showError(err.message || "Failed to register child");
      console.error("Error registering child:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <Breadcrumb items={[roleLabels[user.role], "Register Child"]} />

      {/* Page header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
          <div>
            <p className="section-eyebrow">New Child Intake</p>
            <h1 className="page-title mt-1">Register a Child</h1>
            <p className="page-subtitle">Capture identity, admission, rescue, health, and safety details for the child welfare record.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Draft ID</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">{recordId}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
        {/* Photo */}
        <FormSection title="Child Photo" desc="Upload a clear, recent photo for face recognition and identification." first>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              {photoPreview
                ? <img src={photoPreview} alt="Preview" className="h-full w-full object-cover rounded-2xl" />
                : <div className="flex flex-col items-center gap-1 text-slate-400"><FiCamera className="h-8 w-8" /><span className="text-xs">No photo</span></div>
              }
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Child Photo <span className="text-red-500">*</span></p>
              <input
                type="file" accept="image/*"
                className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-civic-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-civic-700 dark:text-slate-300"
                {...register("photo", { required: "Photo is required", onChange: handlePhotoChange })}
              />
              <p className="text-xs text-slate-400">{photoName || "PNG or JPG, max 5MB"}</p>
              {formState.errors.photo && <p className="flex items-center gap-1 text-xs font-medium text-red-600"><FiAlertCircle className="h-3.5 w-3.5" />{formState.errors.photo.message}</p>}
            </div>
          </div>
        </FormSection>

        {/* Identity */}
        <FormSection title="Identity Details" desc="Basic details used across child welfare records.">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Full Name" icon={FiUser} placeholder="Child's full name" error={formState.errors.name?.message} {...register("name", { required: "Name is required" })} />
            <FormInput label="Age" icon={FiUser} type="number" min="0" max="18" placeholder="0–18" error={formState.errors.age?.message} {...register("age", { required: "Age is required", min: { value: 0, message: "Must be 0 or above" }, max: { value: 18, message: "Must be 18 or below" } })} />
            <div>
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Gender <span className="text-red-500">*</span></label>
              <select className={selectCls} {...register("gender", { required: true })}>
                <option value="">Select gender</option>
                <option>Female</option><option>Male</option><option>Other</option>
              </select>
              {formState.errors.gender && <p className="mt-1 text-xs text-red-600">Gender is required</p>}
            </div>
            <div>
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Blood Group <span className="text-red-500">*</span></label>
              <select className={selectCls} {...register("bloodGroup", { required: true })}>
                <option value="">Select blood group</option>
                {bloodGroups.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </FormSection>

        {/* Admission */}
        <FormSection title="Admission Details" desc="Record how the child entered care and where they are assigned.">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Date of Admission" icon={FiCalendar} type="date" error={formState.errors.admissionDate?.message} {...register("admissionDate", { required: "Admission date is required" })} />
            {/* Orphanage selection only for ADMIN users */}
            {user?.role === 'admin' && (
              <div>
                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Assigned Orphanage</label>
                <select className={selectCls} disabled={loadingOrphanages} {...register("orphanage", { required: true })}>
                  <option value="">{loadingOrphanages ? "Loading orphanages..." : "Select orphanage"}</option>
                  {orphanages.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">How the Child Was Found</label>
              <select className={selectCls} {...register("foundCondition")}>
                {foundConditions.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <FormInput label="Found Location" icon={FiMapPin} placeholder="Area, city, police station" error={formState.errors.foundLocation?.message} {...register("foundLocation", { required: "Found location is required" })} />
          </div>
        </FormSection>

        {/* Health & Safety */}
        <FormSection title="Health and Safety" desc="Initial assessment details for care planning and AI risk review.">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Initial Risk Level</label>
              <select className={selectCls} {...register("risk")}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <FormInput label="Medical Condition" icon={FiFileText} placeholder="Stable, needs review, medication…" error={formState.errors.medicalCondition?.message} {...register("medicalCondition", { required: "Medical condition is required" })} />
            <div className="md:col-span-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Identification Marks</label>
              <textarea rows={3} placeholder="Birth marks, scars, clothing details…" className={textareaCls} {...register("identificationMarks", { required: true })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Rescue / Admission Notes</label>
              <textarea rows={3} placeholder="Brief verified intake notes…" className={textareaCls} {...register("notes", { required: true })} />
            </div>
          </div>
        </FormSection>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => reset()} disabled={submitting}>Clear Form</Button>
          <Button type="submit" icon={FiSave} loading={submitting}>Register Child</Button>
        </div>
      </form>

      {/* Success modal */}
      <Modal open={Boolean(savedRecord)} title="Child Registered Successfully" onClose={() => setSavedRecord(null)}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <FiCheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{savedRecord?.name} has been registered.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Record ID: <span className="font-bold text-slate-700 dark:text-slate-200">{savedRecord?.id}</span></p>
            <p className="mt-0.5 text-xs text-slate-400">Registered by {savedRecord?.registeredBy}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button icon={FiCheckCircle} onClick={() => setSavedRecord(null)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}

function FormSection({ title, desc, children: content, first = false }) {
  return (
    <section className={classNames(
      "grid gap-6 border-slate-100 py-6 dark:border-slate-800 xl:grid-cols-[260px_1fr]",
      first ? "" : "border-t"
    )}>
      <div>
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
      <div>{content}</div>
    </section>
  );
}

export default RegisterChild;