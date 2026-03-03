CREATE TABLE `consultants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`commissionRate` decimal(5,2) DEFAULT '5.00',
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `consultantUserIdIdx` ON `consultants` (`userId`);--> statement-breakpoint
CREATE INDEX `consultantEmailIdx` ON `consultants` (`email`);--> statement-breakpoint
CREATE INDEX `consultantActiveIdx` ON `consultants` (`active`);