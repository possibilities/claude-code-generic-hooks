export const activityMigrations = {
  journal: {
    version: '6',
    dialect: 'sqlite',
    entries: [
      {
        idx: 0,
        version: '6',
        when: Date.now(),
        tag: '0001_activity_table',
        breakpoints: true,
      },
    ],
  },
  migrations: {
    '0001_activity_table': `CREATE TABLE \`activities\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`action\` text NOT NULL,
\t\`project\` text NOT NULL,
\t\`data\` text NOT NULL,
\t\`cwd\` text NOT NULL,
\t\`created\` integer DEFAULT (unixepoch()) NOT NULL
);

-- Index for efficient "find latest start" queries
CREATE INDEX \`idx_activities_created\` ON \`activities\` (\`created\`);`,
  },
}
