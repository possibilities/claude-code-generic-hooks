import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  project: text('project').notNull(),
  data: text('data').notNull(),
  cwd: text('cwd').notNull(),
  created: integer('created', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
