CREATE TABLE "commissionPayments" (
	"id" serial PRIMARY KEY NOT NULL,
	"consultantId" integer NOT NULL,
	"monthlyPaymentId" integer NOT NULL,
	"clientId" integer NOT NULL,
	"referenceMonth" varchar(7) NOT NULL,
	"referenceYear" integer NOT NULL,
	"contractedUsers" integer DEFAULT 0 NOT NULL,
	"commissionPerUser" numeric(10, 2) NOT NULL,
	"totalCommission" numeric(10, 2) NOT NULL,
	"paid" boolean DEFAULT false,
	"paidDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthlyPayments" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"userId" integer NOT NULL,
	"consultantId" integer,
	"referenceMonth" varchar(7) NOT NULL,
	"referenceYear" integer NOT NULL,
	"pricePerUser" numeric(10, 2) NOT NULL,
	"contractedUsers" integer DEFAULT 0 NOT NULL,
	"totalAmount" numeric(10, 2) NOT NULL,
	"paymentStatus" "paymentStatus" DEFAULT 'pending' NOT NULL,
	"dueDate" timestamp NOT NULL,
	"paidDate" timestamp,
	"paidAmount" numeric(10, 2),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financials" ALTER COLUMN "clientId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "financials" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "financials" ALTER COLUMN "contractedUsers" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "financials" ALTER COLUMN "contractedUsers" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "pricePerUser" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "dueDay" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "consultantId" integer;--> statement-breakpoint
CREATE INDEX "commissionPaymentsConsultantIdx" ON "commissionPayments" USING btree ("consultantId");--> statement-breakpoint
CREATE INDEX "commissionPaymentsMonthIdx" ON "commissionPayments" USING btree ("referenceMonth");--> statement-breakpoint
CREATE INDEX "commissionPaymentsClientIdx" ON "commissionPayments" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "monthlyPaymentsClientIdx" ON "monthlyPayments" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "monthlyPaymentsMonthIdx" ON "monthlyPayments" USING btree ("referenceMonth");--> statement-breakpoint
CREATE INDEX "monthlyPaymentsStatusIdx" ON "monthlyPayments" USING btree ("paymentStatus");--> statement-breakpoint
CREATE INDEX "monthlyPaymentsConsultantIdx" ON "monthlyPayments" USING btree ("consultantId");