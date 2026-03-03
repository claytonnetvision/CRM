import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign, Calendar, CheckCircle, AlertCircle, Clock,
  Plus, RefreshCw, ChevronDown, ChevronUp, Zap
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: "Pendente",  color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="w-3 h-3" /> },
  partial:  { label: "Parcial",   color: "bg-blue-100 text-blue-800 border-blue-200",       icon: <ChevronDown className="w-3 h-3" /> },
  paid:     { label: "Pago",      color: "bg-green-100 text-green-800 border-green-200",    icon: <CheckCircle className="w-3 h-3" /> },
  overdue:  { label: "Vencido",   color: "bg-red-100 text-red-800 border-red-200",          icon: <AlertCircle className="w-3 h-3" /> },
};

function formatCurrency(value: string | number | null | undefined) {
  const num = parseFloat(String(value || "0"));
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function Payments() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterStatus, setFilterStatus] = useState("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState<any>(null);
  const [showGenerateAllModal, setShowGenerateAllModal] = useState(false);

  // Form de geração manual
  const [genForm, setGenForm] = useState({
    clientId: "",
    pricePerUser: "",
    contractedUsers: "",
    dueDate: "",
    notes: "",
  });

  // Form de marcar como pago
  const [paidForm, setPaidForm] = useState({
    paidAmount: "",
    paidDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const utils = trpc.useUtils();

  // Buscar cobranças do mês selecionado
  const { data: payments = [], isLoading } = trpc.monthlyPayments.list.useQuery({
    referenceMonth: selectedMonth,
    paymentStatus: filterStatus === "all" ? undefined : filterStatus,
  });

  // Buscar clientes contratados para o select
  const { data: allClients = [] } = trpc.clients.list.useQuery({ status: "contracted" });

  // Mutações
  const generateMutation = trpc.monthlyPayments.generate.useMutation({
    onSuccess: () => {
      toast.success("Cobrança gerada com sucesso!");
      utils.monthlyPayments.list.invalidate();
      setShowGenerateModal(false);
      setGenForm({ clientId: "", pricePerUser: "", contractedUsers: "", dueDate: "", notes: "" });
    },
    onError: (err) => toast.error(err.message),
  });

  const generateAllMutation = trpc.monthlyPayments.generateAll.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.generated} cobranças geradas! ${result.skipped} ignoradas.`);
      utils.monthlyPayments.list.invalidate();
      setShowGenerateAllModal(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const markAsPaidMutation = trpc.monthlyPayments.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      utils.monthlyPayments.list.invalidate();
      setShowMarkPaidModal(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = trpc.monthlyPayments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.monthlyPayments.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Estatísticas do mês
  const stats = useMemo(() => {
    const paid = payments.filter((p: any) => p.paymentStatus === "paid");
    const pending = payments.filter((p: any) => p.paymentStatus === "pending");
    const overdue = payments.filter((p: any) => p.paymentStatus === "overdue");
    const partial = payments.filter((p: any) => p.paymentStatus === "partial");

    return {
      total: payments.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount || "0"), 0),
      received: paid.reduce((sum: number, p: any) => sum + parseFloat(p.paidAmount || p.totalAmount || "0"), 0),
      pending: pending.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount || "0"), 0),
      overdue: overdue.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount || "0"), 0),
      paidCount: paid.length,
      pendingCount: pending.length + partial.length,
      overdueCount: overdue.length,
      totalCount: payments.length,
    };
  }, [payments]);

  // Gerar lista de meses para seleção
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = -2; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = format(d, "MMMM yyyy", { locale: ptBR });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  }, []);

  const handleGenerate = () => {
    if (!genForm.clientId || !genForm.pricePerUser || !genForm.contractedUsers || !genForm.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    generateMutation.mutate({
      clientId: parseInt(genForm.clientId),
      referenceMonth: selectedMonth,
      pricePerUser: parseFloat(genForm.pricePerUser),
      contractedUsers: parseInt(genForm.contractedUsers),
      dueDate: genForm.dueDate,
      notes: genForm.notes || undefined,
    });
  };

  const handleMarkAsPaid = () => {
    if (!showMarkPaidModal) return;
    markAsPaidMutation.mutate({
      id: showMarkPaidModal.id,
      paidAmount: paidForm.paidAmount ? parseFloat(paidForm.paidAmount) : undefined,
      paidDate: paidForm.paidDate,
      notes: paidForm.notes || undefined,
    });
  };

  const handleMarkOverdue = (id: number) => {
    updateStatusMutation.mutate({ id, paymentStatus: "overdue" });
  };

  // Buscar nome do cliente pelo ID
  const getClientName = (clientId: number) => {
    const client = allClients.find((c: any) => c.id === clientId);
    return client ? `${client.name} - ${client.boxName}` : `Cliente #${clientId}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobranças Mensais</h1>
          <p className="text-muted-foreground text-sm">Gerencie as mensalidades dos BOX contratados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGenerateAllModal(true)} className="gap-2">
            <Zap className="w-4 h-4" />
            Gerar Todas
          </Button>
          <Button onClick={() => setShowGenerateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Cobrança
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-center flex-wrap">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-3 h-3" /> Total do Mês
            </div>
            <div className="text-xl font-bold">{formatCurrency(stats.total)}</div>
            <div className="text-xs text-muted-foreground">{stats.totalCount} cobranças</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-600 text-xs mb-1">
              <CheckCircle className="w-3 h-3" /> Recebido
            </div>
            <div className="text-xl font-bold text-green-700">{formatCurrency(stats.received)}</div>
            <div className="text-xs text-muted-foreground">{stats.paidCount} pagos</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-600 text-xs mb-1">
              <Clock className="w-3 h-3" /> Pendente
            </div>
            <div className="text-xl font-bold text-yellow-700">{formatCurrency(stats.pending)}</div>
            <div className="text-xs text-muted-foreground">{stats.pendingCount} pendentes</div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-600 text-xs mb-1">
              <AlertCircle className="w-3 h-3" /> Vencido
            </div>
            <div className="text-xl font-bold text-red-700">{formatCurrency(stats.overdue)}</div>
            <div className="text-xs text-muted-foreground">{stats.overdueCount} vencidos</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de cobranças */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Cobranças de {monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando cobranças...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground font-medium">Nenhuma cobrança para este mês</p>
              <p className="text-muted-foreground text-sm mt-1">Clique em "Gerar Todas" para criar cobranças automáticas para todos os BOX contratados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">BOX / Cliente</th>
                    <th className="text-right py-2 pr-4 font-medium">Usuários</th>
                    <th className="text-right py-2 pr-4 font-medium">Valor/Usuário</th>
                    <th className="text-right py-2 pr-4 font-medium">Total</th>
                    <th className="text-center py-2 pr-4 font-medium">Vencimento</th>
                    <th className="text-center py-2 pr-4 font-medium">Status</th>
                    <th className="text-center py-2 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment: any) => {
                    const cfg = statusConfig[payment.paymentStatus] || statusConfig.pending;
                    const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
                    const isOverdue = dueDate && dueDate < new Date() && payment.paymentStatus === "pending";
                    return (
                      <tr key={payment.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{getClientName(payment.clientId)}</div>
                          {payment.notes && <div className="text-xs text-muted-foreground">{payment.notes}</div>}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">{payment.contractedUsers}</td>
                        <td className="py-3 pr-4 text-right font-mono">{formatCurrency(payment.pricePerUser)}</td>
                        <td className="py-3 pr-4 text-right font-bold">{formatCurrency(payment.totalAmount)}</td>
                        <td className="py-3 pr-4 text-center">
                          {dueDate ? (
                            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                              {format(dueDate, "dd/MM/yyyy")}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <Badge variant="outline" className={`gap-1 text-xs ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            {payment.paymentStatus !== "paid" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                onClick={() => {
                                  setShowMarkPaidModal(payment);
                                  setPaidForm({
                                    paidAmount: payment.totalAmount,
                                    paidDate: new Date().toISOString().split("T")[0],
                                    notes: "",
                                  });
                                }}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Recebido
                              </Button>
                            )}
                            {isOverdue && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                                onClick={() => handleMarkOverdue(payment.id)}
                              >
                                Vencido
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Gerar cobrança manual */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Cobrança Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>BOX / Cliente *</Label>
              <Select value={genForm.clientId} onValueChange={v => setGenForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente contratado" />
                </SelectTrigger>
                <SelectContent>
                  {allClients.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name} - {c.boxName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor por Usuário (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 15.00"
                  value={genForm.pricePerUser}
                  onChange={e => setGenForm(f => ({ ...f, pricePerUser: e.target.value }))}
                />
              </div>
              <div>
                <Label>Qtd. Usuários *</Label>
                <Input
                  type="number"
                  placeholder="Ex: 30"
                  value={genForm.contractedUsers}
                  onChange={e => setGenForm(f => ({ ...f, contractedUsers: e.target.value }))}
                />
              </div>
            </div>
            {genForm.pricePerUser && genForm.contractedUsers && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">Total da cobrança: </span>
                <span className="font-bold text-foreground">
                  {formatCurrency(parseFloat(genForm.pricePerUser || "0") * parseInt(genForm.contractedUsers || "0"))}
                </span>
              </div>
            )}
            <div>
              <Label>Data de Vencimento *</Label>
              <Input
                type="date"
                value={genForm.dueDate}
                onChange={e => setGenForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações opcionais..."
                value={genForm.notes}
                onChange={e => setGenForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              Mês de referência: <strong>{monthOptions.find(m => m.value === selectedMonth)?.label}</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancelar</Button>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Gerando..." : "Gerar Cobrança"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Gerar todas */}
      <Dialog open={showGenerateAllModal} onOpenChange={setShowGenerateAllModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerar Cobranças do Mês</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Isso vai gerar automaticamente cobranças para todos os BOX com status <strong>Contratado</strong> que tenham valor por usuário e quantidade configurados.
            </p>
            <div className="bg-blue-50 p-3 rounded text-sm">
              Mês: <strong>{monthOptions.find(m => m.value === selectedMonth)?.label}</strong>
            </div>
            <p className="text-xs text-muted-foreground">
              BOX já com cobrança neste mês serão ignorados automaticamente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateAllModal(false)}>Cancelar</Button>
            <Button onClick={() => generateAllMutation.mutate({ referenceMonth: selectedMonth })} disabled={generateAllMutation.isPending}>
              {generateAllMutation.isPending ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Gerando...</> : <><Zap className="w-3 h-3 mr-1" /> Gerar Todas</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Marcar como pago */}
      <Dialog open={!!showMarkPaidModal} onOpenChange={() => setShowMarkPaidModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento Recebido</DialogTitle>
          </DialogHeader>
          {showMarkPaidModal && (
            <div className="py-2 space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="font-medium">{getClientName(showMarkPaidModal.clientId)}</div>
                <div className="text-muted-foreground">Total esperado: <strong>{formatCurrency(showMarkPaidModal.totalAmount)}</strong></div>
              </div>
              <div>
                <Label>Valor Recebido (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paidForm.paidAmount}
                  onChange={e => setPaidForm(f => ({ ...f, paidAmount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data do Recebimento</Label>
                <Input
                  type="date"
                  value={paidForm.paidDate}
                  onChange={e => setPaidForm(f => ({ ...f, paidDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Ex: Pago via PIX..."
                  value={paidForm.notes}
                  onChange={e => setPaidForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidModal(null)}>Cancelar</Button>
            <Button onClick={handleMarkAsPaid} disabled={markAsPaidMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {markAsPaidMutation.isPending ? "Salvando..." : <><CheckCircle className="w-3 h-3 mr-1" /> Confirmar Recebimento</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
