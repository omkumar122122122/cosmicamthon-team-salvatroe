import Button from "./Button";
import { FiEdit2, FiKey } from "react-icons/fi";

export default function ProfileActions({ onEdit, onChangePassword }) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-gray-100 px-5 py-4 dark:border-slate-800 sm:flex-row">
      <Button variant="primary" icon={FiEdit2} onClick={onEdit}>
        Edit Profile
      </Button>
      <Button variant="secondary" icon={FiKey} onClick={onChangePassword}>
        Change Password
      </Button>
    </div>
  );
}
