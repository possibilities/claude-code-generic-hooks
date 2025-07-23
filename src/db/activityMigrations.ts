export const activityMigrations = {
  journal: {
    version: '6',
    dialect: 'sqlite',
    entries: [
      {
        idx: 0,
        version: '6',
        when: Date.now(),
        tag: '0001_activity_and_records_tables',
        breakpoints: true,
      },
    ],
  },
  migrations: {
    '0001_activity_and_records_tables': `CREATE TABLE \`activities\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`action\` text NOT NULL,
\t\`project\` text NOT NULL,
\t\`data\` text NOT NULL,
\t\`cwd\` text NOT NULL,
\t\`created\` integer DEFAULT (unixepoch()) NOT NULL
);

-- Index for efficient "find latest start" queries
CREATE INDEX \`idx_activities_created\` ON \`activities\` (\`created\`);
CREATE INDEX \`idx_activities_action_project\` ON \`activities\` (\`action\`, \`project\`);

CREATE TABLE \`activity_records\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`project\` text NOT NULL UNIQUE,
\t\`longest_duration_ms\` integer NOT NULL,
\t\`record_set_at\` integer DEFAULT (unixepoch()) NOT NULL,
\t\`activity_start_id\` text NOT NULL,
\t\`activity_stop_id\` text NOT NULL
);

CREATE TABLE \`global_activity_record\` (
\t\`id\` text PRIMARY KEY DEFAULT 'global',
\t\`longest_duration_ms\` integer NOT NULL,
\t\`record_set_at\` integer DEFAULT (unixepoch()) NOT NULL,
\t\`project\` text NOT NULL,
\t\`activity_start_id\` text NOT NULL,
\t\`activity_stop_id\` text NOT NULL
);`,
  },
}
