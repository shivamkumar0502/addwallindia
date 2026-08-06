import { notificationService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import Loader from "@/components/common/Loader";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCheck, BookOpen, CreditCard, CheckCircle, Megaphone, Star } from "lucide-react";

const TYPE_ICON = {
  booking: <BookOpen size={16} className="text-blue-500" />,
  payment: <CreditCard size={16} className="text-green-500" />,
  kyc: <CheckCircle size={16} className="text-orange-500" />,
  quote: <Megaphone size={16} className="text-purple-500" />,
  review: <Star size={16} className="text-yellow-500" />,
  system: <Bell size={16} className="text-gray-500" />,
  campaign: <Megaphone size={16} className="text-teal-500" />,
};

const Notifications = () => {
  const { data, loading, execute } = useFetch(() => notificationService.getAll({ limit: 50 }));

  const markAllRead = async () => {
    await notificationService.markAllRead();
    execute();
  };

  const markRead = async (id) => {
    await notificationService.markRead(id);
    execute();
  };

  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-brand-500 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 transition-colors">
            <CheckCheck size={16} />Mark all read
          </button>
        )}
      </div>

      {loading ? <Loader className="py-20" size="lg" /> : !data?.notifications?.length ? (
        <div className="text-center py-24">
          <Bell size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">Koi notification nahi hai abhi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.notifications.map(n => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm
                ${n.isRead ? "bg-white border-gray-100" : "bg-orange-50 border-orange-200"}`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0
                ${n.isRead ? "bg-gray-100" : "bg-white border border-orange-200"}`}>
                {TYPE_ICON[n.type] || TYPE_ICON.system}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
              </div>
              {!n.isRead && <div className="h-2.5 w-2.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Notifications;
