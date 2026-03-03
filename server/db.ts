import { eq, and, desc, sql as sqlFn } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, clients, InsertClient, interactions, InsertInteraction, leads, InsertLead, emailNotifications, InsertEmailNotification, financials, InsertFinancial, Financial, consultants, InsertConsultant, Consultant, monthlyPayments, InsertMonthlyPayment, MonthlyPayment, commissionPayments, InsertCommissionPayment, CommissionPayment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle<any>> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  // Preferir NEON_DATABASE_URL se disponível, senão usar DATABASE_URL
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  console.log('[Database] getDb() called, _db:', !!_db, 'Using:', process.env.NEON_DATABASE_URL ? 'NEON' : 'default');
  if (!_db && dbUrl) {
    try {
      console.log('[Database] Creating pool with URL:', dbUrl.slice(0, 80) + '...');
      const pool = new Pool({
        connectionString: dbUrl || '',
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      });
      console.log('[Database] Pool created successfully');
      _db = drizzle(pool);
      console.log('[Database] Drizzle instance created successfully');
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db || null;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date() as any;
    }

    // For PostgreSQL, use onConflict instead of onDuplicateKeyUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// CLIENTS QUERIES
// ============================================

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result;
}

export async function getClientById(id: number): Promise<InsertClient | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function getClientsByUserId(userId: number, filters?: {
  status?: string;
  searchTerm?: string;
  city?: string;
  isActive?: boolean;
  consultantId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  // SHARED DATA: Removed userId filter - all users see all clients
  const conditions: any[] = [];
  
  if (filters?.status) {
    // Mapear "filtered" para "contacted" (status real no banco)
    const mappedStatus = filters.status === "filtered" ? "contacted" : filters.status;
    conditions.push(eq(clients.contractStatus, mappedStatus as any));
  }
  
  if (filters?.city) {
    conditions.push(eq(clients.city, filters.city));
  }
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(clients.isActive, filters.isActive));
  }
  
  if (filters?.consultantId !== undefined) {
    conditions.push(eq(clients.consultantId, filters.consultantId));
  }
  
  const results = await db.select().from(clients).where(
    conditions.length > 1 ? and(...conditions) : conditions[0]
  );
  
  // Filter by search term if provided
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    return results.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.boxName.toLowerCase().includes(term)
    );
  }
  
  return results;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
  return getClientById(id);
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}

export async function getClientsByStatus(userId: number, status: string) {
  const db = await getDb();
  if (!db) return [];
  // SHARED DATA: Removed userId filter - all users see all clients
  const result = await db.select().from(clients)
    .where(eq(clients.contractStatus, status as any));
  return result;
}

export async function getOverdueRecontacts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  // SHARED DATA: Removed userId filter - all users see all clients
  const result = await db.select().from(clients)
    .where(and(
      eq(clients.isActive, true),
      sqlFn`nextContactDate <= ${now}`
    ));
  return result;
}

// ============================================
// INTERACTIONS QUERIES
// ============================================

export async function createInteraction(data: InsertInteraction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(interactions).values(data);
  return result;
}

export async function getInteractionsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(interactions)
    .where(eq(interactions.clientId, clientId))
    .orderBy(desc(interactions.createdAt));
  return result;
}

// ============================================
// LEADS QUERIES
// ============================================

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(data);
  return result;
}

export async function getLeadsByUserId(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // SHARED DATA: Removed userId filter - all users see all leads
  const conditions: any[] = [];
  
  if (status) {
    conditions.push(eq(leads.status, status as any));
  }
  
  return await db.select().from(leads).where(
    conditions.length > 1 ? and(...conditions) : conditions[0]
  );
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
  return db.select().from(leads).where(eq(leads.id, id)).limit(1).then(r => r[0]);
}

export async function getLeadByGooglePlaceId(googlePlaceId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads)
    .where(eq(leads.googlePlaceId, googlePlaceId))
    .limit(1);
  return result[0];
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(leads).where(eq(leads.id, id));
}

// ============================================
// EMAIL NOTIFICATIONS QUERIES
// ============================================

export async function createEmailNotification(data: InsertEmailNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailNotifications).values(data);
  return result;
}

export async function getUnsentNotifications(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(emailNotifications)
    .where(eq(emailNotifications.sent, false))
    .limit(limit);
  return result;
}

export async function updateEmailNotification(id: number, data: Partial<InsertEmailNotification>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailNotifications).set(data).where(eq(emailNotifications.id, id));
}

// ============================================
// FINANCIALS QUERIES
// ============================================

export async function getFinancialByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(financials)
    .where(eq(financials.clientId, clientId))
    .limit(1);
  return result[0] || null;
}

export async function createOrUpdateFinancial(data: InsertFinancial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getFinancialByClientId(data.clientId!);
  
  if (existing) {
    await db.update(financials)
      .set(data)
      .where(eq(financials.clientId, data.clientId!));
    return await getFinancialByClientId(data.clientId!);
  } else {
    await db.insert(financials).values(data);
    return await getFinancialByClientId(data.clientId!);
  }
}

export async function updateFinancial(clientId: number, data: Partial<InsertFinancial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getFinancialByClientId(clientId);
  
  if (existing) {
    // Atualizar registro existente
    await db.update(financials).set(data).where(eq(financials.clientId, clientId));
  } else {
    // Criar novo registro se não existir
    const insertData: InsertFinancial = {
      clientId,
      userId: data.userId || 0,
      pricePerUser: data.pricePerUser || "0.00",
      contractedUsers: data.contractedUsers || 0,
      totalAmount: data.totalAmount || "0.00",
      paymentStatus: data.paymentStatus || "pending",
      dueDate: data.dueDate,
      paidDate: data.paidDate,
      notes: data.notes,
    };
    await db.insert(financials).values(insertData);
  }
  
  return await getFinancialByClientId(clientId);
}

export async function getFinancialsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // SHARED DATA: Removed userId filter - all users see all financials
  return await db.select().from(financials);
}

export async function getFinancialsByPaymentStatus(userId: number, status: string) {
  const db = await getDb();
  if (!db) return [];
  // SHARED DATA: Removed userId filter - all users see all financials
  const result = await db.select().from(financials)
    .where(and(
      eq(financials.paymentStatus, status as any)
    )
  );
  return result;
}


// ============ CONSULTORES ============

export async function createConsultant(data: InsertConsultant): Promise<Consultant> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(consultants).values(data).returning();
  return result[0];
}

export async function getConsultantsByUserId(userId: number): Promise<Consultant[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(consultants).where(eq(consultants.userId, userId));
}

export async function getConsultantById(id: number): Promise<Consultant | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(consultants).where(eq(consultants.id, id));
  return result[0];
}

export async function updateConsultant(id: number, data: Partial<InsertConsultant>): Promise<Consultant> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(consultants).set(data).where(eq(consultants.id, id));
  
  const result = await db.select().from(consultants).where(eq(consultants.id, id));
  return result[0];
}

export async function deleteConsultant(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(consultants).where(eq(consultants.id, id));
}

export async function getAllConsultants(): Promise<Consultant[]> {
  const db = await getDb();
  if (!db) return [];
  
  // SHARED DATA: Return all consultants regardless of userId
  return await db.select().from(consultants);
}

// Deletar financeiros por clientId
export async function deleteFinancialsByClientId(clientId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(financials).where(eq(financials.clientId, clientId));
}

// Deletar financeiro por ID
export async function deleteFinancial(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(financials).where(eq(financials.id, id));
}

// ============================================
// COBRANÇAS MENSAIS (monthlyPayments)
// ============================================

// Criar uma cobrança mensal para um BOX
export async function createMonthlyPayment(data: InsertMonthlyPayment): Promise<MonthlyPayment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(monthlyPayments).values(data).returning();
  return result[0];
}

// Buscar cobranças mensais por clientId
export async function getMonthlyPaymentsByClientId(clientId: number): Promise<MonthlyPayment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(monthlyPayments)
    .where(eq(monthlyPayments.clientId, clientId))
    .orderBy(desc(monthlyPayments.referenceMonth));
}

// Buscar cobranças mensais por mês de referência
export async function getMonthlyPaymentsByMonth(referenceMonth: string): Promise<MonthlyPayment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(monthlyPayments)
    .where(eq(monthlyPayments.referenceMonth, referenceMonth))
    .orderBy(desc(monthlyPayments.createdAt));
}

// Buscar todas as cobranças mensais (com filtros opcionais)
export async function getAllMonthlyPayments(filters?: {
  referenceMonth?: string;
  paymentStatus?: string;
  consultantId?: number;
}): Promise<MonthlyPayment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  if (filters?.referenceMonth) conditions.push(eq(monthlyPayments.referenceMonth, filters.referenceMonth));
  if (filters?.paymentStatus) conditions.push(eq(monthlyPayments.paymentStatus, filters.paymentStatus as any));
  if (filters?.consultantId) conditions.push(eq(monthlyPayments.consultantId, filters.consultantId));

  const query = db.select().from(monthlyPayments);
  if (conditions.length > 0) {
    return await query.where(and(...conditions)).orderBy(desc(monthlyPayments.referenceMonth));
  }
  return await query.orderBy(desc(monthlyPayments.referenceMonth));
}

// Atualizar status de pagamento de uma cobrança mensal
export async function updateMonthlyPayment(id: number, data: Partial<InsertMonthlyPayment>): Promise<MonthlyPayment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(monthlyPayments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(monthlyPayments.id, id))
    .returning();
  return result[0];
}

// Deletar cobrança mensal
export async function deleteMonthlyPayment(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(monthlyPayments).where(eq(monthlyPayments.id, id));
}

// Verificar se já existe cobrança para o mês/cliente
export async function getMonthlyPaymentByClientAndMonth(clientId: number, referenceMonth: string): Promise<MonthlyPayment | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(monthlyPayments)
    .where(and(
      eq(monthlyPayments.clientId, clientId),
      eq(monthlyPayments.referenceMonth, referenceMonth)
    ));
  return result[0];
}

// ============================================
// COMISSÕES DOS CONSULTORES (commissionPayments)
// ============================================

// Criar comissão para um consultor
export async function createCommissionPayment(data: InsertCommissionPayment): Promise<CommissionPayment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(commissionPayments).values(data).returning();
  return result[0];
}

// Buscar comissões por consultor
export async function getCommissionsByConsultantId(consultantId: number): Promise<CommissionPayment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(commissionPayments)
    .where(eq(commissionPayments.consultantId, consultantId))
    .orderBy(desc(commissionPayments.referenceMonth));
}

// Buscar comissões por mês
export async function getCommissionsByMonth(referenceMonth: string): Promise<CommissionPayment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(commissionPayments)
    .where(eq(commissionPayments.referenceMonth, referenceMonth))
    .orderBy(desc(commissionPayments.createdAt));
}

// Buscar todas as comissões
export async function getAllCommissions(filters?: {
  referenceMonth?: string;
  consultantId?: number;
  paid?: boolean;
}): Promise<CommissionPayment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  if (filters?.referenceMonth) conditions.push(eq(commissionPayments.referenceMonth, filters.referenceMonth));
  if (filters?.consultantId) conditions.push(eq(commissionPayments.consultantId, filters.consultantId));
  if (filters?.paid !== undefined) conditions.push(eq(commissionPayments.paid, filters.paid));

  const query = db.select().from(commissionPayments);
  if (conditions.length > 0) {
    return await query.where(and(...conditions)).orderBy(desc(commissionPayments.referenceMonth));
  }
  return await query.orderBy(desc(commissionPayments.referenceMonth));
}

// Atualizar comissão (ex: marcar como paga)
export async function updateCommissionPayment(id: number, data: Partial<InsertCommissionPayment>): Promise<CommissionPayment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(commissionPayments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(commissionPayments.id, id))
    .returning();
  return result[0];
}

// Verificar se já existe comissão para o mês/consultor/cliente
export async function getCommissionByConsultantClientMonth(consultantId: number, clientId: number, referenceMonth: string): Promise<CommissionPayment | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(commissionPayments)
    .where(and(
      eq(commissionPayments.consultantId, consultantId),
      eq(commissionPayments.clientId, clientId),
      eq(commissionPayments.referenceMonth, referenceMonth)
    ));
  return result[0];
}
