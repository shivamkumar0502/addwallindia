import api from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/common/Loader";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

const AdminPayments = () => {
  const { data, loading } = useFetch(() => api.get("/payments/admin/all").then(r => r.data.data));

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0">
            <CardContent className="p-5">
              <p className="text-green-100 text-sm">Total GMV</p>
              <p className="text-3xl font-black mt-1">{formatCurrency(data.summary.totalGMV)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-brand-500 to-brand-700 text-white border-0">
            <CardContent className="p-5">
              <p className="text-orange-100 text-sm">Platform Commission</p>
              <p className="text-3xl font-black mt-1">{formatCurrency(data.summary.totalCommission)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments Table */}
      {loading ? <Loader className="py-20" size="lg" /> : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {["Client", "Owner", "Amount", "Commission", "Owner Payout", "Status", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.payments?.map(p => (
                    <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.client?.name}</p>
                        <p className="text-xs text-gray-400">{p.client?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.owner?.name}</p>
                        <p className="text-xs text-gray-400">{p.owner?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-brand-600 font-medium">{formatCurrency(p.platformFee)}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(p.ownerPayout)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${getStatusColor(p.status)}`}>{p.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default AdminPayments;
