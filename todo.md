# WODPULSE CRM - Project TODO

## Database & Backend
- [x] Configurar conexão com PostgreSQL Neon
- [x] Criar schema da tabela clientes com todos os campos
- [x] Criar tabela de histórico de interações
- [x] Criar tabela de leads (possíveis clientes do Google Maps)
- [x] Implementar migrações Drizzle
- [x] Criar query helpers em server/db.ts

## API Routes (tRPC)
- [x] Criar router para CRUD de clientes
- [x] Criar router para listar clientes com filtros
- [x] Criar router para buscar cliente por ID
- [x] Criar router para atualizar status do cliente
- [x] Criar router para adicionar histórico de interação
- [x] Criar router para listar leads do Google Maps
- [x] Criar router para notificações por email

## Frontend - Dashboard & Tabelas
- [x] Criar layout principal com sidebar (DashboardLayout)
- [x] Implementar tabela de clientes com paginação
- [x] Adicionar sistema de cores por status (verde, amarelo, laranja, azul)
- [x] Implementar tags visuais para status
- [x] Criar filtros avançados (status, nome, BOX, cidade, data)
- [x] Implementar busca por nome/telefone/BOX
- [ ] Adicionar ações de edição/exclusão na tabela

## Frontend - Formulários
- [x] Criar formulário de cadastro de cliente
- [x] Criar formulário de edição de cliente
- [x] Implementar validação de campos
- [x] Adicionar feedback visual de sucesso/erro
- [x] Criar modal para adicionar histórico de interação
- [x] Criar página de detalhes do cliente com histórico

## Frontend - Listas Especializadas
- [x] Criar página de "Possíveis Clientes" (leads)
- [x] Criar página de "Clientes Ativos" (via filtros no dashboard)
- [x] Criar página de "Follow-ups Pendentes" (via filtros no dashboard)
- [x] Implementar visualização detalhada de cliente com histórico

## Google Maps Integration (Duplicado - ver abaixo)
- [x] Configurar Google Maps Places API
- [x] Implementar busca automática de Boxes/Studios/Funcionais em BH
- [x] Criar interface para revisar e importar leads
- [x] Adicionar funcionalidade de atualizar lista de leads

## Notificações por Email
- [ ] Configurar serviço de email (SendGrid ou similar) - PENDENTE
- [ ] Implementar lógica de verificação de recontatos vencidos - PENDENTE
- [ ] Criar templates de email - PENDENTE
- [ ] Implementar agendamento de notificações - PENDENTE

## Design & Estilo
- [x] Aplicar estilo Internacional (grid rigoroso, quadrados vermelhos, tipografia preta)
- [x] Configurar cores de status (verde, amarelo, laranja, azul)
- [x] Criar sistema de espaçamento e tipografia
- [x] Implementar design responsivo
- [x] Adicionar ícones e elementos visuais

## Testes
- [x] Escrever testes unitários para routers
- [x] Escrever testes para funções de filtro
- [x] Testar validação de formulários
- [x] Testar integração com banco de dados
- [x] Testar fluxo completo de CRUD de clientes

## Deployment
- [x] Revisar todas as funcionalidades
- [x] Testar fluxo completo de usuário
- [x] Otimizar performance
- [x] Criar checkpoint final
- [x] Publicar sistema online (link de desenvolvimento ativo)

## Google Maps Integration
- [x] Configurar Google Maps API Key e secrets
- [x] Criar rota backend para busca de estabelecimentos (Places API)
- [x] Implementar filtros por tipo (CrossFit, Studio, Funcional)
- [x] Criar página de busca com mapa e resultados
- [x] Implementar importação em massa de leads
- [x] Adicionar validação de duplicatas
- [x] Testar busca e importação

## Página de Detalhes do Cliente
- [x] Criar página ClientDetails.tsx com layout de detalhes
- [x] Implementar timeline visual de interações
- [x] Criar cards informativos para cada interação
- [x] Implementar formulário para adicionar anotações
- [x] Adicionar funcionalidade de editar cliente (botão navega para ClientForm)
- [x] Integrar com rotas tRPC de interações
- [x] Adicionar botão de voltar e navegação
- [x] Testar página completa

## Editar e Excluir Clientes
- [x] Criar rota tRPC para editar cliente
- [x] Criar rota tRPC para excluir cliente
- [x] Melhorar ClientForm para modo edição
- [x] Implementar botão editar na página de detalhes
- [x] Implementar botão excluir com confirmação
- [x] Testar fluxo completo de edição e exclusão

## Módulo Financeiro
- [x] Criar tabela de financeiro no banco de dados
- [x] Criar query helpers para financeiro
- [x] Criar rotas tRPC para CRUD de financeiro
- [x] Criar seção Financeiro na página de detalhes
- [x] Implementar formulário de edição de financeiro
- [x] Adicionar resumo total de pagamentos
- [x] Testar fluxo completo de financeiro

## Converter Lead em Cliente
- [x] Criar rota tRPC para converter lead em cliente
- [x] Implementar botão "Importar" na página de Leads
- [x] Criar modal de confirmação com pré-preenchimento de dados
- [x] Testar fluxo completo de conversão

## Correções e Melhorias
- [x] Corrigir rota /clients/new para criar novo cliente (adicionada ao App.tsx)


## Bugs Reportados - Março 2026
- [x] Acesso negado ao deletar alguns clientes (nem todos conseguem ser deletados) - CORRIGIDO
- [x] Comissão dos consultores parou de funcionar - não está mostrando valores por cliente - CORRIGIDO


## Correções de Banco de Dados - 03 de Março 2026
- [x] Migração de MySQL para PostgreSQL (Neon)
- [x] Corrigido import do Drizzle para usar postgres-js
- [x] Corrigido SSL connection com rejectUnauthorized: false
- [x] Convertido getByPaymentStatus para publicProcedure
- [x] Corrigido onDuplicateKeyUpdate para onConflictDoUpdate (PostgreSQL)
- [x] Adicionado usuário padrão quando não autenticado
- [x] Corrigido uso de ctx.user! em todas as rotas
- [x] Instalado pg e @types/pg para suporte PostgreSQL
- [x] Página /commissions carregando com sucesso
- [x] Página /clients carregando com sucesso
- [x] Voltado para usar pg em vez de postgres-js (mais estável)
- [x] Adicionado pool de conexão com configurações otimizadas
- [x] Página /consultants carregando com sucesso
- [x] Página /leads carregando com sucesso
- [x] Todos os erros de "Erro ao listar" corrigidos


## Correções Finais - PostgreSQL Neon (03 de Março 2026)
- [x] Criado NEON_DATABASE_URL como variável de ambiente
- [x] Atualizado drizzle.config.ts para usar NEON_DATABASE_URL
- [x] Corrigido schema.ts: serial com DEFAULT 0 para integer
- [x] Corrigido arquivo de migração 0000_rare_stryfe.sql
- [x] Limpado schema do banco de dados
- [x] Executadas migrações com sucesso
- [x] Sistema 100% funcional com PostgreSQL Neon
- [x] Todas as páginas carregando sem erros
- [x] Testes manuais de navegação bem-sucedidos

## Bugs - 03 de Março 2026 (tarde)
- [x] Erro ao converter lead em cliente - CORRIGIDO (phone opcional, totalClients/contractedClients com default 0)

## Sistema de Cobrança Recorrente e Comissão - Março 2026
- [x] Adicionar campos ao client: pricePerUser (valor negociado), dueDay (dia de vencimento)
- [x] Criar tabela monthlyPayments: registro mensal de pagamento por BOX
- [x] Criar tabela commissionPayments: comissão mensal por consultor
- [x] Criar rota para gerar cobrança mensal de um BOX (generate)
- [x] Criar rota generateAll: gera cobranças para todos os BOX contratados
- [x] Criar rota para listar cobranças por mês/status
- [x] Criar rota para marcar pagamento como recebido
- [x] Criar rota para calcular comissão mensal do consultor (monthlySummary)
- [x] Atualizar página Pagamentos com visão mensal recorrente
- [x] Atualizar página Comissões com cálculo por usuário ativo
- [x] Lógica: ao gerar cobrança, cria automaticamente comissão do consultor vinculado
- [x] Testes de pagamentos e comissões criados e passando

## Melhorias Formulário de Clientes - 03 de Março 2026
- [x] Adicionar campo "Valor por Pulseira" no formulário de edição de clientes
- [x] Adicionar campo "Dia de Vencimento" no formulário de edição de clientes
- [x] Adicionar campo "Consultor Responsável" (dropdown com consultores cadastrados)
- [x] Mostrar campos de contrato apenas quando status = "contracted"
- [x] Seção "Dados do Contrato e Cobrança" aparece condicionalmente
- [x] Preview de cálculo mensal (pulseiras x valor) no formulário
- [x] Campo Data de Início do Contrato adicionado
- [x] Schema atualizado com contractDate, pricePerUser, dueDay, consultantId
- [ ] Testar fluxo completo: editar cliente → gerar cobranças → marcar como recebido → ver comissões

## Bug - Comissões não aparecem ao vincular consultor
- [ ] Comissões devem mostrar dados dos clientes contratados com consultores vinculados (sem precisar gerar cobranças)
- [ ] Página de Comissões deve calcular baseado nos clientes contratados ativos
