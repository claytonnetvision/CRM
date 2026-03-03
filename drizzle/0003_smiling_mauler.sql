CREATE TABLE `financials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`pricePerUser` decimal(10,2) DEFAULT '0.00',
	`contractedUsers` int DEFAULT 0,
	`totalAmount` decimal(10,2) DEFAULT '0.00',
	`paymentStatus` enum('pending','partial','paid','overdue') DEFAULT 'pending',
	`dueDate` timestamp,
	`paidDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financials_id` PRIMARY KEY(`id`),
	CONSTRAINT `financials_clientId_unique` UNIQUE(`clientId`)
);
--> statement-breakpoint
CREATE INDEX `financialClientIdIdx` ON `financials` (`clientId`);--> statement-breakpoint
CREATE INDEX `financialUserIdIdx` ON `financials` (`userId`);--> statement-breakpoint
CREATE INDEX `financialPaymentStatusIdx` ON `financials` (`paymentStatus`);