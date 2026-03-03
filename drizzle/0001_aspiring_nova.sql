CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`boxName` varchar(255) NOT NULL,
	`address` text,
	`city` varchar(100) DEFAULT 'Belo Horizonte',
	`totalClients` int DEFAULT 0,
	`contractedClients` int DEFAULT 0,
	`contractStatus` enum('pending','contacted','awaiting_response','contracted') NOT NULL DEFAULT 'pending',
	`contactDate` timestamp,
	`nextContactDate` timestamp,
	`contractDate` timestamp,
	`observations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastContactedAt` timestamp,
	`isActive` boolean DEFAULT true,
	`isLead` boolean DEFAULT false,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('recontact_reminder','overdue_contact','contract_reminder') NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text,
	`sent` boolean DEFAULT false,
	`sentAt` timestamp,
	`opened` boolean DEFAULT false,
	`openedAt` timestamp,
	`attempts` int DEFAULT 0,
	`lastAttemptAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('call','message','email','meeting','note') NOT NULL,
	`description` text NOT NULL,
	`notes` text,
	`outcome` enum('positive','negative','neutral','pending') DEFAULT 'neutral',
	`nextAction` text,
	`nextActionDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`googlePlaceId` varchar(255),
	`name` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(20),
	`website` varchar(255),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`city` varchar(100) DEFAULT 'Belo Horizonte',
	`type` enum('crossfit_box','studio','functional','gym') NOT NULL,
	`rating` decimal(3,2),
	`reviewCount` int DEFAULT 0,
	`status` enum('new','contacted','imported','rejected') DEFAULT 'new',
	`convertedToClientId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `leads_googlePlaceId_unique` UNIQUE(`googlePlaceId`)
);
--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `clients` (`userId`);--> statement-breakpoint
CREATE INDEX `contractStatusIdx` ON `clients` (`contractStatus`);--> statement-breakpoint
CREATE INDEX `nextContactDateIdx` ON `clients` (`nextContactDate`);--> statement-breakpoint
CREATE INDEX `cityIdx` ON `clients` (`city`);--> statement-breakpoint
CREATE INDEX `clientIdIdx` ON `emailNotifications` (`clientId`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `emailNotifications` (`userId`);--> statement-breakpoint
CREATE INDEX `sentIdx` ON `emailNotifications` (`sent`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `emailNotifications` (`type`);--> statement-breakpoint
CREATE INDEX `clientIdIdx` ON `interactions` (`clientId`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `interactions` (`userId`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `interactions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `leads` (`userId`);--> statement-breakpoint
CREATE INDEX `googlePlaceIdIdx` ON `leads` (`googlePlaceId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `leads` (`type`);