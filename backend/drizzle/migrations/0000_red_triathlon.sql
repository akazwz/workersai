CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`pinned` integer DEFAULT false,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `conversation_user_id` ON `conversations` (`user_id`);--> statement-breakpoint
CREATE INDEX `conversation_pinned` ON `conversations` (`pinned`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `message_conversation_id` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `message_user_id` ON `messages` (`user_id`);