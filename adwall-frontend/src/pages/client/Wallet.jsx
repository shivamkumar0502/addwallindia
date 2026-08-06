import { walletService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/common/Loader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

const Wallet = () => {
  const { data: wallet, loading: walletLoading } = useFetch(walletService.getWallet);
  const { data: txData, loading: txLoading } = useFetch(() => walletService.getTransactions({ limit: 20 }));

  if (walletLoading) return <Loader className="py-24" size="lg" />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-brand-500 to-brand-700 text-white border-0">
          <CardContent className="p-6">
            <p className="text-orange-100 text-sm mb-1">Available Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-sm mb-1 flex items-center gap-1"><Clock size={13} />Pending (Escrow)</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(wallet?.pendingBalance || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-sm mb-1">Total Earned / Spent</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency((wallet?.totalEarned || wallet?.totalSpent) || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Transaction History</CardTitle></CardHeader>
        <CardContent>
          {txLoading ? <Loader /> : !txData?.transactions?.length ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-3xl mb-2">💳</div>
              <p className="text-sm">Abhi koi transaction nahi hai</p>
            </div>
          ) : (
            <div className="space-y-3">
              {txData.transactions.map(tx => (
                <div key={tx._id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                      {tx.type === "credit"
                        ? <TrendingUp size={18} className="text-green-600" />
                        : <TrendingDown size={18} className="text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.createdAt)} • {tx.category.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-400">Bal: {formatCurrency(tx.balanceAfter)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default Wallet;
