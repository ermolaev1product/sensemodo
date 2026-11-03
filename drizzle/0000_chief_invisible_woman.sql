CREATE TABLE `traffic_events_v2` (
	`id` text PRIMARY KEY NOT NULL,
	`occurred_at` text NOT NULL,
	`day_tbilisi` text NOT NULL,
	`visitor` text NOT NULL,
	`path` text NOT NULL,
	`source` text NOT NULL,
	`active_seconds` integer DEFAULT 0 NOT NULL,
	`is_test` integer DEFAULT 0 NOT NULL,
	`schema_version` integer DEFAULT 2 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `traffic_events_v2_day_idx` ON `traffic_events_v2` (`day_tbilisi`);