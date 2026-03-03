import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Star, Users, Globe, Phone, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Leads() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const { data: leads, isLoading, refetch } = trpc.leads.list.useQuery({
    status: statusFilter,
  });

  const convertToClientMutation = trpc.leads.convertToClient.useMutation({
    onSuccess: () => {
      toast.success("Lead convertido em cliente com sucesso!");
      setIsImportDialogOpen(false);
      setSelectedLead(null);
      setClientName("");
      setClientPhone("");
      refetch();
      setTimeout(() => navigate("/"), 1000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao converter lead em cliente");
    },
  });

  const deleteLeadMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead excluido com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir lead");
    },
  });

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      new: { label: "Novo", className: "badge-pending" },
      contacted: { label: "Contatado", className: "badge-contacted" },
      imported: { label: "Importado", className: "badge-contracted" },
      rejected: { label: "Rejeitado", className: "badge-awaiting" },
    };
    const config = (status && statusMap[status]) || statusMap.new;
    return <span className={`${config.className} px-3 py-1 rounded-full text-sm font-medium`}>{config.label}</span>;
  };

  const handleImportClick = (lead: any) => {
    setSelectedLead(lead);
    setClientName(lead.name);
    setClientPhone(lead.phone || "");
    setIsImportDialogOpen(true);
  };

  const handleConfirmImport = async () => {
    if (!clientName.trim()) {
      toast.warning("Digite o nome do cliente");
      return;
    }

    try {
      await convertToClientMutation.mutateAsync({
        leadId: selectedLead.id,
        clientData: {
          name: clientName,
          phone: clientPhone || "",
          boxName: selectedLead.name,
          address: selectedLead.address || "",
          city: "Belo Horizonte",
          contractStatus: "contacted",
        },
      });
    } catch (error) {
      console.error("Erro ao converter lead:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Possíveis Clientes</h1>
          <p className="text-muted-foreground mt-2">Leads encontrados via Google Maps</p>
        </div>
        <Button
          onClick={() => navigate("/leads/search")}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Buscar Novos Leads
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="new">Novo</SelectItem>
            <SelectItem value="contacted">Contatado</SelectItem>
            <SelectItem value="imported">Importado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Carregando leads...
          </div>
        ) : leads && leads.length > 0 ? (
          leads.map((lead) => (
            <Card key={lead.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{lead.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{lead.type.replace("_", " ").toUpperCase()}</p>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {lead.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{lead.address}</span>
                    </div>
                  )}

                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}

                  {lead.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={lead.website || "#"} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {lead.website}
                      </a>
                    </div>
                  )}

                  {lead.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-muted-foreground">{String(lead.rating)} ({lead.reviewCount} avaliações)</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      if (lead.phone) {
                        window.open(`https://wa.me/55${lead.phone.replace(/\D/g, "")}`, "_blank");
                      } else {
                        toast.info("Nenhum telefone disponível para este lead");
                      }
                    }}
                  >
                    Contatar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleImportClick(lead)}
                    disabled={convertToClientMutation.isPending || lead.status === "imported"}
                  >
                    {convertToClientMutation.isPending ? "Importando..." : "Importar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja excluir este lead?")) {
                        deleteLeadMutation.mutate({ id: lead.id });
                      }
                    }}
                    disabled={deleteLeadMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum lead encontrado</p>
            <Button
              onClick={() => navigate("/leads/search")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Buscar Leads no Google Maps
            </Button>
          </div>
        )}
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter Lead em Cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar este estabelecimento à sua lista de clientes.
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              {/* Lead Info */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-2">{selectedLead.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedLead.address}</p>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Contato</label>
                  <Input
                    placeholder="Ex: João Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <Input
                    placeholder="Ex: (31) 99999-9999"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={convertToClientMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {convertToClientMutation.isPending ? "Importando..." : "Importar Cliente"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
