import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, TrendingUp, Users, DollarSign, Award } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const monthLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export default function CommissionsReport() {
  const [openConsultants, setOpenConsultants] = useState<Set<number>>(new Set());

  // Resumo em tempo real baseado nos clientes contratados ativos
  const { data: activeSummary = [], isLoading } = trpc.commissions.activeSummary.useQuery();

  const toggleConsultant = (id: number) => {
    setOpenConsultants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Totais gerais
  const consultantsWithClients = activeSummary.filter(s => s.totalClients > 0);
  const totalConsultants = consultantsWithClients.length;
  const totalUsers = activeSummary.reduce((sum, s) => sum + s.totalUsers, 0);
  const totalRevenue = activeSummary.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalCommission = activeSummary.reduce((sum, s) => sum + s.totalCommission, 0);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-muted-foreground">Carregando comissões...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comissões dos Consultores</h1>
        <p className="text-muted-foreground">
          Resumo baseado nos clientes contratados ativos — {monthLabel}
        </p>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Consultores Ativos</p>
                <p className="text-2xl font-bold">{totalConsultants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Pulseiras</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Receita Mensal</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Comissões</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de consultores */}
      {consultantsWithClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma comissão ainda</h3>
            <p className="text-muted-foreground">
              As comissões aparecem automaticamente quando consultores são vinculados a clientes contratados.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Vá em <strong>Clientes</strong> → edite um cliente contratado → vincule um consultor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultantsWithClients.map((summary) => {
            const isOpen = openConsultants.has(summary.consultant.id);

            return (
              <Card key={summary.consultant.id}>
                {/* Header do consultor - clicável */}
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg"
                  onClick={() => toggleConsultant(summary.consultant.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-700 dark:text-blue-300 font-bold text-sm">
                          {summary.consultant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{summary.consultant.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Taxa de comissão: <strong>{summary.consultant.commissionRate}%</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">BOX Contratados</p>
                        <p className="font-bold text-foreground">{summary.totalClients}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pulseiras Ativas</p>
                        <p className="font-bold text-foreground">{summary.totalUsers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Receita Gerada</p>
                        <p className="font-bold text-purple-600">{formatCurrency(summary.totalRevenue)}</p>
                      </div>
                      <div className="min-w-[130px]">
                        <p className="text-xs text-muted-foreground">Comissão Mensal</p>
                        <p className="font-bold text-xl text-orange-600">{formatCurrency(summary.totalCommission)}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Detalhes dos clientes - expansível */}
                {isOpen && (
                  <CardContent className="pt-0">
                    {summary.clients.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Nenhum cliente contratado vinculado a este consultor.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>BOX / Studio</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead className="text-right">Pulseiras</TableHead>
                            <TableHead className="text-right">Valor/Pulseira</TableHead>
                            <TableHead className="text-right">Receita Mensal</TableHead>
                            <TableHead className="text-right">Comissão ({summary.consultant.commissionRate}%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summary.clients.map((item: any) => (
                            <TableRow key={item.client.id}>
                              <TableCell className="font-medium">{item.client.boxName || item.client.name}</TableCell>
                              <TableCell className="text-muted-foreground">{item.client.name}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{item.contractedUsers}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {item.pricePerUser > 0
                                  ? formatCurrency(item.pricePerUser)
                                  : <span className="text-muted-foreground text-xs">Não definido</span>
                                }
                              </TableCell>
                              <TableCell className="text-right font-medium text-purple-600">
                                {formatCurrency(item.monthlyRevenue)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-orange-600">
                                {formatCurrency(item.commissionAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-bold">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-right">{summary.totalUsers}</TableCell>
                            <TableCell />
                            <TableCell className="text-right text-purple-600">{formatCurrency(summary.totalRevenue)}</TableCell>
                            <TableCell className="text-right text-orange-600">{formatCurrency(summary.totalCommission)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Nota informativa */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="py-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Como funciona:</strong> As comissões são calculadas automaticamente com base nos clientes contratados vinculados a cada consultor.
            A fórmula é: <strong>Pulseiras Ativas × Valor por Pulseira × Taxa de Comissão (%)</strong>.
            Para que os valores apareçam corretamente, preencha o "Valor por Pulseira" e "Alunos com Pulseira WOD" no cadastro de cada cliente contratado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
