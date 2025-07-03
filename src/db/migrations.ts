export const migrations = {
  journal: {
    version: '6',
    dialect: 'sqlite',
    entries: [
      {
        idx: 0,
        version: '6',
        when: 1751582970917,
        tag: '0000_lush_pestilence',
        breakpoints: true,
      },
    ],
  },
  migrations: {
    '0000_lush_pestilence': `CREATE TABLE \`entries\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`data\` text NOT NULL,
\t\`cwd\` text NOT NULL,
\t\`created\` integer DEFAULT (unixepoch()) NOT NULL
);`,
  },
}
