import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit2, Trash2, Mail, Percent } from "lucide-react";
import { useState } from "react";

export default function Consultants() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", commissionRate: 5 });

  // Queries
  const { data: consultants = [], refetch } = trpc.consultants.list.useQuery();

  // Mutations
  const createMutation = trpc.consultants.create.useMutation({
    onSuccess: () => {
      alert("Consultor criado com sucesso!");
      setFormData({ name: "", email: "", commissionRate: 5 });
      setIsOpen(false);
      refetch();
    },
    onError: (error) => {
      alert("Erro: " + error.message);
    },
  });

  const updateMutation = trpc.consultants.update.useMutation({
    onSuccess: () => {
      alert("Consultor atualizado com sucesso!");
      setFormData({ name: "", email: "", commissionRate: 5 });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    },
    onError: (error) => {
      alert("Erro: " + error.message);
    },
  });

  const deleteMutation = trpc.consultants.delete.useMutation({
    onSuccess: () => {
      alert("Consultor deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      alert("Erro: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert("Preencha todos os campos");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: formData.name,
        email: formData.email,
        commissionRate: formData.commissionRate,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        commissionRate: formData.commissionRate,
      });
    }
  };

  const handleEdit = (consultant: any) => {
    setEditingId(consultant.id);
    setFormData({
      name: consultant.name,
      email: consultant.email,
      commissionRate: parseFloat(consultant.commissionRate),
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este consultor?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({ name: "", email: "", commissionRate: 5 });
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consultores</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus consultores e comissões</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Consultor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Consultor" : "Novo Consultor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do consultor"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Taxa de Comissão (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                  placeholder="5"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total de Consultores</p>
            <p className="text-4xl font-bold mt-2 text-blue-600">{consultants.length}</p>
          </div>
          <Users className="w-10 h-10 text-blue-600" />
        </div>
      </Card>

      {/* Consultants Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Lista de Consultores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table-minimal w-full">
            <thead className="bg-muted">
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Comissão</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {consultants.length > 0 ? (
                consultants.map((consultant: any) => (
                  <tr key={consultant.id} className="hover:bg-muted/50 transition-colors">
                    <td className="font-semibold">{consultant.name}</td>
                    <td className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {consultant.email}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Percent className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-600">{consultant.commissionRate}%</span>
                      </div>
                    </td>
                    <td className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(consultant)}
                        className="gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(consultant.id)}
                        className="gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum consultor cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">ℹ️ Sobre Consultores</h3>
        <p className="text-sm text-muted-foreground">
          Cadastre seus consultores aqui e defina a taxa de comissão de cada um. 
          Você poderá selecionar consultores ao criar clientes. 
          As comissões serão calculadas automaticamente no relatório de comissões.
        </p>
      </Card>
    </div>
  );
}
