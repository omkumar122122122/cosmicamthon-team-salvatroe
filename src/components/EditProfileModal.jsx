import { useState, useEffect } from "react";
import { FiSave, FiX } from "react-icons/fi";
import Button from "./Button";
import Modal, { ModalFooter } from "./Modal";
import { classNames } from "../utils/formatters";

export default function EditProfileModal({ isOpen, onClose, user, onSave, loading: parentLoading }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        department: user.department || "",
        avatar: user.avatar || "",
      });
    }
  }, [user, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (formData.phone && !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const isLoading = loading || parentLoading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={classNames(
                "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white",
                "focus:border-civic-500 focus:ring-2 focus:ring-civic-500/10",
                errors.firstName && "border-red-500"
              )}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={classNames(
                "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white",
                "focus:border-civic-500 focus:ring-2 focus:ring-civic-500/10",
                errors.lastName && "border-red-500"
              )}
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={classNames(
              "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white",
              "focus:border-civic-500 focus:ring-2 focus:ring-civic-500/10",
              errors.phone && "border-red-500"
            )}
            placeholder="Enter phone number"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Department (Optional)
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-civic-500 focus:ring-2 focus:ring-civic-500/10"
            placeholder="Enter department"
            disabled
          />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Department is managed by admin and cannot be changed
          </p>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={FiSave} loading={isLoading}>
            Save Changes
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}