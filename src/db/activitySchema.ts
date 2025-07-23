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

export const activityRecords = sqliteTable('activity_records', {
  id: text('id').primaryKey(),
  project: text('project').notNull().unique(),
  longestDurationMs: integer('longest_duration_ms').notNull(),
  recordSetAt: integer('record_set_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  activityStartId: text('activity_start_id').notNull(),
  activityStopId: text('activity_stop_id').notNull(),
})

export const globalActivityRecord = sqliteTable('global_activity_record', {
  id: text('id').primaryKey().default('global'),
  longestDurationMs: integer('longest_duration_ms').notNull(),
  recordSetAt: integer('record_set_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  project: text('project').notNull(),
  activityStartId: text('activity_start_id').notNull(),
  activityStopId: text('activity_stop_id').notNull(),
})
