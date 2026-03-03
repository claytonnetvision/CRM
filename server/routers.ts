import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional().default(""),
  boxName: z.string().min(1, "Nome do BOX/Studio é obrigatório"),
  address: z.string().optional(),
  city: z.string().default("Belo Horizonte"),
  totalClients: z.number().int().min(0).optional(),
  contractedClients: z.number().int().min(0).optional(),
  contractStatus: z.enum(["pending", "contacted", "awaiting_response", "contracted"]).default("pending"),
  nextContactDate: z.date().optional(),
  contractDate: z.date().optional(),
  observations: z.string().optional(),
  capturedBy: z.string().optional(),
  // Campos de contrato/cobrança recorrente
  pricePerUser: z.string().optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  consultantId: z.number().int().optional().nullable(),
});

const updateClientSchema = createClientSchema.partial();

const createInteractionSchema = z.object({
  clientId: z.number().int(),
  type: z.enum(["call", "message", "email", "meeting", "note"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  notes: z.string().optional(),
  outcome: z.enum(["positive", "negative", "neutral", "pending"]).optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional(),
});

const createLeadSchema = z.object({
  googlePlaceId: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  latitude: z.union([z.number(), z.string()]).optional(),
  longitude: z.union([z.number(), z.string()]).optional(),
  type: z.enum(["crossfit_box", "studio", "functional", "gym"]),
  rating: z.union([z.number(), z.string()]).optional(),
  reviewCount: z.number().int().optional(),
});

const financialSchema = z.object({
  clientId: z.number().int(),
  pricePerUser: z.union([z.number(), z.string()]).optional(),
  contractedUsers: z.number().int().min(0).optional(),
  totalAmount: z.union([z.number(), z.string()]).optional(),
  paymentStatus: z.enum(["pending", "partial", "paid", "overdue"]).optional(),
  dueDate: z.date().optional(),
  paidDate: z.date().optional(),
  notes: z.string().optional(),
});

// ============================================
// CLIENTS ROUTER
// ============================================

const clientsRouter = router({
  create: protectedProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await db.createClient({
          userId: ctx.user!.id,
          ...input,
          totalClients: input.totalClients || 0,
          contractedClients: input.contractedClients || 0,
        });
        return { success: true };
      } catch (error) {
        console.error("Error creating client:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cliente" });
      }
    }),

  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      searchTerm: z.string().optional(),
      city: z.string().optional(),
      isActive: z.boolean().optional(),
      consultantId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const clients = await db.getClientsByUserId(ctx.user.id, input);
        return clients;
      } catch (error) {
        console.error("Error listing clients:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar clientes" });
      }
    }),

  getById: protectedProcedure
    .input(z.number())
    .query(async ({ input }) => {
      try {
        const client = await db.getClientById(input);
        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
        }
        return client;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error getting client:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar cliente" });
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: updateClientSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const client = await db.getClientById(input.id);
        if (!client || client.userId !== ctx.user!.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        const updated = await db.updateClient(input.id, input.data);
        
        // Se o status do cliente foi alterado para "contracted", atualizar financeiro
        if (input.data.contractStatus === "contracted" && client.contractStatus !== "contracted") {
          // O financeiro será criado/atualizado quando necessário
        }
        
        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating client:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar cliente" });
      }
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      try {
        const client = await db.getClientById(input);
        if (!client || client.userId !== ctx.user!.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        // Deletar financeiros associados ao cliente
        await db.deleteFinancialsByClientId(input);
        // Deletar cliente
        await db.deleteClient(input);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deleting client:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar cliente" });
      }
    }),

  getByStatus: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const clients = await db.getClientsByStatus(ctx.user.id, input);
        return clients;
      } catch (error) {
        console.error("Error getting clients by status:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar clientes por status" });
      }
    }),

  getOverdueRecontacts: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const clients = await db.getOverdueRecontacts(ctx.user.id);
        return clients;
      } catch (error) {
        console.error("Error getting overdue recontacts:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar recontatos vencidos" });
      }
    }),
});

// ============================================
// INTERACTIONS ROUTER
// ============================================

const interactionsRouter = router({
  create: protectedProcedure
    .input(createInteractionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify client belongs to user
        const client = await db.getClientById(input.clientId);
        if (!client || client.userId !== ctx.user!.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.createInteraction({
          ...input,
          userId: ctx.user!.id,
        });

        // Update client's lastContactedAt
        await db.updateClient(input.clientId, {
          lastContactedAt: new Date(),
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error creating interaction:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar interação" });
      }
    }),

  getByClientId: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      try {
        const client = await db.getClientById(input);
        if (!client || client.userId !== ctx.user!.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        const interactions = await db.getInteractionsByClientId(input);
        return interactions;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error getting interactions:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar interações" });
      }
    }),
});

// ============================================
// LEADS ROUTER
// ============================================

const leadsRouter = router({
  create: protectedProcedure
    .input(createLeadSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if lead already exists
        if (input.googlePlaceId) {
          const existing = await db.getLeadByGooglePlaceId(input.googlePlaceId);
          if (existing) {
            throw new TRPCError({ code: "CONFLICT", message: "Lead já existe" });
          }
        }

        const leadData: any = {
          userId: ctx.user!.id,
          ...input,
          city: "Belo Horizonte",
          latitude: input.latitude ? String(input.latitude) : undefined,
          longitude: input.longitude ? String(input.longitude) : undefined,
          rating: input.rating ? String(input.rating) : undefined,
        };
        await db.createLead(leadData);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error creating lead:", error);
        const cause = (error as any)?.cause;
        if (cause) console.error("Cause:", cause?.message || cause);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar lead" });
      }
    }),

  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const leads = await db.getLeadsByUserId(ctx.user.id, input?.status);
        return leads;
      } catch (error) {
        console.error("Error listing leads:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar leads" });
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        status: z.enum(["new", "contacted", "imported", "rejected"]).optional(),
        convertedToClientId: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        const updated = await db.updateLead(input.id, input.data);
        return updated;
      } catch (error) {
        console.error("Error updating lead:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar lead" });
      }
    }),

  convertToClient: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      clientData: createClientSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const clientData: any = {
          userId: ctx.user!.id,
          ...input.clientData,
          isLead: true,
        };
        await db.createClient(clientData);
        await db.updateLead(input.leadId, {
          status: "imported",
        });
        return { success: true };
      } catch (error) {
        console.error("Error converting lead to client:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao converter lead em cliente" });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await db.deleteLead(input.id);
        return { success: true };
      } catch (error) {
        console.error("Error deleting lead:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao excluir lead" });
      }
    }),
});

// ============================================
// GOOGLE MAPS ROUTER
// ============================================

const googleMapsRouter = router({
  searchEstablishments: protectedProcedure
    .input(z.object({
      type: z.enum(["crossfit", "studio", "funcional"]).optional(),
      query: z.string().optional(),
      location: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const { searchFitnessEstablishments, searchPlaces } = await import("./_core/googleMaps");
        
        if (input?.query) {
          // Custom search
          const results = await searchPlaces({
            query: input.query,
            location: {
              latitude: -19.9191,
              longitude: -43.9386,
            },
            radius: 15000,
          });
          return results;
        }

        if (input?.type) {
          // Search specific type
          const results = await searchFitnessEstablishments(input.type);
          return results;
        }

        // Search all types
        const results = await searchFitnessEstablishments("crossfit");
        return results;
      } catch (error: any) {
        console.error("Error searching establishments:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Erro ao buscar estabelecimentos: ${error.message}` 
        });
      }
    }),

  importLeads: protectedProcedure
    .input(z.object({
      type: z.enum(["crossfit", "studio", "funcional"]),
      limit: z.number().int().min(1).max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { searchFitnessEstablishments } = await import("./_core/googleMaps");
        const results = await searchFitnessEstablishments(input.type);
        
        const limited = results.slice(0, input.limit || 20);
        const imported: number[] = [];

        for (const place of limited) {
          try {
            // Check if lead already exists
            const existing = await db.getLeadByGooglePlaceId(place.id);
            if (existing) continue;

            // Create lead
            await db.createLead({
              userId: ctx.user!.id,
              googlePlaceId: place.id,
              name: place.name,
              address: place.address,
              phone: place.phone,
              website: place.website,
              latitude: String(place.latitude),
              longitude: String(place.longitude),
              type: input.type === "crossfit" ? "crossfit_box" : input.type === "studio" ? "studio" : "functional",
              rating: place.rating ? String(place.rating) : undefined,
              reviewCount: place.reviewCount,
              city: "Belo Horizonte",
              status: "new",
            });
            imported.push(place.id as any);
          } catch (error) {
            console.error("Error importing lead:", error);
          }
        }

        return {
          success: true,
          imported: imported.length,
          total: limited.length,
        };
      } catch (error: any) {
        console.error("Error importing leads:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Erro ao importar leads: ${error.message}` 
        });
      }
    }),
});

// ============================================
// FINANCIALS ROUTER
// ============================================

const financialsRouter = router({
  getByClientId: protectedProcedure
    .input(z.number())
    .query(async ({ input }) => {
      try {
        const financial = await db.getFinancialByClientId(input);
        return financial;
      } catch (error) {
        console.error("Error getting financial:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar financeiro" });
      }
    }),

  createOrUpdate: protectedProcedure
    .input(financialSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const financial = await db.createOrUpdateFinancial({
          ...input,
          userId: ctx.user!.id,
          pricePerUser: input.pricePerUser ? String(input.pricePerUser) : "0.00",
          totalAmount: input.totalAmount ? String(input.totalAmount) : "0.00",
        });
        return financial;
      } catch (error) {
        console.error("Error creating/updating financial:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao salvar financeiro" });
      }
    }),

  update: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      data: financialSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const financial = await db.updateFinancial(input.clientId, {
          ...input.data,
          pricePerUser: input.data.pricePerUser ? String(input.data.pricePerUser) : undefined,
          totalAmount: input.data.totalAmount ? String(input.data.totalAmount) : undefined,
        });
        return financial;
      } catch (error) {
        console.error("Error updating financial:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar financeiro" });
      }
    }),

  getByPaymentStatus: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const financials = await db.getFinancialsByPaymentStatus(ctx.user?.id || 1, input);
        return financials;
      } catch (error) {
        console.error("Error getting financials by status:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar financeiros" });
      }
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      try {
        await db.deleteFinancial(input);
        return { success: true };
      } catch (error) {
        console.error("Error deleting financial:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar financeiro" });
      }
    }),
});

// ============================================
// CONSULTANTS ROUTER
// ============================================

const consultantsRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        return await db.getConsultantsByUserId(ctx.user!.id);
      } catch (error) {
        console.error("Error listing consultants:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar consultores" });
      }
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      email: z.string().email("Email inválido"),
      commissionRate: z.number().min(0).max(100).default(5),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await db.createConsultant({
          userId: ctx.user!.id,
          name: input.name,
          email: input.email,
          commissionRate: input.commissionRate.toString(),
          active: true,
        });
      } catch (error) {
        console.error("Error creating consultant:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar consultor" });
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      commissionRate: z.number().min(0).max(100).optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const consultant = await db.getConsultantById(input.id);
        if (!consultant || consultant.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.email) updateData.email = input.email;
        if (input.commissionRate !== undefined) updateData.commissionRate = input.commissionRate.toString();
        if (input.active !== undefined) updateData.active = input.active;

        return await db.updateConsultant(input.id, updateData);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating consultant:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar consultor" });
      }
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      try {
        const consultant = await db.getConsultantById(input);
        if (!consultant || consultant.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.deleteConsultant(input);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deleting consultant:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar consultor" });
      }
    }),
});

// ============================================
// NOTIFICATIONS ROUTER
// ============================================

const notificationsRouter = router({
  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      type: z.enum(["recontact_reminder", "overdue_contact", "contract_reminder"]),
      recipientEmail: z.string().email(),
      subject: z.string(),
      body: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const client = await db.getClientById(input.clientId);
        if (!client || client.userId !== ctx.user!.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        await db.createEmailNotification({
          clientId: input.clientId,
          userId: ctx.user!.id,
          type: input.type,
          recipientEmail: input.recipientEmail,
          subject: input.subject,
          body: input.body,
          sent: false,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error creating notification:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar notificação" });
      }
    }),
});

// ============================================
// COBRANÇAS MENSAIS RECORRENTES
// ============================================
const monthlyPaymentsRouter = router({
  generate: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      referenceMonth: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
      pricePerUser: z.number().positive(),
      contractedUsers: z.number().int().min(1),
      dueDate: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const existing = await db.getMonthlyPaymentByClientAndMonth(input.clientId, input.referenceMonth);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Já existe cobrança para este cliente neste mês" });
        const totalAmount = (input.pricePerUser * input.contractedUsers).toFixed(2);
        const [year] = input.referenceMonth.split('-');
        const payment = await db.createMonthlyPayment({
          clientId: input.clientId,
          userId: ctx.user!.id,
          referenceMonth: input.referenceMonth,
          referenceYear: parseInt(year),
          pricePerUser: input.pricePerUser.toFixed(2),
          contractedUsers: input.contractedUsers,
          totalAmount,
          paymentStatus: "pending",
          dueDate: new Date(input.dueDate),
          notes: input.notes,
        });
        const client = await db.getClientById(input.clientId);
        if (client && (client as any).consultantId) {
          const consultant = await db.getConsultantById((client as any).consultantId);
          if (consultant) {
            const commissionPerUser = parseFloat(consultant.commissionRate || "0");
            await db.createCommissionPayment({
              consultantId: (client as any).consultantId,
              monthlyPaymentId: payment.id,
              clientId: input.clientId,
              referenceMonth: input.referenceMonth,
              referenceYear: parseInt(year),
              contractedUsers: input.contractedUsers,
              commissionPerUser: commissionPerUser.toFixed(2),
              totalCommission: (commissionPerUser * input.contractedUsers).toFixed(2),
              paid: false,
            });
          }
        }
        return payment;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error generating monthly payment:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao gerar cobrança mensal" });
      }
    }),

  generateAll: protectedProcedure
    .input(z.object({ referenceMonth: z.string().regex(/^\d{4}-\d{2}$/) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const contractedClients = await db.getClientsByStatus(ctx.user!.id, "contracted");
        const [year] = input.referenceMonth.split('-');
        const results = { generated: 0, skipped: 0, errors: 0 };
        for (const client of contractedClients) {
          try {
            const existing = await db.getMonthlyPaymentByClientAndMonth(client.id, input.referenceMonth);
            if (existing) { results.skipped++; continue; }
            const pricePerUser = parseFloat((client as any).pricePerUser || "0");
            const contractedUsers = client.contractedClients || 0;
            if (pricePerUser <= 0 || contractedUsers <= 0) { results.skipped++; continue; }
            const dueDay = (client as any).dueDay || 10;
            const [y, m] = input.referenceMonth.split('-');
            const dueDate = new Date(parseInt(y), parseInt(m) - 1, dueDay);
            const payment = await db.createMonthlyPayment({
              clientId: client.id,
              userId: ctx.user!.id,
              consultantId: (client as any).consultantId || null,
              referenceMonth: input.referenceMonth,
              referenceYear: parseInt(year),
              pricePerUser: pricePerUser.toFixed(2),
              contractedUsers,
              totalAmount: (pricePerUser * contractedUsers).toFixed(2),
              paymentStatus: "pending",
              dueDate,
            });
            if ((client as any).consultantId) {
              const consultant = await db.getConsultantById((client as any).consultantId);
              if (consultant) {
                const commissionPerUser = parseFloat(consultant.commissionRate || "0");
                await db.createCommissionPayment({
                  consultantId: (client as any).consultantId,
                  monthlyPaymentId: payment.id,
                  clientId: client.id,
                  referenceMonth: input.referenceMonth,
                  referenceYear: parseInt(year),
                  contractedUsers,
                  commissionPerUser: commissionPerUser.toFixed(2),
                  totalCommission: (commissionPerUser * contractedUsers).toFixed(2),
                  paid: false,
                });
              }
            }
            results.generated++;
          } catch { results.errors++; }
        }
        return results;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao gerar cobranças mensais" });
      }
    }),

  list: protectedProcedure
    .input(z.object({
      referenceMonth: z.string().optional(),
      paymentStatus: z.string().optional(),
      consultantId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        return await db.getAllMonthlyPayments(input || {});
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar cobranças mensais" });
      }
    }),

  listByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await db.getMonthlyPaymentsByClientId(input.clientId);
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar cobranças do cliente" });
      }
    }),

  markAsPaid: protectedProcedure
    .input(z.object({
      id: z.number(),
      paidAmount: z.number().optional(),
      paidDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await db.updateMonthlyPayment(input.id, {
          paymentStatus: "paid",
          paidDate: input.paidDate ? new Date(input.paidDate) : new Date(),
          paidAmount: input.paidAmount?.toFixed(2),
          notes: input.notes,
        });
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao marcar pagamento como recebido" });
      }
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      paymentStatus: z.enum(["pending", "partial", "paid", "overdue"]),
      paidAmount: z.number().optional(),
      paidDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const updateData: any = { paymentStatus: input.paymentStatus, notes: input.notes };
        if (input.paidDate) updateData.paidDate = new Date(input.paidDate);
        if (input.paidAmount !== undefined) updateData.paidAmount = input.paidAmount.toFixed(2);
        return await db.updateMonthlyPayment(input.id, updateData);
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar status do pagamento" });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await db.deleteMonthlyPayment(input.id);
        return { success: true };
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar cobrança" });
      }
    }),
});

// ============================================
// COMISSÕES DOS CONSULTORES
// ============================================
const commissionsRouter = router({
  list: protectedProcedure
    .input(z.object({
      referenceMonth: z.string().optional(),
      consultantId: z.number().optional(),
      paid: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        return await db.getAllCommissions(input || {});
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar comissões" });
      }
    }),

  listByConsultant: protectedProcedure
    .input(z.object({ consultantId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await db.getCommissionsByConsultantId(input.consultantId);
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar comissões do consultor" });
      }
    }),

  markAsPaid: protectedProcedure
    .input(z.object({
      id: z.number(),
      paidDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await db.updateCommissionPayment(input.id, {
          paid: true,
          paidDate: input.paidDate ? new Date(input.paidDate) : new Date(),
        });
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao marcar comissão como paga" });
      }
    }),

  monthlySummary: protectedProcedure
    .input(z.object({ referenceMonth: z.string() }))
    .query(async ({ input }) => {
      try {
        const commissions = await db.getCommissionsByMonth(input.referenceMonth);
        const consultantsList = await db.getAllConsultants();
        return consultantsList.map(consultant => {
          const consultantCommissions = commissions.filter(c => c.consultantId === consultant.id);
          const totalCommission = consultantCommissions.reduce((sum, c) => sum + parseFloat(c.totalCommission || "0"), 0);
          const totalUsers = consultantCommissions.reduce((sum, c) => sum + (c.contractedUsers || 0), 0);
          return {
            consultant,
            totalCommission,
            totalUsers,
            totalClients: consultantCommissions.length,
            paidAmount: consultantCommissions.filter(c => c.paid).reduce((sum, c) => sum + parseFloat(c.totalCommission || "0"), 0),
            pendingAmount: consultantCommissions.filter(c => !c.paid).reduce((sum, c) => sum + parseFloat(c.totalCommission || "0"), 0),
            commissions: consultantCommissions,
          };
        }).filter(s => s.totalClients > 0);
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar resumo de comissões" });
      }
    }),

  // Resumo em tempo real baseado nos clientes contratados ativos (sem precisar gerar cobranças)
  activeSummary: protectedProcedure
    .query(async () => {
      try {
        const consultantsList = await db.getAllConsultants();
        const contractedClients = await db.getClientsByStatus(0, "contracted");

        return consultantsList.map(consultant => {
          // Clientes contratados vinculados a este consultor
          const myClients = contractedClients.filter(c => c.consultantId === consultant.id);

          // Calcular comissão potencial mensal por cliente
          const clientsWithCommission = myClients.map(client => {
            const contractedUsers = client.contractedClients || 0;
            const pricePerUser = parseFloat(client.pricePerUser || "0");
            const commissionRate = parseFloat(consultant.commissionRate || "5");
            const monthlyRevenue = contractedUsers * pricePerUser;
            const commissionAmount = (monthlyRevenue * commissionRate) / 100;
            return {
              client,
              contractedUsers,
              pricePerUser,
              monthlyRevenue,
              commissionRate,
              commissionAmount,
            };
          });

          const totalUsers = clientsWithCommission.reduce((sum, c) => sum + c.contractedUsers, 0);
          const totalRevenue = clientsWithCommission.reduce((sum, c) => sum + c.monthlyRevenue, 0);
          const totalCommission = clientsWithCommission.reduce((sum, c) => sum + c.commissionAmount, 0);

          return {
            consultant,
            totalClients: myClients.length,
            totalUsers,
            totalRevenue,
            totalCommission,
            clients: clientsWithCommission,
          };
        }).filter(s => s.totalClients > 0 || consultantsList.length > 0);
      } catch (error) {
        console.error("Error in activeSummary:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar resumo ativo de comissões" });
      }
    }),
});

// ============================================
// MAIN ROUTER
// ============================================

console.log('[ROUTERS] Initializing app router');

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      console.log('[AUTH.ME] Query called');
      console.log('[AUTH.ME] ctx.user:', opts.ctx.user);
      console.log('[AUTH.ME] ctx.req.headers.cookie:', opts.ctx.req.headers.cookie);
      console.log('[AUTH.ME] Returning user:', opts.ctx.user);
      return opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      console.log('[AUTH.LOGOUT] Logout called');
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      console.log('[AUTH.LOGOUT] Cookie cleared');
      return {
        success: true,
      } as const;
    }),
  }),

  clients: clientsRouter,
  interactions: interactionsRouter,
  leads: leadsRouter,
  financials: financialsRouter,
  consultants: consultantsRouter,
  notifications: notificationsRouter,
  googleMaps: googleMapsRouter,
  monthlyPayments: monthlyPaymentsRouter,
  commissions: commissionsRouter,
});

export type AppRouter = typeof appRouter;
