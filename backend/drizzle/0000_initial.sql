CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`department` text NOT NULL,
	`job_title` text NOT NULL,
	`country` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_employees_department` ON `employees` (`department`);--> statement-breakpoint
CREATE INDEX `idx_employees_country` ON `employees` (`country`);--> statement-breakpoint
CREATE TABLE `compensation_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` text NOT NULL,
	`base_salary` real NOT NULL,
	`currency` text NOT NULL,
	`effective_date` text NOT NULL,
	`reason` text NOT NULL,
	`changed_by` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
