import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, Loader2, Phone, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function ClientsFiltered() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/clients/:status");
  const statusParam = params?.status as "filtered" | "pending" | "contracted" | "awaiting" | undefined;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Mapear a rota para o status do banco
  const statusMap: Record<string, string> = {
    filtered: "contacted",
    pending: "pending",
    contracted: "contracted",
    awaiting: "awaiting_response",
  };

  const dbStatus = statusParam ? statusMap[statusParam] : "contacted";

  const { data: clients = [], isLoading: loadingClients, refetch } = trpc.clients.list.useQuery({
    searchTerm,
    status: dbStatus,
    city: selectedCity || undefined,
  });

  const updateClientMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteClientMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente removido!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleStatusChange = (clientId: number, newStatus: string) => {
    updateClientMutation.mutate({
      id: clientId,
      data: {
        contractStatus: newStatus as "pending" | "contacted" | "awaiting_response" | "contracted",
      },
    });
  };

  const handleDelete = (clientId: number) => {
    if (confirm("Tem certeza que deseja remover este cliente?")) {
      deleteClientMutation.mutate(clientId);
    }
  };

  // Extrair cidades únicas dos clientes
  const cities = useMemo(() => {
    return Array.from(new Set(clients.map(c => c.city).filter(Boolean))) as string[];
  }, [clients]);

  // Títulos por status
  const statusTitles: Record<string, { title: string; description: string }> = {
    filtered: {
      title: "Clientes Filtrados",
      description: "Clientes importados do Leads (aguardando classificação)",
    },
    pending: {
      title: "Clientes Pendentes",
      description: "Aguardando resposta ou próximo contato",
    },
    contracted: {
      title: "Clientes Contratados",
      description: "Clientes com contrato ativo",
    },
    awaiting: {
      title: "Em Outro Momento",
      description: "Clientes que retornarão em outro momento",
    },
  };

  const currentStatus = statusTitles[statusParam || "filtered"];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{currentStatus.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{currentStatus.description}</p>
        </div>
        <Button
          onClick={() => navigate("/clients/new")}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, telefone ou BOX..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {cities.length > 0 && (
            <Select value={selectedCity || "todas"} onValueChange={(v) => setSelectedCity(v === "todas" ? null : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as cidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as cidades</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        {loadingClients ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-gray-500 mb-2">Nenhum cliente encontrado</p>
            <p className="text-sm text-gray-400">
              Nenhum cliente com este status no momento
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>BOX/Studio</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Contratados</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.boxName}</TableCell>
                    <TableCell>
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {client.address || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{client.totalClients || 0}</TableCell>
                    <TableCell className="text-center">{client.contractedClients || 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/clients/${client.id}/edit`)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(client.id, "pending")}
                          >
                            → Pendente
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(client.id, "contacted")}
                          >
                            → Filtrado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(client.id, "contracted")}
                          >
                            → Contratado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(client.id, "awaiting_response")}
                          >
                            → Em Outro Momento
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(client.id)}
                            className="text-red-600"
                          >
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
