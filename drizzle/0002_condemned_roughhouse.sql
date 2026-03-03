ALTER TABLE "leads" ALTER COLUMN "reviewCount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "reviewCount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "convertedToClientId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "convertedToClientId" DROP NOT NULL;