import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, FileText, DollarSign, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional().default(""),
  boxName: z.string().min(1, "Nome do BOX/Studio é obrigatório"),
  address: z.string().optional(),
  city: z.string().default("Belo Horizonte"),
  totalClients: z.coerce.number().int().min(0).default(0),
  contractedClients: z.coerce.number().int().min(0).default(0),
  contractStatus: z.enum(["pending", "contacted", "awaiting_response", "contracted"]).default("pending"),
  nextContactDate: z.string().optional(),
  contractDate: z.string().optional(),
  observations: z.string().optional(),
  capturedBy: z.string().optional(),
  // Campos de contrato/cobrança recorrente
  pricePerUser: z.string().optional(),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
  consultantId: z.coerce.number().int().optional().nullable(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function ClientForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/clients/:id/edit");
  const clientId = params?.id ? parseInt(params.id) : null;
  const isEditMode = !!clientId && clientId !== 0 && !isNaN(clientId);

  const { data: existingClient, isLoading: isLoadingClient } = trpc.clients.getById.useQuery(clientId || 0, {
    enabled: isEditMode,
  });

  // Buscar lista de consultores para o dropdown
  const { data: consultants } = trpc.consultants.list.useQuery();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<any>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      city: "Belo Horizonte",
      contractStatus: "pending",
      totalClients: 0,
      contractedClients: 0,
    },
  });

  const contractStatus = watch("contractStatus");
  const isContracted = contractStatus === "contracted";

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && existingClient) {
      const c = existingClient as any;
      setValue("name", c.name);
      setValue("phone", c.phone || "");
      setValue("boxName", c.boxName);
      setValue("address", c.address || "");
      setValue("city", c.city);
      setValue("totalClients", c.totalClients || 0);
      setValue("contractedClients", c.contractedClients || 0);
      setValue("contractStatus", c.contractStatus);
      if (c.nextContactDate) {
        const date = new Date(c.nextContactDate);
        setValue("nextContactDate", date.toISOString().split("T")[0]);
      }
      if (c.contractDate) {
        const date = new Date(c.contractDate);
        setValue("contractDate", date.toISOString().split("T")[0]);
      }
      setValue("observations", c.observations || "");
      setValue("capturedBy", c.capturedBy || "");
      // Campos de contrato
      if (c.pricePerUser) setValue("pricePerUser", String(c.pricePerUser));
      if (c.dueDay) setValue("dueDay", c.dueDay);
      if (c.consultantId) setValue("consultantId", c.consultantId);
    }
  }, [isEditMode, existingClient, setValue]);

  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente criado com sucesso!");
      navigate("/clients");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar cliente");
    },
  });

  const updateClientMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      navigate(`/clients/${clientId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      const formData: any = {
        ...data,
        nextContactDate: data.nextContactDate ? new Date(data.nextContactDate) : undefined,
        contractDate: data.contractDate ? new Date(data.contractDate) : undefined,
        consultantId: data.consultantId ? Number(data.consultantId) : null,
        dueDay: data.dueDay ? Number(data.dueDay) : undefined,
      };

      if (isEditMode && clientId) {
        await updateClientMutation.mutateAsync({
          id: clientId,
          data: formData,
        });
      } else {
        await createClientMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  if (isEditMode && isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isSubmitting = createClientMutation.isPending || updateClientMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(isEditMode ? `/clients/${clientId}` : "/clients")}
          className="hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEditMode ? "Editar Cliente" : "Novo Cliente"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "Atualize as informações do cliente" : "Cadastre um novo cliente"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção: Dados Básicos */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Dados do BOX / Studio</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Responsável *</label>
              <Input
                {...register("name")}
                placeholder="João Silva"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{String(errors.name?.message)}</p>}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <Input
                {...register("phone")}
                placeholder="(31) 99999-9999"
              />
            </div>

            {/* BOX/Studio */}
            <div>
              <label className="block text-sm font-medium mb-2">Nome do BOX/Studio *</label>
              <Input
                {...register("boxName")}
                placeholder="CrossFit BH"
                className={errors.boxName ? "border-red-500" : ""}
              />
              {errors.boxName && <p className="text-red-500 text-sm mt-1">{String(errors.boxName?.message)}</p>}
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <Input
                {...register("city")}
                placeholder="Belo Horizonte"
              />
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Endereço</label>
              <Input
                {...register("address")}
                placeholder="Rua das Flores, 123"
              />
            </div>

            {/* Total de Clientes */}
            <div>
              <label className="block text-sm font-medium mb-2">Total de Alunos no BOX</label>
              <Input
                {...register("totalClients")}
                type="number"
                placeholder="50"
              />
              <p className="text-xs text-muted-foreground mt-1">Quantidade total de alunos do estabelecimento</p>
            </div>

            {/* Clientes com Pulseira */}
            <div>
              <label className="block text-sm font-medium mb-2">Alunos com Pulseira WOD</label>
              <Input
                {...register("contractedClients")}
                type="number"
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground mt-1">Quantidade de alunos que usam a pulseira</p>
            </div>
          </div>
        </Card>

        {/* Seção: Status e Acompanhamento */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Status e Acompanhamento</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status *</label>
              <Select
                value={watch("contractStatus")}
                onValueChange={(value) => setValue("contractStatus", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="awaiting_response">Aguardando Resposta</SelectItem>
                  <SelectItem value="contracted">✅ Contratado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Próximo Contato */}
            <div>
              <label className="block text-sm font-medium mb-2">Próximo Contato</label>
              <Input
                {...register("nextContactDate")}
                type="date"
              />
            </div>

            {/* Consultor Responsável - Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Consultor Responsável</label>
              <Select
                value={watch("consultantId") ? String(watch("consultantId")) : "none"}
                onValueChange={(value) => setValue("consultantId", value === "none" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um consultor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nenhum consultor —</SelectItem>
                  {consultants?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Consultor que fechou ou está acompanhando este BOX</p>
            </div>

            {/* Campo legado capturedBy - apenas leitura se já preenchido */}
            <div>
              <label className="block text-sm font-medium mb-2">Captado por (texto livre)</label>
              <Input
                {...register("capturedBy")}
                placeholder="Ex: João Silva"
              />
              <p className="text-xs text-muted-foreground mt-1">Opcional: nome livre do captador</p>
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Observações</label>
              <Textarea
                {...register("observations")}
                placeholder="Adicione observações sobre o cliente..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Seção: Dados do Contrato — só aparece quando status = "contracted" */}
        {isContracted && (
          <Card className="p-6 border-green-200 bg-green-50/30 dark:bg-green-950/10 dark:border-green-800">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">Dados do Contrato e Cobrança</h2>
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                Necessário para gerar cobranças mensais
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Valor por Pulseira */}
              <div>
                <label className="block text-sm font-medium mb-2">Valor por Pulseira (R$) *</label>
                <Input
                  {...register("pricePerUser")}
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Valor mensal negociado por usuário/pulseira</p>
              </div>

              {/* Dia de Vencimento */}
              <div>
                <label className="block text-sm font-medium mb-2">Dia de Vencimento *</label>
                <Input
                  {...register("dueDay")}
                  type="number"
                  min="1"
                  max="31"
                  placeholder="10"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Dia do mês em que a fatura vence (1-31)</p>
              </div>

              {/* Data de Início do Contrato */}
              <div>
                <label className="block text-sm font-medium mb-2">Data de Início do Contrato</label>
                <Input
                  {...register("contractDate")}
                  type="date"
                />
                <p className="text-xs text-muted-foreground mt-1">Data em que o contrato foi assinado</p>
              </div>
            </div>

            {/* Resumo do cálculo */}
            {watch("pricePerUser") && watch("contractedClients") > 0 && (
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Previsão mensal:</strong>{" "}
                  {watch("contractedClients")} pulseiras × R$ {parseFloat(watch("pricePerUser") || "0").toFixed(2)} ={" "}
                  <strong>R$ {(watch("contractedClients") * parseFloat(watch("pricePerUser") || "0")).toFixed(2)}/mês</strong>
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEditMode ? `/clients/${clientId}` : "/clients")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? "Atualizando..." : "Criando..."}
              </>
            ) : (
              isEditMode ? "Atualizar Cliente" : "Criar Cliente"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
