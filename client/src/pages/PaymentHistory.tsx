import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { DollarSign, Calendar, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

interface PaymentRecord {
  clientId: number;
  clientName: string;
  amount: number;
  status: string;
  dueDate: Date | null;
  paidDate: Date | null;
  daysOverdue: number;
}

export default function PaymentHistory() {
  // Buscar todos os clientes
  const { data: allClients = [] } = trpc.clients.list.useQuery();

  // Processar histórico de pagamentos
  const paymentHistory = useMemo(() => {
    const payments: PaymentRecord[] = [];

    allClients.forEach((client: any) => {
      if (client.financialData?.totalAmount) {
        const dueDate = client.financialData.dueDate ? new Date(client.financialData.dueDate) : null;
        const paidDate = client.financialData.paidDate ? new Date(client.financialData.paidDate) : null;

        let daysOverdue = 0;
        if (dueDate && !paidDate) {
          const today = new Date();
          daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        payments.push({
          clientId: client.id,
          clientName: client.name,
          amount: parseFloat(client.financialData.totalAmount || "0"),
          status: client.financialData.paymentStatus,
          dueDate,
          paidDate,
          daysOverdue: Math.max(0, daysOverdue),
        });
      }
    });

    // Ordenar por data de pagamento (mais recentes primeiro)
    return payments.sort((a, b) => {
      const dateA = a.paidDate || a.dueDate || new Date(0);
      const dateB = b.paidDate || b.dueDate || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [allClients]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const paid = paymentHistory.filter(p => p.status === "paid");
    const pending = paymentHistory.filter(p => p.status === "pending" || p.status === "partial");
    const overdue = paymentHistory.filter(p => p.status === "overdue");

    return {
      totalPayments: paymentHistory.length,
      paidAmount: paid.reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
      overdueAmount: overdue.reduce((sum, p) => sum + p.amount, 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
    };
  }, [paymentHistory]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "partial":
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: "Pago",
      pending: "Pendente",
      partial: "Parcialmente Pago",
      overdue: "Vencido",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-50 border-green-200",
      pending: "bg-yellow-50 border-yellow-200",
      partial: "bg-blue-50 border-blue-200",
      overdue: "bg-red-50 border-red-200",
    };
    return colors[status] || "bg-gray-50 border-gray-200";
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Histórico de Pagamentos</h1>
        <p className="text-muted-foreground mt-2">Timeline completa de pagamentos dos clientes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Pagamentos</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">{stats.totalPayments}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pagos</p>
              <p className="text-2xl font-bold mt-2 text-green-600">R$ {stats.paidAmount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.paidCount} transações</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold mt-2 text-yellow-600">R$ {stats.pendingAmount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.pendingCount} transações</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vencidos</p>
              <p className="text-2xl font-bold mt-2 text-red-600">R$ {stats.overdueAmount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.overdueCount} transações</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Timeline de Pagamentos</h2>
        <div className="space-y-4">
          {paymentHistory.length > 0 ? (
            paymentHistory.map((payment, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getStatusColor(payment.status)} flex items-start gap-4`}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center pt-1">
                  {getStatusIcon(payment.status)}
                  {index < paymentHistory.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-300 mt-2"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{payment.clientName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getStatusLabel(payment.status)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold">R$ {payment.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap gap-6 mt-3 text-sm">
                    {payment.dueDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Vencimento: {format(payment.dueDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                    {payment.paidDate && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Pago em: {format(payment.paidDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                    {payment.daysOverdue > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-600 font-medium">
                          {payment.daysOverdue} dia{payment.daysOverdue !== 1 ? "s" : ""} vencido
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum histórico de pagamentos disponível</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
