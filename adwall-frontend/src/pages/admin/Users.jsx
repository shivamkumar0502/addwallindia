import { useState } from "react";
import api from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/common/Loader";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Search, Users, UserCheck, Building2, Shield } from "lucide-react";

const AdminUsers = () => {
  const [filters, setFilters] = useState({ role: "", kycStatus: "", search: "", page: 1 });

  const { data, loading, execute } = useFetch(
    () => api.get("/admin/users", { params: filters }).then(r => r.data.data),
    [filters]
  );

  const handle = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  const roleIcon = { client: <Users size={14} />, owner: <Building2 size={14} />, admin: <Shield size={14} /> };
  const roleColor = { client: "bg-purple-100 text-purple-700", owner: "bg-teal-100 text-teal-700", admin: "bg-red-100 text-red-700" };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total || 0} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Name, email ya mobile search karo..."
            value={filters.search}
            onChange={e => handle("search", e.target.value)}
          />
        </div>
        <Select value={filters.role} onChange={e => handle("role", e.target.value)} className="md:w-40">
          <option value="">All Roles</option>
          <option value="client">Client</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </Select>
        <Select value={filters.kycStatus} onChange={e => handle("kycStatus", e.target.value)} className="md:w-44">
          <option value="">All KYC Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Clients", icon: "👤", role: "client", color: "bg-purple-50 border-purple-100" },
          { label: "Owners", icon: "🏢", role: "owner", color: "bg-teal-50 border-teal-100" },
          { label: "Admins", icon: "🛡️", role: "admin", color: "bg-red-50 border-red-100" },
        ].map(({ label, icon, role, color }) => (
          <button
            key={role}
            onClick={() => handle("role", filters.role === role ? "" : role)}
            className={`p-4 rounded-xl border text-center hover:shadow-sm transition-all ${color} ${filters.role === role ? "ring-2 ring-brand-400" : ""}`}
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-sm font-semibold text-gray-700">{label}</div>
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? <Loader className="py-20" size="lg" /> : !data?.users?.length ? (
        <div className="text-center py-20">
          <UserCheck size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">Koi user nahi mila</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mobile</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">KYC</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {u.avatar
                              ? <img src={u.avatar} className="h-9 w-9 rounded-full object-cover" />
                              : u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${roleColor[u.role]}`}>
                          {roleIcon[u.role]}{u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.mobile?.startsWith("pending_") ? "—" : u.mobile}</td>
                      <td className="px-4 py-3">
                        {u.role === "owner" ? (
                          <Badge className={`text-xs ${getStatusColor(u.kycStatus)}`}>{u.kycStatus}</Badge>
                        ) : <span className="text-gray-300 text-xs">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.authProvider === "google" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-500"}`}>
                          {u.authProvider === "google" ? "🔵 Google" : "🔑 Email"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-gray-500">Page {data.page} of {data.totalPages}</p>
                <div className="flex gap-2">
                  <button
                    disabled={data.page <= 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                    className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-40"
                  >← Prev</button>
                  <button
                    disabled={data.page >= data.totalPages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                    className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-40"
                  >Next →</button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUsers;
