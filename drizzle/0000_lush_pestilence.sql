CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`cwd` text NOT NULL,
	`created` integer DEFAULT (unixepoch()) NOT NULL,
	`session_id` text GENERATED ALWAYS AS (json_extract(`data`, '$.session_id')) STORED
);

-- Performance indexes based on optimization guide
CREATE INDEX `idx_entries_cwd` ON `entries` (`cwd`);
CREATE INDEX `idx_entries_created` ON `entries` (`created`);
CREATE INDEX `idx_entries_cwd_created` ON `entries` (`cwd`, `created`);
CREATE INDEX `idx_entries_session_id` ON `entries` (`session_id`);
CREATE INDEX `idx_entries_cwd_session_id` ON `entries` (`cwd`, `session_id`);
CREATE INDEX `idx_entries_cwd_session_created` ON `entries` (`cwd`, `session_id`, `created`);