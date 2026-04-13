/**
 * Standalone migration runner (drizzle-orm migrator).
 * Используется в Docker при запуске сервиса migrate.
 * Не требует drizzle-kit — только drizzle-orm и pg.
 *
 * Запуск: npx tsx server/db/migrations/migrate.ts
 */
import 'dotenv/config'
import { join } from 'node:path'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

/** Ожидается cwd = корень репозитория (или /app в Docker). */
function migrationsFolder(): string {
  return join(process.cwd(), 'server', 'db', 'migrations')
}

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('[migrate] DATABASE_URL not set')
    process.exit(1)
  }

  console.log('[migrate] Connecting to database...')
  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool)

  try {
    console.log('[migrate] Running migrations...')
    await migrate(db, { migrationsFolder: migrationsFolder() })
    console.log('[migrate] Done.')
  }
  finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[migrate] Failed:', err)
  process.exit(1)
})
