CREATE TYPE "public"."contractStatus" AS ENUM('pending', 'contacted', 'awaiting_response', 'contracted');--> statement-breakpoint
CREATE TYPE "public"."emailNotificationType" AS ENUM('recontact_reminder', 'overdue_contact', 'contract_reminder');--> statement-breakpoint
CREATE TYPE "public"."interactionOutcome" AS ENUM('positive', 'negative', 'neutral', 'pending');--> statement-breakpoint
CREATE TYPE "public"."interactionType" AS ENUM('call', 'message', 'email', 'meeting', 'note');--> statement-breakpoint
CREATE TYPE "public"."leadStatus" AS ENUM('new', 'contacted', 'imported', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."leadType" AS ENUM('crossfit_box', 'studio', 'functional', 'gym');--> statement-breakpoint
CREATE TYPE "public"."paymentStatus" AS ENUM('pending', 'partial', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"boxName" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(100) DEFAULT 'Belo Horizonte',
	"totalClients" integer DEFAULT 0 NOT NULL,
	"contractedClients" integer DEFAULT 0 NOT NULL,
	"contractStatus" "contractStatus" DEFAULT 'pending' NOT NULL,
	"contactDate" timestamp,
	"nextContactDate" timestamp,
	"contractDate" timestamp,
	"observations" text,
	"capturedBy" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastContactedAt" timestamp,
	"isActive" boolean DEFAULT true,
	"isLead" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "consultants" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"commissionRate" numeric(5, 2) DEFAULT '5.00',
	"active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emailNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" serial NOT NULL,
	"userId" serial NOT NULL,
	"type" "emailNotificationType" NOT NULL,
	"recipientEmail" varchar(320) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text,
	"sent" boolean DEFAULT false,
	"sentAt" timestamp,
	"opened" boolean DEFAULT false,
	"openedAt" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lastAttemptAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financials" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" serial NOT NULL,
	"userId" serial NOT NULL,
	"pricePerUser" numeric(10, 2) DEFAULT '0.00',
	"contractedUsers" integer DEFAULT 0 NOT NULL,
	"totalAmount" numeric(10, 2) DEFAULT '0.00',
	"paymentStatus" "paymentStatus" DEFAULT 'pending' NOT NULL,
	"dueDate" timestamp,
	"paidDate" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "financials_clientId_unique" UNIQUE("clientId")
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" serial NOT NULL,
	"userId" serial NOT NULL,
	"type" "interactionType" NOT NULL,
	"description" text NOT NULL,
	"notes" text,
	"outcome" "interactionOutcome" DEFAULT 'neutral' NOT NULL,
	"nextAction" text,
	"nextActionDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"googlePlaceId" varchar(255),
	"name" varchar(255) NOT NULL,
	"address" text,
	"phone" varchar(20),
	"website" varchar(255),
	"latitude" varchar(50),
	"longitude" varchar(50),
	"city" varchar(100) DEFAULT 'Belo Horizonte',
	"type" "leadType" NOT NULL,
	"rating" varchar(10),
	"reviewCount" integer DEFAULT 0 NOT NULL,
	"status" "leadStatus" DEFAULT 'new' NOT NULL,
	"convertedToClientId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leads_googlePlaceId_unique" UNIQUE("googlePlaceId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE INDEX "clientsUserIdIdx" ON "clients" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "contractStatusIdx" ON "clients" USING btree ("contractStatus");--> statement-breakpoint
CREATE INDEX "nextContactDateIdx" ON "clients" USING btree ("nextContactDate");--> statement-breakpoint
CREATE INDEX "cityIdx" ON "clients" USING btree ("city");--> statement-breakpoint
CREATE INDEX "consultantUserIdIdx" ON "consultants" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "consultantEmailIdx" ON "consultants" USING btree ("email");--> statement-breakpoint
CREATE INDEX "consultantActiveIdx" ON "consultants" USING btree ("active");--> statement-breakpoint
CREATE INDEX "emailNotificationsClientIdIdx" ON "emailNotifications" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "emailNotificationsUserIdIdx" ON "emailNotifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sentIdx" ON "emailNotifications" USING btree ("sent");--> statement-breakpoint
CREATE INDEX "emailNotificationsTypeIdx" ON "emailNotifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "financialClientIdIdx" ON "financials" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "financialUserIdIdx" ON "financials" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "financialPaymentStatusIdx" ON "financials" USING btree ("paymentStatus");--> statement-breakpoint
CREATE INDEX "interactionsClientIdIdx" ON "interactions" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "interactionsUserIdIdx" ON "interactions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "interactionsCreatedAtIdx" ON "interactions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "leadsUserIdIdx" ON "leads" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "googlePlaceIdIdx" ON "leads" USING btree ("googlePlaceId");--> statement-breakpoint
CREATE INDEX "leadsStatusIdx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leadsTypeIdx" ON "leads" USING btree ("type");