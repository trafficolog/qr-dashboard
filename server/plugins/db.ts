import { db } from '../db'
import { sql } from 'drizzle-orm'

export default defineNitroPlugin(async () => {
  console.log('[DB] Initializing PostgreSQL connection pool...')

  try {
    await db.execute(sql`SELECT 1`)
    console.log('[DB] Connection verified successfully')
  } catch (error) {
    console.error('[DB] Connection failed:', error)
    throw error
  }
})
