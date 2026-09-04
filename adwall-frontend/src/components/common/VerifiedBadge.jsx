import { BadgeCheck, Clock, ShieldAlert } from "lucide-react";

/**
 * VerifiedBadge — kisi bhi user ke naam ke saath uska KYC status dikhata hai.
 *
 * Owner ko advertiser ka verified status dikhne se bharosa banta hai
 * (aur ulta bhi — client ko owner ka).
 *
 * <VerifiedBadge status={booking.client?.kycStatus} />
 *
 * status: "verified" | "pending" | "not_submitted" | "rejected"
 */

const VARIANTS = {
  verified: {
    Icon: BadgeCheck,
    label: "Verified",
    cls: "bg-green-50 text-green-700 border-green-200",
    title: "KYC verified — ID aur documents check ho chuke hain",
  },
  pending: {
    Icon: Clock,
    label: "KYC pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    title: "KYC submit ho chuka hai, admin review kar raha hai",
  },
  not_submitted: {
    Icon: ShieldAlert,
    label: "Unverified",
    cls: "bg-gray-100 text-gray-500 border-gray-200",
    title: "Is user ne abhi KYC submit nahi kiya",
  },
  rejected: {
    Icon: ShieldAlert,
    label: "Unverified",
    cls: "bg-gray-100 text-gray-500 border-gray-200",
    title: "KYC verify nahi hua",
  },
};

const VerifiedBadge = ({ status, size = "sm", showUnverified = true }) => {
  const key = status || "not_submitted";
  const v = VARIANTS[key] || VARIANTS.not_submitted;

  // Chhoti jagah pe sirf verified dikhana ho to showUnverified={false}
  if (!showUnverified && key !== "verified") return null;

  const { Icon, label, cls, title } = v;
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  const icon = size === "xs" ? 10 : 12;

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${pad} ${cls}`}
    >
      <Icon size={icon} />
      {label}
    </span>
  );
};

export default VerifiedBadge;