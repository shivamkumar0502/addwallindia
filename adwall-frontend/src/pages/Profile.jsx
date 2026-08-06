import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Toast } from "@/components/ui/toast";
import useToast from "@/hooks/useToast";
import { Camera, User, Mail, Phone, Building, Lock, Trash2, CheckCircle } from "lucide-react";

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    mobile: user?.mobile?.startsWith("pending_") ? "" : (user?.mobile || ""),
    companyName: user?.businessDetails?.companyName || "",
    agencyName: user?.businessDetails?.agencyName || "",
    address: user?.businessDetails?.address || "",
  });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (avatarFile) fd.append("avatar", avatarFile);
      const { data } = await api.patch("/profile/update", fd, { headers: { "Content-Type": "multipart/form-data" } });
      updateUser(data.data);
      showToast("Profile updated!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e?.preventDefault();
    if (!passForm.currentPassword) {
      showToast("Current password enter karo", "error"); return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      showToast("New passwords match nahi kar rahe", "error"); return;
    }
    if (passForm.newPassword.length < 6) {
      showToast("Password minimum 6 characters hona chahiye", "error"); return;
    }
    if (passForm.currentPassword === passForm.newPassword) {
      showToast("Naya password purane se different hona chahiye", "error"); return;
    }
    setPassLoading(true);
    try {
      const response = await api.patch("/profile/change-password", {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      showToast(response.data?.message || "Password successfully changed!", "success");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg = err.response?.data?.message || "Password change failed. Current password check karo.";
      showToast(msg, "error");
    } finally { setPassLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Kya aap sure hain? Ye action undo nahi hoga!")) return;
    const password = window.prompt("Confirm karne ke liye password enter karo:");
    if (!password) return;
    setDeleteLoading(true);
    try {
      await api.delete("/profile/delete", { data: { password } });
      await logout();
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally { setDeleteLoading(false); }
  };

  const roleLabel = { client: "Advertiser", owner: "Space Owner", admin: "Administrator" };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {toast && <Toast {...toast} onClose={() => {}} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Account details aur settings manage karo</p>
      </div>

      {/* Avatar + Role */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar src={avatarPreview} alt={user?.name} fallback={user?.name?.[0]?.toUpperCase()} className="h-20 w-20 text-2xl" />
              <button onClick={() => fileRef.current.click()}
                className="absolute bottom-0 right-0 h-7 w-7 bg-brand-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-brand-600">
                <Camera size={13} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full font-medium capitalize">{roleLabel[user?.role] || user?.role}</span>
                {user?.role === "owner" && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${user?.kycStatus === "verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    KYC {user?.kycStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User size={16} />Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Aapka naam" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9 bg-gray-50" value={user?.email} disabled />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email change nahi ho sakta</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile Number</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="10-digit mobile" type="tel" />
            </div>
          </div>

          {/* Owner-specific fields */}
          {user?.role === "owner" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Company Name</label>
                  <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="ABC Pvt Ltd" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Agency Name</label>
                  <Input value={form.agencyName} onChange={e => setForm(f => ({ ...f, agencyName: e.target.value }))} placeholder="XYZ Advertising" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Business Address</label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
              </div>
            </>
          )}

          <Button onClick={handleProfileSave} disabled={profileLoading} className="w-full">
            {profileLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      {user?.authProvider !== "google" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock size={16} />Change Password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Current Password</label>
              <Input type="password" value={passForm.currentPassword} onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">New Password</label>
              <Input type="password" value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm New Password</label>
              <Input type="password" value={passForm.confirmPassword} onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" />
            </div>
            <Button onClick={handlePasswordChange} disabled={passLoading} variant="outline" className="w-full">
              {passLoading ? "Changing..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-base flex items-center gap-2 text-red-600"><Trash2 size={16} />Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">Account delete karne se saara data permanently remove ho jayega. Ye action undo nahi ho sakta.</p>
          <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete My Account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
export default Profile;
