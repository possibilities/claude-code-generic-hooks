import { existsSync } from 'fs'
import { dirname } from 'path'
import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import { join } from 'path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { desc, eq } from 'drizzle-orm'
import { ulid } from 'ulid'
import { activities } from '../db/activitySchema.js'
import { activityMigrations } from '../db/activityMigrations.js'
import packageJson from '../../package.json' assert { type: 'json' }

const execAsync = promisify(exec)

interface NotificationOptions {
  persistent?: boolean
  replaceId?: number
  returnId?: boolean
}

async function sendNotification(
  title: string,
  message: string,
  options: NotificationOptions = {},
): Promise<number | undefined> {
  try {
    const escapedTitle = title.replace(/"/g, '\\"')
    const escapedMessage = message.replace(/"/g, '\\"')

    let command = `notify-send`

    if (options.persistent) {
      command += ` --hint=int:transient:0`
    }

    if (options.replaceId !== undefined) {
      command += ` --replace-id=${options.replaceId}`
    }

    if (options.returnId) {
      command += ` --print-id`
    }

    command += ` "${escapedTitle}" "${escapedMessage}"`

    const { stdout } = await execAsync(command)

    if (options.returnId && stdout) {
      return parseInt(stdout.trim(), 10)
    }
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
  return undefined
}

function getNotificationIdPath(projectName: string): string {
  const safeName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_')
  return join(tmpdir(), `activity_notification_${safeName}.id`)
}

function saveNotificationId(projectName: string, id: number): void {
  const path = getNotificationIdPath(projectName)
  writeFileSync(path, id.toString(), 'utf-8')
}

function loadNotificationId(projectName: string): number | undefined {
  const path = getNotificationIdPath(projectName)
  try {
    if (existsSync(path)) {
      const id = parseInt(readFileSync(path, 'utf-8'), 10)
      return isNaN(id) ? undefined : id
    }
  } catch (error) {
    console.error('Failed to load notification ID:', error)
  }
  return undefined
}

function deleteNotificationId(projectName: string): void {
  const path = getNotificationIdPath(projectName)
  try {
    if (existsSync(path)) {
      unlinkSync(path)
    }
  } catch (error) {
    console.error('Failed to delete notification ID file:', error)
  }
}

function setupDatabase(dbPath: string) {
  const absolutePath = dbPath.startsWith('/')
    ? dbPath
    : `${process.cwd()}/${dbPath}`
  const dbDir = dirname(absolutePath)

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const sqlite = new Database(absolutePath)

  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('busy_timeout = 5000')

  const db = drizzle(sqlite)

  if (
    !existsSync(absolutePath) ||
    sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='activities'",
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

    for (const [tag, sql] of Object.entries(activityMigrations.migrations)) {
      const hash = tag
      const existing = sqlite
        .prepare('SELECT hash FROM __drizzle_migrations WHERE hash = ?')
        .get(hash)

      if (!existing) {
        sqlite.exec(sql)
        sqlite
          .prepare(
            'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
          )
          .run(hash, Date.now())
      }
    }
  }

  return { sqlite, db }
}

async function handleStdinData(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    process.stdin.on('data', chunk => {
      chunks.push(chunk)
    })

    process.stdin.on('end', () => {
      const jsonData = Buffer.concat(chunks).toString().trim()

      if (!jsonData) {
        reject(new Error('No JSON data received from stdin'))
        return
      }

      try {
        JSON.parse(jsonData)
        resolve(jsonData)
      } catch (error) {
        reject(new Error('Invalid JSON data received from stdin'))
      }
    })

    process.stdin.on('error', error => {
      reject(new Error(`Error reading from stdin: ${error.message}`))
    })
  })
}

export async function activityStartCommand(dbPath: string): Promise<void> {
  const { sqlite, db } = setupDatabase(dbPath)
  const projectName = packageJson.name

  try {
    const jsonData = await handleStdinData()
    const id = ulid()

    const maxRetries = 5
    let retryCount = 0
    let success = false

    while (retryCount < maxRetries && !success) {
      try {
        sqlite.prepare('BEGIN IMMEDIATE').run()

        await db.insert(activities).values({
          id,
          action: 'start',
          project: projectName,
          data: jsonData,
          cwd: process.cwd(),
          created: new Date(),
        })

        sqlite.prepare('COMMIT').run()
        success = true
        console.error(`Activity started with ID: ${id}`)

        const notificationId = await sendNotification(
          `🔴 ${projectName}`,
          'Activity in progress...',
          { persistent: true, returnId: true },
        )

        if (notificationId) {
          saveNotificationId(projectName, notificationId)
        }
      } catch (error: any) {
        sqlite.prepare('ROLLBACK').run()

        if (error.code === 'SQLITE_BUSY' && retryCount < maxRetries - 1) {
          retryCount++
          const waitTime = Math.min(100 * Math.pow(2, retryCount), 1000)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          throw error
        }
      }
    }

    if (!success) {
      throw new Error('Failed to store activity after maximum retries')
    }
  } catch (error) {
    console.error('Error:', error)
    throw error
  } finally {
    sqlite.close()
  }
}

export async function activityStopCommand(dbPath: string): Promise<void> {
  const { sqlite, db } = setupDatabase(dbPath)
  const projectName = packageJson.name

  try {
    const jsonData = await handleStdinData()

    const latestStart = await db
      .select()
      .from(activities)
      .where(eq(activities.action, 'start'))
      .orderBy(desc(activities.created))
      .limit(1)
      .get()

    let durationMessage = ''
    if (latestStart) {
      const startTime = latestStart.created.getTime()
      const now = Date.now()
      const durationMs = now - startTime
      const durationMinutes = Math.floor(durationMs / 60000)
      const durationSeconds = Math.floor((durationMs % 60000) / 1000)

      if (durationMinutes > 0) {
        durationMessage = `Duration: ${durationMinutes}m ${durationSeconds}s`
      } else {
        durationMessage = `Duration: ${durationSeconds}s`
      }

      console.error(
        `Latest activity started at: ${latestStart.created.toISOString()}`,
      )
      console.error(durationMessage)
    } else {
      console.error('No previous start activity found')
    }

    const id = ulid()

    const maxRetries = 5
    let retryCount = 0
    let success = false

    while (retryCount < maxRetries && !success) {
      try {
        sqlite.prepare('BEGIN IMMEDIATE').run()

        await db.insert(activities).values({
          id,
          action: 'stop',
          project: projectName,
          data: jsonData,
          cwd: process.cwd(),
          created: new Date(),
        })

        sqlite.prepare('COMMIT').run()
        success = true
        console.error(`Activity stopped with ID: ${id}`)

        const existingNotificationId = loadNotificationId(projectName)

        const notificationTitle = `✅ ${projectName}`
        const notificationMessage = durationMessage
          ? `Activity completed - ${durationMessage}`
          : 'Activity completed'

        await sendNotification(notificationTitle, notificationMessage, {
          persistent: true,
          replaceId: existingNotificationId,
        })

        deleteNotificationId(projectName)
      } catch (error: any) {
        sqlite.prepare('ROLLBACK').run()

        if (error.code === 'SQLITE_BUSY' && retryCount < maxRetries - 1) {
          retryCount++
          const waitTime = Math.min(100 * Math.pow(2, retryCount), 1000)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          throw error
        }
      }
    }

    if (!success) {
      throw new Error('Failed to store activity after maximum retries')
    }
  } catch (error) {
    console.error('Error:', error)
    throw error
  } finally {
    sqlite.close()
  }
}
