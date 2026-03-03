import {
  serial,
  integer,
  pgTable,
  pgEnum,
  text, 
  timestamp, 
  varchar,
  boolean,
  numeric,
  index
} from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clientes - Tabela principal para gerenciar Boxes, Studios e Funcionais
 */
export const contractStatusEnum = pgEnum("contractStatus", [
  "pending",
  "contacted",
  "awaiting_response",
  "contracted"
]);

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: serial("userId").notNull(),
  
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  boxName: varchar("boxName", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }).default("Belo Horizonte"),
  
  totalClients: integer("totalClients").default(0),
  contractedClients: integer("contractedClients").default(0),
  contractStatus: contractStatusEnum("contractStatus").notNull().default("pending"),
  
  contactDate: timestamp("contactDate"),
  nextContactDate: timestamp("nextContactDate"),
  contractDate: timestamp("contractDate"),
  
  observations: text("observations"),
  capturedBy: varchar("capturedBy", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
  
  isActive: boolean("isActive").default(true),
  isLead: boolean("isLead").default(false),

  // Campos de contrato e cobrança recorrente
  pricePerUser: numeric("pricePerUser", { precision: 10, scale: 2 }).default("0.00"),
  dueDay: integer("dueDay").default(10), // Dia do mês para vencimento (1-31)
  consultantId: integer("consultantId"),  // Consultor responsável pelo fechamento
}, (table) => ({
  clientsUserIdIdx: index("clientsUserIdIdx").on(table.userId),
  contractStatusIdx: index("contractStatusIdx").on(table.contractStatus),
  nextContactDateIdx: index("nextContactDateIdx").on(table.nextContactDate),
  cityIdx: index("cityIdx").on(table.city),
}));

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Histórico de Interações
 */
export const interactionTypeEnum = pgEnum("interactionType", [
  "call",
  "message",
  "email",
  "meeting",
  "note"
]);

export const interactionOutcomeEnum = pgEnum("interactionOutcome", [
  "positive",
  "negative",
  "neutral",
  "pending"
]);

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  clientId: serial("clientId").notNull(),
  userId: serial("userId").notNull(),
  
  type: interactionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  outcome: interactionOutcomeEnum("outcome").notNull().default("neutral"),
  
  nextAction: text("nextAction"),
  nextActionDate: timestamp("nextActionDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  interactionsClientIdIdx: index("interactionsClientIdIdx").on(table.clientId),
  interactionsUserIdIdx: index("interactionsUserIdIdx").on(table.userId),
  interactionsCreatedAtIdx: index("interactionsCreatedAtIdx").on(table.createdAt),
}));

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

/**
 * Leads
 */
export const leadTypeEnum = pgEnum("leadType", [
  "crossfit_box",
  "studio",
  "functional",
  "gym"
]);

export const leadStatusEnum = pgEnum("leadStatus", [
  "new",
  "contacted",
  "imported",
  "rejected"
]);

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: serial("userId").notNull(),
  
  googlePlaceId: varchar("googlePlaceId", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  city: varchar("city", { length: 100 }).default("Belo Horizonte"),
  
  type: leadTypeEnum("type").notNull(),
  rating: varchar("rating", { length: 10 }),
  reviewCount: integer("reviewCount").default(0),
  
  status: leadStatusEnum("status").notNull().default("new"),
  convertedToClientId: integer("convertedToClientId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  leadsUserIdIdx: index("leadsUserIdIdx").on(table.userId),
  googlePlaceIdIdx: index("googlePlaceIdIdx").on(table.googlePlaceId),
  leadsStatusIdx: index("leadsStatusIdx").on(table.status),
  leadsTypeIdx: index("leadsTypeIdx").on(table.type),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Notificações de Email
 */
export const emailNotificationTypeEnum = pgEnum("emailNotificationType", [
  "recontact_reminder",
  "overdue_contact",
  "contract_reminder"
]);

export const emailNotifications = pgTable("emailNotifications", {
  id: serial("id").primaryKey(),
  clientId: serial("clientId").notNull(),
  userId: serial("userId").notNull(),
  
  type: emailNotificationTypeEnum("type").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body"),
  
  sent: boolean("sent").default(false),
  sentAt: timestamp("sentAt"),
  opened: boolean("opened").default(false),
  openedAt: timestamp("openedAt"),
  
  attempts: serial("attempts").default(0),
  lastAttemptAt: timestamp("lastAttemptAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  emailNotificationsClientIdIdx: index("emailNotificationsClientIdIdx").on(table.clientId),
  emailNotificationsUserIdIdx: index("emailNotificationsUserIdIdx").on(table.userId),
  sentIdx: index("sentIdx").on(table.sent),
  emailNotificationsTypeIdx: index("emailNotificationsTypeIdx").on(table.type),
}));

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

/**
 * Financeiro - Configuração base por cliente (valor negociado)
 */
export const paymentStatusEnum = pgEnum("paymentStatus", [
  "pending",
  "partial",
  "paid",
  "overdue"
]);

export const financials = pgTable("financials", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().unique(),
  userId: integer("userId").notNull(),
  
  pricePerUser: numeric("pricePerUser", { precision: 10, scale: 2 }).default("0.00"),
  contractedUsers: integer("contractedUsers").default(0),
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).default("0.00"),
  
  paymentStatus: paymentStatusEnum("paymentStatus").notNull().default("pending"),
  
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  financialClientIdIdx: index("financialClientIdIdx").on(table.clientId),
  financialUserIdIdx: index("financialUserIdIdx").on(table.userId),
  financialPaymentStatusIdx: index("financialPaymentStatusIdx").on(table.paymentStatus),
}));

export type Financial = typeof financials.$inferSelect;
export type InsertFinancial = typeof financials.$inferInsert;

/**
 * Cobranças Mensais - Registro de cada mensalidade por BOX
 */
export const monthlyPayments = pgTable("monthlyPayments", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull(),
  userId: integer("userId").notNull(),
  consultantId: integer("consultantId"),

  // Mês de referência (ex: 2026-03)
  referenceMonth: varchar("referenceMonth", { length: 7 }).notNull(), // formato: YYYY-MM
  referenceYear: integer("referenceYear").notNull(),

  // Valores da cobrança
  pricePerUser: numeric("pricePerUser", { precision: 10, scale: 2 }).notNull(),
  contractedUsers: integer("contractedUsers").notNull().default(0),
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),

  // Status e datas
  paymentStatus: paymentStatusEnum("paymentStatus").notNull().default("pending"),
  dueDate: timestamp("dueDate").notNull(),
  paidDate: timestamp("paidDate"),
  paidAmount: numeric("paidAmount", { precision: 10, scale: 2 }),

  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  monthlyPaymentsClientIdx: index("monthlyPaymentsClientIdx").on(table.clientId),
  monthlyPaymentsMonthIdx: index("monthlyPaymentsMonthIdx").on(table.referenceMonth),
  monthlyPaymentsStatusIdx: index("monthlyPaymentsStatusIdx").on(table.paymentStatus),
  monthlyPaymentsConsultantIdx: index("monthlyPaymentsConsultantIdx").on(table.consultantId),
}));

export type MonthlyPayment = typeof monthlyPayments.$inferSelect;
export type InsertMonthlyPayment = typeof monthlyPayments.$inferInsert;

/**
 * Comissões Mensais dos Consultores
 */
export const commissionPayments = pgTable("commissionPayments", {
  id: serial("id").primaryKey(),
  consultantId: integer("consultantId").notNull(),
  monthlyPaymentId: integer("monthlyPaymentId").notNull(),
  clientId: integer("clientId").notNull(),

  referenceMonth: varchar("referenceMonth", { length: 7 }).notNull(),
  referenceYear: integer("referenceYear").notNull(),

  // Base de cálculo
  contractedUsers: integer("contractedUsers").notNull().default(0),
  commissionPerUser: numeric("commissionPerUser", { precision: 10, scale: 2 }).notNull(),
  totalCommission: numeric("totalCommission", { precision: 10, scale: 2 }).notNull(),

  // Status de pagamento da comissão
  paid: boolean("paid").default(false),
  paidDate: timestamp("paidDate"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  commissionPaymentsConsultantIdx: index("commissionPaymentsConsultantIdx").on(table.consultantId),
  commissionPaymentsMonthIdx: index("commissionPaymentsMonthIdx").on(table.referenceMonth),
  commissionPaymentsClientIdx: index("commissionPaymentsClientIdx").on(table.clientId),
}));

export type CommissionPayment = typeof commissionPayments.$inferSelect;
export type InsertCommissionPayment = typeof commissionPayments.$inferInsert;

/**
 * Consultores
 */
export const consultants = pgTable("consultants", {
  id: serial("id").primaryKey(),
  userId: serial("userId").notNull(),
  
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  
  commissionRate: numeric("commissionRate", { precision: 5, scale: 2 }).default("5.00"),
  
  active: boolean("active").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  consultantsUserIdIdx: index("consultantUserIdIdx").on(table.userId),
  consultantsEmailIdx: index("consultantEmailIdx").on(table.email),
  consultantsActiveIdx: index("consultantActiveIdx").on(table.active),
}));

export type Consultant = typeof consultants.$inferSelect;
export type InsertConsultant = typeof consultants.$inferInsert;
