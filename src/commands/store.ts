import { existsSync } from 'fs'
import { dirname } from 'path'
import { mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { ulid } from 'ulid'
import { entries } from '../db/schema.js'
import { migrations } from '../db/migrations.js'

export async function storeCommand(dbPath: string): Promise<void> {
  const absolutePath = dbPath.startsWith('/')
    ? dbPath
    : `${process.cwd()}/${dbPath}`
  const dbDir = dirname(absolutePath)

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const sqlite = new Database(absolutePath)
  const db = drizzle(sqlite)

  if (
    !existsSync(absolutePath) ||
    sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='entries'",
      )
      .get() === undefined
  ) {
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        created_at INTEGER
      )
    `
    sqlite.prepare(createMigrationsTable).run()

    for (const [tag, sql] of Object.entries(migrations.migrations)) {
      const hash = tag
      const existing = sqlite
        .prepare('SELECT hash FROM __drizzle_migrations WHERE hash = ?')
        .get(hash)

      if (!existing) {
        sqlite.prepare(sql).run()
        sqlite
          .prepare(
            'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
          )
          .run(hash, Date.now())
      }
    }
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    process.stdin.on('data', chunk => {
      chunks.push(chunk)
    })

    process.stdin.on('end', async () => {
      try {
        const jsonData = Buffer.concat(chunks).toString().trim()

        if (!jsonData) {
          console.error('Error: No JSON data received from stdin')
          sqlite.close()
          process.exit(1)
        }

        try {
          JSON.parse(jsonData)
        } catch (error) {
          console.error('Error: Invalid JSON data received from stdin')
          sqlite.close()
          process.exit(1)
        }

        const id = ulid()

        await db.insert(entries).values({
          id,
          data: jsonData,
          cwd: process.cwd(),
          created: new Date(),
        })

        console.log(`Stored entry with ID: ${id}`)
        sqlite.close()
        resolve()
      } catch (error) {
        console.error('Error:', error)
        sqlite.close()
        reject(error)
      }
    })

    process.stdin.on('error', error => {
      console.error('Error reading from stdin:', error.message)
      sqlite.close()
      reject(error)
    })
  })
}
