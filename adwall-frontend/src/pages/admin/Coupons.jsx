import { useState } from "react";
import api from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import useToast from "@/hooks/useToast";
import Loader from "@/components/common/Loader";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const AdminCoupons = () => {
  const { toast, showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", description: "", type: "percent", value: "",
    minOrderAmount: "", maxDiscount: "", usageLimit: "",
    userLimit: "1", validFrom: "", validUntil: "",
  });

  const { data: coupons, loading, execute: refetch } = useFetch(
    () => api.get("/coupons/admin").then(r => r.data.data)
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/coupons/admin", form);
      showToast("Coupon create ho gaya!", "success");
      setShowForm(false);
      setForm({ code:"", description:"", type:"percent", value:"", minOrderAmount:"", maxDiscount:"", usageLimit:"", userLimit:"1", validFrom:"", validUntil:"" });
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || "Create failed", "error");
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/coupons/admin/${id}/toggle`);
      refetch();
    } catch { showToast("Toggle failed", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete karna chahte ho?")) return;
    try {
      await api.delete(`/coupons/admin/${id}`);
      showToast("Coupon deleted", "success");
      refetch();
    } catch { showToast("Delete failed", "error"); }
  };

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast {...toast} onClose={() => {}} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />{showForm ? "Cancel" : "New Coupon"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-brand-200">
          <CardHeader><CardTitle className="text-base">New Coupon Create Karo</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-medium text-gray-700 mb-1 block">Coupon Code *</label>
                <Input placeholder="SUMMER20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Type *</label>
                <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Value * ({form.type === "percent" ? "%" : "₹"})</label>
                <Input type="number" placeholder={form.type === "percent" ? "10" : "500"} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                <Input placeholder="e.g. Summer Sale — 10% off" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Min Order (₹)</label>
                <Input type="number" placeholder="1000" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Max Discount (₹)</label>
                <Input type="number" placeholder="500" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Total Usage Limit</label>
                <Input type="number" placeholder="100" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Valid From *</label>
                <Input type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Valid Until *</label>
                <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} required />
              </div>
              <div className="col-span-2 md:col-span-3">
                <Button type="submit" className="w-full">Create Coupon</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Coupons List */}
      {loading ? <Loader className="py-20" /> : !coupons?.length ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">🏷️</div>
          <p>Koi coupon nahi hai. Create karo!</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {["Code", "Type", "Value", "Used", "Validity", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-gray-900">{c.code}</p>
                      <p className="text-xs text-gray-400">{c.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{c.type}</td>
                    <td className="px-4 py-3 font-semibold">{c.type === "percent" ? `${c.value}%` : `₹${c.value}`}</td>
                    <td className="px-4 py-3 text-gray-500">{c.usedCount}/{c.usageLimit || "∞"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p>{formatDate(c.validFrom)}</p>
                      <p>→ {formatDate(c.validUntil)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleToggle(c._id)} className="text-gray-400 hover:text-brand-500">
                          {c.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default AdminCoupons;
