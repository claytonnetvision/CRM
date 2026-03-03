import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Users,
  Zap,
  Calendar,
  MessageSquare,
  Plus,
  Edit2,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Trash2,
  DollarSign,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type InteractionType = "call" | "message" | "email" | "meeting" | "note";
type InteractionOutcome = "positive" | "negative" | "neutral" | "pending";

const interactionTypeLabels: Record<InteractionType, string> = {
  call: "Ligação",
  message: "Mensagem",
  email: "Email",
  meeting: "Reunião",
  note: "Anotação",
};

const interactionTypeIcons: Record<InteractionType, any> = {
  call: Phone,
  message: MessageSquare,
  email: MessageCircle,
  meeting: Users,
  note: MessageSquare,
};

const outcomeLabels: Record<InteractionOutcome, string> = {
  positive: "Positivo",
  negative: "Negativo",
  neutral: "Neutro",
  pending: "Pendente",
};

const outcomeColors: Record<InteractionOutcome, string> = {
  positive: "bg-green-100 text-green-800 border-green-300",
  negative: "bg-red-100 text-red-800 border-red-300",
  neutral: "bg-gray-100 text-gray-800 border-gray-300",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  awaiting_response: "bg-orange-100 text-orange-800",
  contracted: "bg-green-100 text-green-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  contacted: "Contatado",
  awaiting_response: "Aguardando Resposta",
  contracted: "Contratado",
};

export default function ClientDetails() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/clients/:id");
  const clientId = params?.id ? parseInt(params.id) : null;

  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [isEditingFinancial, setIsEditingFinancial] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: "note" as InteractionType,
    description: "",
    notes: "",
    outcome: "pending" as InteractionOutcome,
  });

  const [financialData, setFinancialData] = useState({
    pricePerUser: "0.00",
    contractedUsers: 0,
    paymentStatus: "pending" as "pending" | "partial" | "paid" | "overdue",
    dueDate: "",
    paidDate: "",
    notes: "",
  });

  // Queries
  const clientQuery = trpc.clients.getById.useQuery(clientId || 0, {
    enabled: !!clientId,
  });

  const interactionsQuery = trpc.interactions.getByClientId.useQuery(clientId || 0, {
    enabled: !!clientId,
  });

  const financialQuery = trpc.financials.getByClientId.useQuery(clientId || 0, {
    enabled: !!clientId,
  });

  // Mutations
  const updateClientMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      clientQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });

  const deleteClientMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente deletado com sucesso!");
      navigate("/clients");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar cliente");
    },
  });

  const updateFinancialMutation = trpc.financials.update.useMutation({
    onSuccess: () => {
      toast.success("Financeiro atualizado com sucesso!");
      setIsEditingFinancial(false);
      financialQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar financeiro");
    },
  });

  const handleUpdateFinancial = async () => {
    if (!clientId) return;
    
    try {
      const totalAmount = (parseFloat(financialData.pricePerUser || "0") * (financialData.contractedUsers || 0)).toFixed(2);
      
      await updateFinancialMutation.mutateAsync({
        clientId,
        data: {
          pricePerUser: financialData.pricePerUser || "0.00",
          contractedUsers: financialData.contractedUsers || 0,
          totalAmount,
          paymentStatus: financialData.paymentStatus,
          dueDate: financialData.dueDate ? new Date(financialData.dueDate) : undefined,
          paidDate: financialData.paidDate ? new Date(financialData.paidDate) : undefined,
          notes: financialData.notes,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar financeiro:", error);
    }
  };

  const addInteractionMutation = trpc.interactions.create.useMutation({
    onSuccess: () => {
      toast.success("Interação adicionada com sucesso!");
      setNewInteraction({
        type: "note",
        description: "",
        notes: "",
        outcome: "pending",
      });
      setIsAddingInteraction(false);
      interactionsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar interação");
    },
  });

  const handleAddInteraction = async () => {
    if (!newInteraction.description.trim()) {
      toast.warning("Descrição é obrigatória");
      return;
    }

    if (!clientId) return;

    await addInteractionMutation.mutateAsync({
      clientId,
      type: newInteraction.type,
      description: newInteraction.description,
      notes: newInteraction.notes,
      outcome: newInteraction.outcome,
    });
  };

  if (!match) return null;

  const client = clientQuery.data;
  if (clientQuery.isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!client) return <div className="p-8 text-center">Cliente não encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/clients")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <p className="text-muted-foreground">{client.boxName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/edit`)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar Cliente</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar este cliente? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-2">
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteClientMutation.mutateAsync(clientId || 0)} className="bg-red-600">
                    Deletar
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Status Card */}
            <Card className="p-6">
              <h2 className="font-bold mb-4">Status</h2>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[client.contractStatus as string] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[client.contractStatus as string] || client.contractStatus}
              </div>
            </Card>

            {/* Contact Info Card */}
            <Card className="p-6 space-y-4">
              <h2 className="font-bold mb-4">Informações de Contato</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                    {client.phone}
                  </a>
                </div>
                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>Cidade: {client.city}</p>
                </div>
              </div>
            </Card>

            {/* Stats Card */}
            <Card className="p-6 space-y-4">
              <h2 className="font-bold mb-4">Estatísticas</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Total de Clientes</span>
                  </div>
                  <span className="font-bold">{client.totalClients}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Com Pulseira</span>
                  </div>
                  <span className="font-bold">{client.contractedClients}</span>
                </div>
                {client.nextContactDate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Próximo Contato</span>
                    </div>
                    <span className="font-bold text-sm">
                      {format(new Date(client.nextContactDate), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Observations Card */}
            {client.observations && (
              <Card className="p-6">
                <h2 className="font-bold mb-3">Observações</h2>
                <p className="text-sm text-muted-foreground">{client.observations}</p>
              </Card>
            )}

            {/* Financial Summary Sidebar */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold">Resumo Financeiro</h2>
              </div>
              {financialQuery.data && (financialQuery.data.pricePerUser || financialQuery.data.contractedUsers) ? (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Valor por Usuário</p>
                    <p className="text-2xl font-bold text-blue-600">R$ {parseFloat(financialQuery.data.pricePerUser || "0").toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Usuários Contratados</p>
                    <p className="text-2xl font-bold text-blue-600">{financialQuery.data.contractedUsers}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border-2 border-blue-300">
                    <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                    <p className="text-3xl font-bold text-blue-700">R$ {parseFloat(financialQuery.data.totalAmount || "0").toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Status</p>
                    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${financialQuery.data?.paymentStatus === "paid" ? "bg-green-100 text-green-800" : financialQuery.data?.paymentStatus === "partial" ? "bg-yellow-100 text-yellow-800" : financialQuery.data?.paymentStatus === "overdue" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                      {financialQuery.data.paymentStatus === "pending" ? "Pendente" : financialQuery.data.paymentStatus === "partial" ? "Parcialmente Pago" : financialQuery.data.paymentStatus === "paid" ? "Pago" : "Vencido"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Sem dados financeiros</p>
                </div>
              )}
            </Card>

            {/* Financial Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financeiro
                </h2>
                <Dialog open={isEditingFinancial} onOpenChange={setIsEditingFinancial}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => {
                      if (financialQuery.data) {
                        setFinancialData({
                          pricePerUser: financialQuery.data.pricePerUser || "0.00",
                          contractedUsers: financialQuery.data.contractedUsers || 0,
                          paymentStatus: financialQuery.data.paymentStatus || "pending",
                          dueDate: financialQuery.data.dueDate ? new Date(financialQuery.data.dueDate).toISOString().split('T')[0] : "",
                          paidDate: financialQuery.data.paidDate ? new Date(financialQuery.data.paidDate).toISOString().split('T')[0] : "",
                          notes: financialQuery.data.notes || "",
                        });
                      } else {
                        // Inicializar com valores vazios se não houver dados
                        setFinancialData({
                          pricePerUser: "0.00",
                          contractedUsers: 0,
                          paymentStatus: "pending",
                          dueDate: "",
                          paidDate: "",
                          notes: "",
                        });
                      }
                    }}>
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Financeiro</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Valor por Usuário (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={financialData.pricePerUser}
                          onChange={(e) => setFinancialData({ ...financialData, pricePerUser: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Quantidade de Usuários Contratados</label>
                        <Input
                          type="number"
                          value={financialData.contractedUsers}
                          onChange={(e) => setFinancialData({ ...financialData, contractedUsers: parseInt(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status de Pagamento</label>
                        <Select value={financialData.paymentStatus} onValueChange={(value) => setFinancialData({ ...financialData, paymentStatus: value as "pending" | "partial" | "paid" | "overdue" })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="partial">Parcialmente Pago</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="overdue">Vencido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data de Vencimento</label>
                        <Input
                          type="date"
                          value={financialData.dueDate}
                          onChange={(e) => setFinancialData({ ...financialData, dueDate: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data de Pagamento</label>
                        <Input
                          type="date"
                          value={financialData.paidDate}
                          onChange={(e) => setFinancialData({ ...financialData, paidDate: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Observações</label>
                        <Textarea
                          value={financialData.notes}
                          onChange={(e) => setFinancialData({ ...financialData, notes: e.target.value })}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleUpdateFinancial} disabled={updateFinancialMutation.isPending} className="w-full">
                        {updateFinancialMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {financialQuery.data && (financialQuery.data.pricePerUser || financialQuery.data.contractedUsers) ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valor por Usuário</span>
                    <span className="font-bold">R$ {parseFloat(financialQuery.data.pricePerUser || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Usuários Contratados</span>
                    <span className="font-bold">{financialQuery.data.contractedUsers}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-sm font-semibold">Valor Total</span>
                    <span className="font-bold text-lg">R$ {parseFloat(financialQuery.data.totalAmount || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${financialQuery.data?.paymentStatus === "paid" ? "bg-green-100 text-green-800" : financialQuery.data?.paymentStatus === "partial" ? "bg-yellow-100 text-yellow-800" : financialQuery.data?.paymentStatus === "overdue" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                      {financialQuery.data.paymentStatus === "pending" ? "Pendente" :
                       financialQuery.data.paymentStatus === "partial" ? "Parcialmente Pago" :
                       financialQuery.data.paymentStatus === "paid" ? "Pago" :
                       "Vencido"}
                    </span>
                  </div>
                  {financialQuery.data.dueDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Vencimento</span>
                      <span>{format(new Date(financialQuery.data.dueDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  )}
                  {financialQuery.data.paidDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Pago em</span>
                      <span>{format(new Date(financialQuery.data.paidDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma informação financeira registrada</p>
              )}
            </Card>
          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Histórico de Interações</h2>
              <Dialog open={isAddingInteraction} onOpenChange={setIsAddingInteraction}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Interação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Interação</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Tipo</label>
                      <Select value={newInteraction.type} onValueChange={(value) => setNewInteraction({ ...newInteraction, type: value as InteractionType })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Ligação</SelectItem>
                          <SelectItem value="message">Mensagem</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Reunião</SelectItem>
                          <SelectItem value="note">Anotação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea
                        value={newInteraction.description}
                        onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                        placeholder="Descreva a interação..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notas Adicionais</label>
                      <Textarea
                        value={newInteraction.notes}
                        onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                        placeholder="Notas opcionais..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Resultado</label>
                      <Select value={newInteraction.outcome} onValueChange={(value) => setNewInteraction({ ...newInteraction, outcome: value as InteractionOutcome })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">Positivo</SelectItem>
                          <SelectItem value="negative">Negativo</SelectItem>
                          <SelectItem value="neutral">Neutro</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddInteraction} disabled={addInteractionMutation.isPending} className="w-full">
                      {addInteractionMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adicionando...
                        </>
                      ) : (
                        "Adicionar"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {interactionsQuery.isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : interactionsQuery.data && interactionsQuery.data.length > 0 ? (
              <div className="space-y-4">
                {interactionsQuery.data.map((interaction, index) => {
                  const Icon = interactionTypeIcons[interaction.type as InteractionType];
                  return (
                    <Card key={interaction.id} className="p-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          {index < (interactionsQuery.data?.length || 0) - 1 && (
                            <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{interactionTypeLabels[interaction.type as InteractionType]}</h3>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${outcomeColors[interaction.outcome as InteractionOutcome]}`}>
                              {outcomeLabels[interaction.outcome as InteractionOutcome]}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{interaction.description}</p>
                          {interaction.notes && (
                            <p className="text-sm bg-gray-50 p-2 rounded mb-2">{interaction.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(interaction.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma interação registrada</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
