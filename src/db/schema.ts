import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const entries = sqliteTable('entries', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  created: integer('created', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
