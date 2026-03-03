import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Phone, MapPin, Users, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [cityFilter, setCityFilter] = useState<string | undefined>();

  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery({
    searchTerm,
    status: statusFilter,
    city: cityFilter,
  });

  const { data: consultants = [] } = trpc.consultants.list.useQuery();
  const updateClientMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      contacted: { label: "Contatado", className: "badge-contacted", icon: <CheckCircle2 className="w-4 h-4" /> },
      pending: { label: "Pendente", className: "badge-pending", icon: <AlertCircle className="w-4 h-4" /> },
      awaiting_response: { label: "Aguardando", className: "badge-awaiting", icon: <Clock className="w-4 h-4" /> },
      contracted: { label: "Contratado", className: "badge-contracted", icon: <Zap className="w-4 h-4" /> },
    };

    const config = statusMap[status] || statusMap.pending;
    return (
      <div className={`${config.className} flex items-center gap-2`}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes WODPULSE</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus contatos de pulseiras fitness</p>
        </div>
        <Button
          onClick={() => navigate("/clients/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold mt-2">{clients?.length || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Contratados</p>
              <p className="text-2xl font-bold mt-2">{clients?.filter(c => c.contractStatus === "contracted").length || 0}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold mt-2">{clients?.filter(c => c.contractStatus === "pending").length || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aguardando</p>
              <p className="text-2xl font-bold mt-2">{clients?.filter(c => c.contractStatus === "awaiting_response").length || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou BOX..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="contacted">Contatado</SelectItem>
            <SelectItem value="awaiting_response">Aguardando</SelectItem>
            <SelectItem value="contracted">Contratado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cityFilter || "all"} onValueChange={(v) => setCityFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clients Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-minimal w-full">
            <thead className="bg-muted">
              <tr>
                <th>Nome</th>
                <th>BOX/Studio</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Clientes</th>
                <th>Com Pulseira</th>
                <th>Consultor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando clientes...
                  </td>
                </tr>              ) : clients && clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/50 transition-colors">
                    <td className="font-medium">{client.name}</td>
                    <td>{client.boxName}</td>
                    <td>
                      <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </a>
                    </td>
                    <td className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {client.address || "-"}
                    </td>
                    <td className="text-center">{client.totalClients}</td>
                    <td className="text-center">{client.contractedClients}</td>
                    <td>
                      <Select
                        value={client.capturedBy || "none"}
                        onValueChange={(value) => {
                          updateClientMutation.mutate({
                            id: client.id,
                            data: {
                              capturedBy: value === "none" ? undefined : value,
                            },
                          });
                        }}
                      >
                        <SelectTrigger className="w-40 text-sm">
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem consultor</SelectItem>
                          {consultants.map((consultant: any) => (
                            <SelectItem key={consultant.id} value={consultant.name}>
                              {consultant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td>{getStatusBadge(client.contractStatus)}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado. Comece criando um novo cliente!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
