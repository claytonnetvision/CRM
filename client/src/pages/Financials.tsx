import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Financials() {
  const { user } = useAuth();
  const deleteFinancial = trpc.financials.delete.useMutation();

  // Buscar financeiros por status
  const { data: pendingFinancials = [] } = trpc.financials.getByPaymentStatus.useQuery("pending");
  const { data: paidFinancials = [] } = trpc.financials.getByPaymentStatus.useQuery("paid");
  const { data: overdueFinancials = [] } = trpc.financials.getByPaymentStatus.useQuery("overdue");
  const { data: partialFinancials = [] } = trpc.financials.getByPaymentStatus.useQuery("partial");

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este registro financeiro?")) {
      deleteFinancial.mutate(id);
    }
  };

  // Combinar todos e remover duplicatas
  const allFinancials = [
    ...pendingFinancials,
    ...paidFinancials,
    ...overdueFinancials,
    ...partialFinancials,
  ];

  const uniqueFinancials = Array.from(new Map(allFinancials.map((f: any) => [f.id, f])).values());

  // Calcular totais
  const totalRevenue = uniqueFinancials.reduce((sum: number, f: any) => sum + parseFloat(f.totalAmount || "0"), 0);
  const paidAmount = paidFinancials.reduce((sum: number, f: any) => sum + parseFloat(f.totalAmount || "0"), 0);
  const pendingAmount = pendingFinancials.reduce((sum: number, f: any) => sum + parseFloat(f.totalAmount || "0"), 0);
  const partialAmount = partialFinancials.reduce((sum: number, f: any) => sum + parseFloat(f.totalAmount || "0"), 0);
  const overdueAmount = overdueFinancials.reduce((sum: number, f: any) => sum + parseFloat(f.totalAmount || "0"), 0);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      paid: { label: "Pago", className: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="w-4 h-4" /> },
      partial: { label: "Parcialmente Pago", className: "bg-blue-100 text-blue-800", icon: <AlertCircle className="w-4 h-4" /> },
      overdue: { label: "Vencido", className: "bg-red-100 text-red-800", icon: <AlertCircle className="w-4 h-4" /> },
    };

    const config = statusMap[status] || statusMap.pending;
    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground mt-2">Resumo de receitas e pagamentos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold mt-2 text-blue-600">R$ {totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pago</p>
              <p className="text-2xl font-bold mt-2 text-green-600">R$ {paidAmount.toFixed(2)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendente</p>
              <p className="text-2xl font-bold mt-2 text-yellow-600">R$ {(pendingAmount + partialAmount).toFixed(2)}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vencido</p>
              <p className="text-2xl font-bold mt-2 text-red-600">R$ {overdueAmount.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Financials Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-minimal w-full">
            <thead className="bg-muted">
              <tr>
                <th>Cliente ID</th>
                <th>Valor por Usuário</th>
                <th>Usuários</th>
                <th>Total</th>
                <th>Status</th>
                <th>Vencimento</th>
                <th>Pago em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {uniqueFinancials.length > 0 ? (
                uniqueFinancials.map((financial: any) => (
                  <tr key={financial.id} className="hover:bg-muted/50 transition-colors">
                    <td className="font-medium">#{financial.clientId}</td>
                    <td>R$ {parseFloat(financial.pricePerUser || "0").toFixed(2)}</td>
                    <td className="text-center">{financial.contractedUsers}</td>
                    <td className="font-bold">R$ {parseFloat(financial.totalAmount || "0").toFixed(2)}</td>
                    <td>{getStatusBadge(financial.paymentStatus)}</td>
                    <td className="text-sm">
                      {financial.dueDate
                        ? format(new Date(financial.dueDate), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </td>
                    <td className="text-sm">
                      {financial.paidDate
                        ? format(new Date(financial.paidDate), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(financial.id)}
                        disabled={deleteFinancial.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum dado financeiro registrado
                  </td>
                </tr>
              )
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
